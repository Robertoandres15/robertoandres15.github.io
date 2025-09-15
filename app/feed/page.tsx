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
        .select("username, display_name, city, state, zip_code")
        .eq("id", user.id)
        .single()

      userProfile = profile

      if (!profile?.username || !profile?.display_name || !profile?.city || !profile?.state || !profile?.zip_code) {
        redirect("/onboarding")
      }
    }
  }

  let userRecommendations = []
  if (supabase && user) {
    try {
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
        .limit(10)

      userRecommendations = recommendationsList || []
    } catch (error) {
      console.log("[v0] Error fetching user recommendations:", error)
    }
  }

  if (userRecommendations.length > 0) {
    try {
      // Get genres from user's recommendations to find similar content
      const recommendationGenres = new Set()
      const recommendationIds = userRecommendations.map((item) => item.tmdb_id)

      // Extract genres from user's existing recommendations
      for (const item of userRecommendations) {
        if (item.media_type === "movie") {
          // Use TMDB API to get movie details and extract genres
          const movieResponse = await fetch(
            `https://api.themoviedb.org/3/movie/${item.tmdb_id}?api_key=${process.env.TMDB_API_READ_ACCESS_TOKEN}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.TMDB_API_READ_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
            },
          )
          if (movieResponse.ok) {
            const movieData = await movieResponse.json()
            movieData.genres?.forEach((genre) => recommendationGenres.add(genre.id.toString()))
          }
        }
      }

      // If we have genres from recommendations, use them for discovery
      if (recommendationGenres.size > 0) {
        const genreIds = Array.from(recommendationGenres).slice(0, 4).join(",")

        const discoverUrl = `https://api.themoviedb.org/3/discover/movie?with_genres=${genreIds}&sort_by=popularity.desc&page=1`
        const headers = {
          Authorization: `Bearer ${process.env.TMDB_API_READ_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        }

        console.log("[v0] Fetching personalized recommendations based on user's list")

        const response = await fetch(discoverUrl, { headers })

        if (response.ok) {
          const data = await response.json()
          const suggestions = data.results?.filter((movie) => !recommendationIds.includes(movie.id)).slice(0, 10) || []

          if (suggestions.length > 0) {
            console.log("[v0] Found", suggestions.length, "personalized suggestions based on recommendations list")
            return renderMovieSuggestions(suggestions, Array.from(recommendationGenres), userProfile, true)
          }
        }
      }
    } catch (error) {
      console.log("[v0] Error generating personalized recommendations:", error)
    }
  }

  const defaultGenres = ["28", "12", "878", "35"] // Action, Adventure, Sci-Fi, Comedy
  const movieGenres = userProfile?.movie_genres || defaultGenres

  const fallbackMovies = [
    {
      id: 1,
      title: "The Matrix",
      overview: "A computer programmer discovers that reality as he knows it is a simulation controlled by machines.",
      poster_path: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      vote_average: 8.7,
      release_date: "1999-03-31",
    },
    {
      id: 2,
      title: "Inception",
      overview:
        "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.",
      poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
      vote_average: 8.8,
      release_date: "2010-07-16",
    },
    {
      id: 3,
      title: "Interstellar",
      overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
      poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      vote_average: 8.6,
      release_date: "2014-11-07",
    },
  ]

  try {
    if (!process.env.TMDB_API_READ_ACCESS_TOKEN && !process.env.TMDB_API_KEY) {
      console.log("[v0] No TMDB API credentials configured, using fallback movies")
      return renderMovieSuggestions(fallbackMovies, movieGenres, userProfile, false)
    }

    const genreIds = movieGenres.join(",")

    let tmdbUrl = `https://api.themoviedb.org/3/discover/movie?with_genres=${genreIds}&sort_by=popularity.desc&page=1`
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    // Try Read Access Token method first
    if (process.env.TMDB_API_READ_ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${process.env.TMDB_API_READ_ACCESS_TOKEN}`
      console.log("[v0] Using TMDB Read Access Token authentication")
    } else if (process.env.TMDB_API_KEY) {
      tmdbUrl += `&api_key=${process.env.TMDB_API_KEY}`
      console.log("[v0] Using TMDB API Key authentication")
    }

    console.log("[v0] Fetching TMDB recommendations from:", tmdbUrl.replace(/api_key=[^&]+/, "api_key=***"))

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(tmdbUrl, {
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log("[v0] TMDB API response status:", response.status)

    if (!response.ok && response.status === 401 && process.env.TMDB_API_READ_ACCESS_TOKEN && process.env.TMDB_API_KEY) {
      console.log("[v0] Read Access Token failed, trying API Key method")

      const fallbackUrl = `https://api.themoviedb.org/3/discover/movie?with_genres=${genreIds}&sort_by=popularity.desc&page=1&api_key=${process.env.TMDB_API_KEY}`
      const fallbackHeaders = {
        "Content-Type": "application/json",
      }

      const fallbackController = new AbortController()
      const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 10000)

      const fallbackResponse = await fetch(fallbackUrl, {
        headers: fallbackHeaders,
        signal: fallbackController.signal,
      })

      clearTimeout(fallbackTimeoutId)
      console.log("[v0] TMDB API Key fallback response status:", fallbackResponse.status)

      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json()
        console.log("[v0] TMDB API Key fallback success, got", data.results?.length || 0, "movies")

        const suggestions = data.results?.slice(0, 10) || []
        if (suggestions.length === 0) {
          console.log("[v0] No movies returned from TMDB fallback, using local fallback")
          return renderMovieSuggestions(fallbackMovies, movieGenres, userProfile, false)
        }
        return renderMovieSuggestions(suggestions, movieGenres, userProfile, false)
      }
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] TMDB API error response:", errorText)
      console.log("[v0] Using fallback movies due to API error")
      return renderMovieSuggestions(fallbackMovies, movieGenres, userProfile, false)
    }

    const data = await response.json()
    console.log("[v0] TMDB API success, got", data.results?.length || 0, "movies")

    const suggestions = data.results?.slice(0, 10) || []

    if (suggestions.length === 0) {
      console.log("[v0] No movies returned from TMDB, using fallback")
      return renderMovieSuggestions(fallbackMovies, movieGenres, userProfile, false)
    }

    return renderMovieSuggestions(suggestions, movieGenres, userProfile, false)
  } catch (error) {
    console.log("[v0] TMDB API fetch failed:", error.message)
    console.log("[v0] Using fallback movies due to network error")

    return renderMovieSuggestions(fallbackMovies, movieGenres, userProfile, false)
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
        .select("username, display_name, city, state, zip_code")
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
