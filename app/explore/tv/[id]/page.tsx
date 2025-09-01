"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Star, Calendar, Tv, Plus, Heart, Share2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface TVDetails {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  last_air_date: string
  vote_average: number
  vote_count: number
  number_of_episodes: number
  number_of_seasons: number
  genres: Array<{ id: number; name: string }>
  networks: Array<{ id: number; name: string; logo_path: string | null }>
  tagline: string
  status: string
  type: string
  original_language: string
  episode_run_time: number[]
}

interface List {
  id: string
  name: string
  type: "wishlist" | "recommendations"
}

interface WatchProvider {
  display_priority: number
  logo_path: string
  provider_id: number
  provider_name: string
}

interface WatchProviders {
  id: number
  results: {
    [countryCode: string]: {
      link: string
      flatrate?: WatchProvider[]
      rent?: WatchProvider[]
      buy?: WatchProvider[]
    }
  }
}

export default function TVDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [tvShow, setTVShow] = useState<TVDetails | null>(null)
  const [userLists, setUserLists] = useState<List[]>([])
  const [watchProviders, setWatchProviders] = useState<WatchProviders | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false)
  const [isAddingToRecommendations, setIsAddingToRecommendations] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadTVDetails()
      loadUserLists()
      loadWatchProviders()
    }
  }, [params.id])

  const loadTVDetails = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tmdb/details?id=${params.id}&type=tv`)

      if (!response.ok) {
        throw new Error(`Failed to load TV show details: ${response.status}`)
      }

      const data = await response.json()
      setTVShow(data)
    } catch (error) {
      console.error("Failed to load TV show details:", error)
      toast({
        title: "Failed to load TV show details",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserLists = async () => {
    try {
      const response = await fetch("/api/lists")
      const data = await response.json()
      if (response.ok) {
        setUserLists(data.lists || [])
      }
    } catch (error) {
      console.error("Failed to load user lists:", error)
    }
  }

  const loadWatchProviders = async () => {
    try {
      const response = await fetch(`/api/tmdb/watch-providers?id=${params.id}&type=tv`)
      if (response.ok) {
        const data = await response.json()
        setWatchProviders(data)
      }
    } catch (error) {
      console.error("Failed to load watch providers:", error)
    }
  }

  const addToWishlist = async () => {
    if (!tvShow) return

    setIsAddingToWishlist(true)
    try {
      // Find or create wishlist
      let wishlist = userLists.find((list) => list.type === "wishlist")

      if (!wishlist) {
        // Create default wishlist if it doesn't exist
        const createResponse = await fetch("/api/lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "My Wishlist",
            type: "wishlist",
            description: "Movies and shows I want to watch",
            is_public: false,
          }),
        })

        if (createResponse.ok) {
          const newList = await createResponse.json()
          wishlist = newList.list
          setUserLists((prev) => [...prev, wishlist!])
        } else {
          throw new Error("Failed to create wishlist")
        }
      }

      // Add TV show to wishlist
      const response = await fetch(`/api/lists/${wishlist.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdb_id: tvShow.id,
          media_type: "tv",
          title: tvShow.name,
          poster_path: tvShow.poster_path,
          overview: tvShow.overview,
          release_date: tvShow.first_air_date,
          rating: tvShow.vote_average,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Added to Wishlist",
          description: `${tvShow.name} has been added to your wishlist`,
        })
      } else {
        toast({
          title: "Failed to add to wishlist",
          description: data.error || "An error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to add to wishlist:", error)
      toast({
        title: "Failed to add to wishlist",
        description: "An error occurred while adding to your wishlist",
        variant: "destructive",
      })
    } finally {
      setIsAddingToWishlist(false)
    }
  }

  const addToRecommendations = async () => {
    if (!tvShow) return

    setIsAddingToRecommendations(true)
    try {
      // Find or create recommendations list
      let recommendations = userLists.find((list) => list.type === "recommendations")

      if (!recommendations) {
        // Create default recommendations list if it doesn't exist
        const createResponse = await fetch("/api/lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "My Recommendations",
            type: "recommendations",
            description: "Movies and shows I recommend to others",
            is_public: true,
          }),
        })

        if (createResponse.ok) {
          const newList = await createResponse.json()
          recommendations = newList.list
          setUserLists((prev) => [...prev, recommendations!])
        } else {
          throw new Error("Failed to create recommendations list")
        }
      }

      // Add TV show to recommendations
      const response = await fetch(`/api/lists/${recommendations.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdb_id: tvShow.id,
          media_type: "tv",
          title: tvShow.name,
          poster_path: tvShow.poster_path,
          overview: tvShow.overview,
          release_date: tvShow.first_air_date,
          rating: tvShow.vote_average,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Added to Recommendations",
          description: `${tvShow.name} has been added to your recommendations`,
        })
      } else {
        toast({
          title: "Failed to add to recommendations",
          description: data.error || "An error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to add to recommendations:", error)
      toast({
        title: "Failed to add to recommendations",
        description: "An error occurred while adding to your recommendations",
        variant: "destructive",
      })
    } finally {
      setIsAddingToRecommendations(false)
    }
  }

  const getStreamingUrl = (provider: WatchProvider) => {
    const streamingUrls: { [key: string]: string } = {
      Netflix: "https://www.netflix.com",
      "Amazon Prime Video": "https://www.amazon.com/prime-video",
      "Disney Plus": "https://www.disneyplus.com",
      "HBO Max": "https://www.hbomax.com",
      Hulu: "https://www.hulu.com",
      "Apple TV Plus": "https://tv.apple.com",
      "Paramount Plus": "https://www.paramountplus.com",
      Peacock: "https://www.peacocktv.com",
      Crunchyroll: "https://www.crunchyroll.com",
      YouTube: "https://www.youtube.com",
      "Google Play Movies & TV": "https://play.google.com/store/movies",
      Vudu: "https://www.vudu.com",
      "Microsoft Store": "https://www.microsoft.com/en-us/store/movies-and-tv",
    }
    return streamingUrls[provider.provider_name] || "#"
  }

  const getPosterUrl = (posterPath: string | null) => {
    if (!posterPath) return "/placeholder.svg?height=600&width=400"
    return `https://image.tmdb.org/t/p/w500${posterPath}`
  }

  const getBackdropUrl = (backdropPath: string | null) => {
    if (!backdropPath) return "/placeholder.svg?height=400&width=800"
    return `https://image.tmdb.org/t/p/w1280${backdropPath}`
  }

  const formatRuntime = (minutes: number[]) => {
    if (!minutes || minutes.length === 0) return "N/A"
    const avgRuntime = minutes.reduce((a, b) => a + b, 0) / minutes.length
    return `${Math.round(avgRuntime)}m avg`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!tvShow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">TV show not found</div>
          <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
            <Link href="/explore">Back to Explore</Link>
          </Button>
        </div>
      </div>
    )
  }

  const usProviders = watchProviders?.results?.US

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Backdrop */}
      <div className="relative h-96 overflow-hidden">
        <Image
          src={getBackdropUrl(tvShow.backdrop_path) || "/placeholder.svg"}
          alt={tvShow.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="border-white/20 text-white hover:bg-white/10 bg-black/20 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Poster */}
          <div className="lg:col-span-1">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                  <Image
                    src={getPosterUrl(tvShow.poster_path) || "/placeholder.svg"}
                    alt={tvShow.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Actions */}
            <div className="space-y-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{tvShow.name}</h1>
                {tvShow.tagline && <p className="text-xl text-slate-300 italic">{tvShow.tagline}</p>}
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={addToWishlist}
                  disabled={isAddingToWishlist}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isAddingToWishlist ? "Adding..." : "Add to Wishlist"}
                </Button>
                <Button
                  onClick={addToRecommendations}
                  disabled={isAddingToRecommendations}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  {isAddingToRecommendations ? "Adding..." : "Recommend"}
                </Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 text-slate-300">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{tvShow.vote_average.toFixed(1)}</span>
                <span className="text-sm">({tvShow.vote_count.toLocaleString()} votes)</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(tvShow.first_air_date).getFullYear()}</span>
                {tvShow.last_air_date && tvShow.status === "Ended" && (
                  <span>-{new Date(tvShow.last_air_date).getFullYear()}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Tv className="h-4 w-4" />
                <span>
                  {tvShow.number_of_seasons} seasons, {tvShow.number_of_episodes} episodes
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>{formatRuntime(tvShow.episode_run_time)}</span>
              </div>
              <Badge variant="secondary" className="bg-white/10 text-white">
                {tvShow.status}
              </Badge>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {tvShow.genres.map((genre) => (
                <Badge key={genre.id} variant="outline" className="border-purple-400 text-purple-300">
                  {genre.name}
                </Badge>
              ))}
            </div>

            {/* Overview */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Overview</h2>
              <p className="text-slate-300 leading-relaxed">{tvShow.overview}</p>
            </div>

            {/* Streaming Services */}
            {usProviders && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Where to Watch</h3>

                {/* Streaming Services */}
                {usProviders.flatrate && usProviders.flatrate.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-white mb-2">Stream</h4>
                    <div className="flex flex-wrap gap-3">
                      {usProviders.flatrate.map((provider) => (
                        <a
                          key={provider.provider_id}
                          href={getStreamingUrl(provider)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2 transition-colors"
                        >
                          <span className="text-white text-sm font-medium">{provider.provider_name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rent/Buy */}
                {(usProviders.rent || usProviders.buy) && (
                  <div>
                    <h4 className="text-md font-medium text-white mb-2">Rent or Buy</h4>
                    <div className="flex flex-wrap gap-3">
                      {[...(usProviders.rent || []), ...(usProviders.buy || [])]
                        .filter(
                          (provider, index, self) =>
                            self.findIndex((p) => p.provider_id === provider.provider_id) === index,
                        )
                        .map((provider) => (
                          <a
                            key={provider.provider_id}
                            href={getStreamingUrl(provider)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2 transition-colors"
                          >
                            <span className="text-white text-sm font-medium">{provider.provider_name}</span>
                          </a>
                        ))}
                    </div>
                  </div>
                )}

                {/* Attribution to JustWatch as required by TMDB */}
                <p className="text-xs text-slate-400 mt-2">Streaming data provided by JustWatch</p>
              </div>
            )}

            {/* Networks */}
            {tvShow.networks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Original Networks</h3>
                <div className="flex flex-wrap gap-4">
                  {tvShow.networks.map((network) => (
                    <div key={network.id} className="text-slate-300">
                      {network.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
