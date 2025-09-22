import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Film, Users, Search, User, Plus } from "lucide-react"
import Link from "next/link"
import { FriendRecommendations } from "@/components/friend-recommendations"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MobileNavigation } from "@/components/mobile-navigation"
import { DismissibleMovieSuggestions } from "@/components/dismissible-movie-suggestions"
import { ReelClubMatches } from "@/components/reel-club-matches"

async function AIMovieSuggestions() {
  let supabase
  let userProfile = null
  let user = null

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      supabase = await createClient()
    } catch (error) {
      supabase = null
    }
  }

  if (supabase) {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    user = authUser

    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("username, display_name, city, state, zip_code, preferred_movie_genres, preferred_series_genres")
        .eq("id", user.id)
        .single()

      userProfile = profile

      if (!profile?.username || !profile?.display_name || !profile?.city || !profile?.state || !profile?.zip_code) {
        redirect("/onboarding")
      }
    }
  }

  let userRecommendations = []
  const recommendationGenres = new Set<string>()
  let isPersonalized = false

  if (supabase && user) {
    try {
      // Get user's recommendation list items
      const { data: recommendationsList } = await supabase
        .from("list_items")
        .select(`
          tmdb_id,
          media_type,
          title,
          poster_path,
          overview,
          release_date,
          rating,
          lists!inner(type, user_id)
        `)
        .eq("lists.user_id", user.id)
        .eq("lists.type", "recommendations")
        .limit(20) // Get more items for better genre analysis

      userRecommendations = recommendationsList || []
      console.log("[v0] Found user recommendations:", userRecommendations.length)

      if (userRecommendations.length > 0) {
        // Extract genres from user's existing recommendations using TMDB API
        for (const item of userRecommendations.slice(0, 10)) {
          // Limit API calls
          try {
            const endpoint = item.media_type === "movie" ? "movie" : "tv"
            const tmdbUrl = `https://api.themoviedb.org/3/${endpoint}/${item.tmdb_id}`

            const headers: Record<string, string> = {
              "Content-Type": "application/json",
            }

            // Use the same authentication logic as the TMDB client
            const token = process.env.TMDB_API_READ_ACCESS_TOKEN || process.env.TMBD_API_KEY
            if (token) {
              if (token.length <= 40 && !token.includes(".")) {
                // v3 API key
                const response = await fetch(`${tmdbUrl}?api_key=${token}`, { headers })
                if (response.ok) {
                  const data = await response.json()
                  data.genres?.forEach((genre: any) => recommendationGenres.add(genre.id.toString()))
                }
              } else {
                // v4 Read Access Token
                headers.Authorization = `Bearer ${token}`
                const response = await fetch(tmdbUrl, { headers })
                if (response.ok) {
                  const data = await response.json()
                  data.genres?.forEach((genre: any) => recommendationGenres.add(genre.id.toString()))
                }
              }
            }
          } catch (error) {
            console.log("[v0] Error fetching genres for item:", item.title, error)
          }
        }

        console.log("[v0] Extracted genres from recommendations:", Array.from(recommendationGenres))

        if (recommendationGenres.size > 0) {
          isPersonalized = true
        }
      }
    } catch (error) {
      console.log("[v0] Error fetching user recommendations:", error)
    }
  }

  if (isPersonalized && recommendationGenres.size > 0) {
    try {
      const genreIds = Array.from(recommendationGenres).slice(0, 4).join(",")
      const recommendationIds = userRecommendations.map((item) => item.tmdb_id)

      console.log("[v0] Generating personalized recommendations with genres:", genreIds)

      // Use the discover API with proper authentication
      const discoverUrl = `/api/tmdb/discover?with_genres=${genreIds}&sort_by=popularity.desc&page=${Math.floor(Math.random() * 3) + 1}`

      const response = await fetch(discoverUrl)

      if (response.ok) {
        const data = await response.json()
        const suggestions =
          data.results?.filter((movie: any) => !recommendationIds.includes(movie.id)).slice(0, 10) || []

        if (suggestions.length > 0) {
          console.log("[v0] Found", suggestions.length, "personalized suggestions based on recommendations")
          return renderMovieSuggestions(suggestions, Array.from(recommendationGenres), userProfile, true)
        }
      } else {
        console.log("[v0] Discover API failed, falling back to profile preferences")
      }
    } catch (error) {
      console.log("[v0] Error generating personalized recommendations:", error)
    }
  }

  const defaultGenres = ["28", "12", "878", "35"] // Action, Adventure, Sci-Fi, Comedy
  let movieGenres = defaultGenres

  // Use user's profile preferences if available
  if (userProfile?.preferred_movie_genres && userProfile.preferred_movie_genres.length > 0) {
    movieGenres = userProfile.preferred_movie_genres
    console.log("[v0] Using user profile movie genres:", movieGenres)
  } else if (recommendationGenres.size > 0) {
    // Use genres from recommendations even if API calls failed
    movieGenres = Array.from(recommendationGenres).slice(0, 4)
    isPersonalized = true
    console.log("[v0] Using genres extracted from recommendations:", movieGenres)
  }

  const fallbackMovies = [
    {
      id: 550,
      title: "Fight Club",
      overview: "An insomniac office worker and a devil-may-care soap maker form an underground fight club.",
      poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      vote_average: 8.4,
      release_date: "1999-10-15",
    },
    {
      id: 13,
      title: "Forrest Gump",
      overview:
        "The presidencies of Kennedy and Johnson, Vietnam, Watergate, and other history unfold through the perspective of an Alabama man.",
      poster_path: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
      vote_average: 8.5,
      release_date: "1994-07-06",
    },
    {
      id: 155,
      title: "The Dark Knight",
      overview:
        "Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.",
      poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      vote_average: 9.0,
      release_date: "2008-07-18",
    },
    {
      id: 680,
      title: "Pulp Fiction",
      overview:
        "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.",
      poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
      vote_average: 8.9,
      release_date: "1994-10-14",
    },
  ]

  try {
    const genreIds = movieGenres.join(",")
    const discoverUrl = `/api/tmdb/discover?with_genres=${genreIds}&sort_by=popularity.desc&page=${Math.floor(Math.random() * 5) + 1}`

    console.log("[v0] Fetching recommendations from discover API")

    const response = await fetch(discoverUrl)

    if (response.ok) {
      const data = await response.json()
      console.log("[v0] Discover API success, got", data.results?.length || 0, "movies")

      const suggestions = data.results?.slice(0, 10) || []

      if (suggestions.length === 0) {
        console.log("[v0] No movies returned from discover API, using fallback")
        return renderMovieSuggestions(fallbackMovies, movieGenres, userProfile, isPersonalized)
      }

      return renderMovieSuggestions(suggestions, movieGenres, userProfile, isPersonalized)
    } else {
      console.log("[v0] Discover API failed, using fallback movies")
      return renderMovieSuggestions(fallbackMovies, movieGenres, userProfile, isPersonalized)
    }
  } catch (error) {
    console.log("[v0] Error fetching from discover API:", error)
    return renderMovieSuggestions(fallbackMovies, movieGenres, userProfile, isPersonalized)
  }
}

function renderMovieSuggestions(suggestions: any[], movieGenres: string[], userProfile: any, isPersonalized = false) {
  return (
    <DismissibleMovieSuggestions
      initialSuggestions={suggestions}
      movieGenres={movieGenres}
      userProfile={userProfile}
      isPersonalized={isPersonalized}
    />
  )
}

export default async function FeedPage() {
  let supabase
  let user = null
  let profile = null

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      supabase = await createClient()
    } catch (error) {
      supabase = null
    }
  }

  if (supabase) {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    user = authUser

    if (user) {
      const { data: userProfile } = await supabase
        .from("users")
        .select("username, display_name, city, state, zip_code, preferred_movie_genres, preferred_series_genres")
        .eq("id", user.id)
        .single()

      profile = userProfile

      if (!profile?.username || !profile?.display_name || !profile?.city || !profile?.state || !profile?.zip_code) {
        redirect("/onboarding")
      }
    }
  }

  const aiMovieSuggestionsContent = await AIMovieSuggestions()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-20 md:pb-8">
        <header className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-2">
            <Film className="h-7 w-7 sm:h-8 sm:w-8 text-purple-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">Reel Friends</h1>
          </div>
          <nav className="hidden md:flex gap-2">
            <Button variant="ghost" asChild className="text-white hover:bg-white/10">
              <Link href="/explore">
                <Search className="h-4 w-4 mr-2" />
                Explore
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-white hover:bg-white/10">
              <Link href="/friends">
                <Users className="h-4 w-4 mr-2" />
                Friends
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-white hover:bg-white/10">
              <Link href="/lists">
                <Plus className="h-4 w-4 mr-2" />
                Lists
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-white hover:bg-white/10">
              <Link href="/profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </Button>
          </nav>
        </header>

        <div className="max-w-2xl mx-auto">
          <Tabs defaultValue="following" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/5 border-white/10 h-12 sm:h-10">
              <TabsTrigger
                value="following"
                className="data-[state=active]:bg-purple-600 text-xs sm:text-sm min-h-[44px] sm:min-h-[36px]"
              >
                Following
              </TabsTrigger>
              <TabsTrigger
                value="reel-club"
                className="data-[state=active]:bg-purple-600 text-xs sm:text-sm min-h-[44px] sm:min-h-[36px]"
              >
                Reel Club
              </TabsTrigger>
              <TabsTrigger
                value="recommendations"
                className="data-[state=active]:bg-purple-600 text-xs sm:text-sm min-h-[44px] sm:min-h-[36px]"
              >
                For You
              </TabsTrigger>
            </TabsList>

            <TabsContent value="following" className="mt-6">
              <FriendRecommendations />
            </TabsContent>

            <TabsContent value="reel-club" className="mt-6">
              <ReelClubMatches />
            </TabsContent>

            <TabsContent value="recommendations" className="mt-6">
              {aiMovieSuggestionsContent}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <MobileNavigation />
    </div>
  )
}
