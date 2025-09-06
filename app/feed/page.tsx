import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Film, Users, Search, User, Star, Plus } from "lucide-react"
import Link from "next/link"
import { FriendRecommendations } from "@/components/friend-recommendations"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MobileNavigation } from "@/components/mobile-navigation"

async function ReelClub() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
          <Users className="h-8 w-8 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Reel Club</h3>
        <p className="text-slate-400 mb-4">Connect with friends to discover movies you both want to watch together.</p>
        <Button asChild className="bg-purple-600 hover:bg-purple-700">
          <Link href="/explore">Explore Movies</Link>
        </Button>
      </div>
    )
  }

  let supabase
  try {
    supabase = await createClient()
  } catch (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
          <Users className="h-8 w-8 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Reel Club</h3>
        <p className="text-slate-400 mb-4">Connect with friends to discover movies you both want to watch together.</p>
        <Button asChild className="bg-purple-600 hover:bg-purple-700">
          <Link href="/explore">Explore Movies</Link>
        </Button>
      </div>
    )
  }

  if (!supabase) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <Users className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Configuration Issue</h3>
        <p className="text-slate-400 mb-4">
          Supabase integration is not properly configured. Please check your Project Settings.
        </p>
        <Button asChild className="bg-purple-600 hover:bg-purple-700">
          <Link href="/explore">Explore Movies</Link>
        </Button>
      </div>
    )
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
            <Users className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Sign in to see Reel Club</h3>
          <p className="text-slate-400 mb-4">
            Connect with friends and discover movies you both want to watch together.
          </p>
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link href="/auth/sign-in">Sign In</Link>
          </Button>
        </div>
      )
    }

    // Get user's friends
    const { data: friendships } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", user.id)
      .eq("status", "accepted")

    if (!friendships || friendships.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
            <Users className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No friends yet!</h3>
          <p className="text-slate-400 mb-4">Add friends to discover movies you both want to watch together.</p>
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link href="/friends">Find Friends</Link>
          </Button>
        </div>
      )
    }

    const friendIds = friendships.map((f) => f.friend_id)

    // Get user's wishlist items
    const { data: userWishlist } = await supabase
      .from("list_items")
      .select(`
        tmdb_id,
        media_type,
        title,
        poster_path,
        lists!inner(type, user_id)
      `)
      .eq("lists.user_id", user.id)
      .eq("lists.type", "wishlist")

    // Get friends' wishlist items
    const { data: friendsWishlist } = await supabase
      .from("list_items")
      .select(`
        tmdb_id,
        media_type,
        title,
        poster_path,
        lists!inner(type, user_id),
        users:lists(username, display_name, avatar_url)
      `)
      .in("lists.user_id", friendIds)
      .eq("lists.type", "wishlist")

    // Find shared items
    const sharedItems =
      userWishlist?.filter((userItem) =>
        friendsWishlist?.some(
          (friendItem) => friendItem.tmdb_id === userItem.tmdb_id && friendItem.media_type === userItem.media_type,
        ),
      ) || []

    if (sharedItems.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
            <Users className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No shared interests yet!</h3>
          <p className="text-slate-400 mb-4">Add movies to your wishlist to find matches with your friends.</p>
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link href="/explore">Explore Movies</Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {sharedItems.map((item) => {
          const friendsWithItem =
            friendsWishlist?.filter((f) => f.tmdb_id === item.tmdb_id && f.media_type === item.media_type) || []

          return (
            <div key={`${item.tmdb_id}-${item.media_type}`} className="bg-white/5 rounded-lg p-4">
              <div className="flex gap-4">
                <img
                  src={
                    item.poster_path
                      ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
                      : `/placeholder.svg?height=120&width=80&query=${item.title} poster`
                  }
                  alt={item.title}
                  className="w-20 h-30 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm mb-3">
                    Also on {friendsWithItem.map((f) => f.users?.display_name || f.users?.username).join(", ")}'s
                    wishlist
                  </p>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <Users className="h-4 w-4 mr-2" />
                    Watch Together
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  } catch (error) {
    console.error("ReelClub error:", error)
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Error loading Reel Club content</p>
      </div>
    )
  }
}

async function AIMovieSuggestions() {
  let supabase
  let userProfile = null
  let user = null

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      supabase = await createClient()
      if (supabase) {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()
        user = authUser

        if (user) {
          const { data: profile } = await supabase
            .from("users")
            .select(`
              streaming_services,
              theater_frequency,
              series_preference,
              movie_genres,
              series_genres
            `)
            .eq("id", user.id)
            .single()
          userProfile = profile
        }
      }
    } catch (error) {
      // Silently handle Supabase errors and use fallback
      supabase = null
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
      return renderMovieSuggestions(fallbackMovies, movieGenres, userProfile)
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
          return renderMovieSuggestions(fallbackMovies, movieGenres, userProfile)
        }
        return renderMovieSuggestions(suggestions, movieGenres, userProfile)
      }
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] TMDB API error response:", errorText)
      console.log("[v0] Using fallback movies due to API error")
      return renderMovieSuggestions(fallbackMovies, movieGenres, userProfile)
    }

    const data = await response.json()
    console.log("[v0] TMDB API success, got", data.results?.length || 0, "movies")

    const suggestions = data.results?.slice(0, 10) || []

    if (suggestions.length === 0) {
      console.log("[v0] No movies returned from TMDB, using fallback")
      return renderMovieSuggestions(fallbackMovies, movieGenres, userProfile)
    }

    return renderMovieSuggestions(suggestions, movieGenres, userProfile)
  } catch (error) {
    console.log("[v0] TMDB API fetch failed:", error.message)
    console.log("[v0] Using fallback movies due to network error")

    return renderMovieSuggestions(fallbackMovies, movieGenres, userProfile)
  }
}

function renderMovieSuggestions(suggestions: any[], movieGenres: string[], userProfile: any) {
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">
          {userProfile ? "AI Recommendations for You" : "Popular Movies You Might Like"}
        </h2>
        <p className="text-slate-400 text-sm">
          {userProfile ? "Based on your preferences: " : "Based on popular genres: "}
          {movieGenres
            .map((id) => {
              const genreMap: { [key: string]: string } = {
                "28": "Action",
                "12": "Adventure",
                "16": "Animation",
                "35": "Comedy",
                "80": "Crime",
                "99": "Documentary",
                "18": "Drama",
                "10751": "Family",
                "14": "Fantasy",
                "36": "History",
                "27": "Horror",
                "10402": "Music",
                "9648": "Mystery",
                "10749": "Romance",
                "878": "Sci-Fi",
                "10770": "TV Movie",
                "53": "Thriller",
                "10752": "War",
                "37": "Western",
              }
              return genreMap[id.toString()] || "Unknown"
            })
            .join(", ")}
          {!userProfile && (
            <span className="block mt-1 text-xs">Complete your profile to get personalized recommendations!</span>
          )}
        </p>
      </div>

      {suggestions.map((movie: any) => (
        <div key={movie.id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <img
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                    : `/placeholder.svg?height=120&width=80&query=${movie.title} poster`
                }
                alt={movie.title}
                className="w-24 h-36 sm:w-20 sm:h-30 rounded-lg object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h3 className="text-white font-semibold mb-2 text-lg sm:text-base leading-tight">{movie.title}</h3>
              <p className="text-slate-400 text-sm mb-3 line-clamp-3 sm:line-clamp-2 leading-relaxed">
                {movie.overview}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-slate-300">{movie.vote_average?.toFixed(1)}</span>
                </div>
                <span className="text-slate-500">•</span>
                <span className="text-sm text-slate-400">{new Date(movie.release_date).getFullYear()}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 min-h-[44px] sm:min-h-[36px] w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Wishlist
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent min-h-[44px] sm:min-h-[36px] w-full sm:w-auto"
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
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

  const reelClubContent = await ReelClub()
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
              {reelClubContent}
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
