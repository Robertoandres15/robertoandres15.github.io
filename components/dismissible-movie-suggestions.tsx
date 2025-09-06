"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Star, Plus, X, Check, RefreshCw } from "lucide-react"

interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  vote_average: number
  release_date: string
}

interface DismissibleMovieSuggestionsProps {
  initialSuggestions: Movie[]
  movieGenres: string[]
  userProfile: any
  isPersonalized: boolean
}

export function DismissibleMovieSuggestions({
  initialSuggestions,
  movieGenres,
  userProfile,
  isPersonalized,
}: DismissibleMovieSuggestionsProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dismissedMovies")
      return stored ? new Set(JSON.parse(stored)) : new Set()
    }
    return new Set()
  })

  const [suggestions, setSuggestions] = useState<Movie[]>(() => {
    const filtered = initialSuggestions.filter((movie) => !dismissedIds.has(movie.id))
    console.log("[v0] Initial suggestions:", initialSuggestions.length)
    console.log("[v0] Dismissed movies:", dismissedIds.size)
    console.log("[v0] Filtered suggestions:", filtered.length)
    return filtered
  })

  const [isLoadingReplacement, setIsLoadingReplacement] = useState<number | null>(null)
  const [addingToWishlist, setAddingToWishlist] = useState<Set<number>>(new Set())
  const [addedToWishlist, setAddedToWishlist] = useState<Set<number>>(new Set())
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("dismissedMovies", JSON.stringify([...dismissedIds]))
    }
  }, [dismissedIds])

  useEffect(() => {
    if (suggestions.length === 0 && initialSuggestions.length > 0) {
      console.log("[v0] All suggestions dismissed, fetching new ones")
      fetchMoreSuggestions()
    }
  }, [suggestions.length, initialSuggestions.length])

  const fetchMoreSuggestions = async () => {
    setIsLoadingMore(true)
    try {
      const genreIds = movieGenres.join(",")
      const excludeIds = [...dismissedIds].join(",")
      const randomPage = Math.floor(Math.random() * 10) + 1

      console.log("[v0] Fetching more suggestions, excluding:", excludeIds)

      const response = await fetch(
        `/api/tmdb/discover?with_genres=${genreIds}&exclude_ids=${excludeIds}&page=${randomPage}`,
      )

      if (response.ok) {
        const data = await response.json()
        const newSuggestions = data.results?.filter((movie: Movie) => !dismissedIds.has(movie.id)) || []

        console.log("[v0] Fetched new suggestions:", newSuggestions.length)

        if (newSuggestions.length > 0) {
          setSuggestions(newSuggestions.slice(0, 5))
        }
      }
    } catch (error) {
      console.error("[v0] Failed to fetch more suggestions:", error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleDismiss = async (movieId: number) => {
    setIsLoadingReplacement(movieId)

    const updatedSuggestions = suggestions.filter((movie) => movie.id !== movieId)
    setSuggestions(updatedSuggestions)
    setDismissedIds((prev) => new Set([...prev, movieId]))

    try {
      const genreIds = movieGenres.join(",")
      const excludeIds = [...dismissedIds, movieId, ...suggestions.map((s) => s.id)].join(",")

      const response = await fetch(
        `/api/tmdb/discover?with_genres=${genreIds}&exclude_ids=${excludeIds}&page=${Math.floor(Math.random() * 5) + 1}`,
      )

      if (response.ok) {
        const data = await response.json()
        const newSuggestions =
          data.results?.filter(
            (movie: Movie) => !dismissedIds.has(movie.id) && !suggestions.some((s) => s.id === movie.id),
          ) || []

        if (newSuggestions.length > 0) {
          setSuggestions((prev) => [...prev, newSuggestions[0]])
        }
      }
    } catch (error) {
      console.error("Failed to fetch replacement suggestion:", error)
    } finally {
      setIsLoadingReplacement(null)
    }
  }

  const handleAddToWishlist = async (movie: Movie) => {
    setAddingToWishlist((prev) => new Set([...prev, movie.id]))

    try {
      const listsResponse = await fetch("/api/lists?type=wishlist")
      if (!listsResponse.ok) {
        throw new Error("Failed to fetch wishlists")
      }

      const { lists } = await listsResponse.json()
      let wishlist = lists.find((list: any) => list.type === "wishlist")

      if (!wishlist) {
        const createResponse = await fetch("/api/lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "My Wishlist",
            description: "Movies and shows I want to watch",
            type: "wishlist",
            is_public: true,
          }),
        })

        if (!createResponse.ok) {
          throw new Error("Failed to create wishlist")
        }

        const { list } = await createResponse.json()
        wishlist = list
      }

      const addResponse = await fetch(`/api/lists/${wishlist.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdb_id: movie.id,
          media_type: "movie",
          title: movie.title,
          poster_path: movie.poster_path,
          overview: movie.overview,
          release_date: movie.release_date,
        }),
      })

      if (!addResponse.ok) {
        const error = await addResponse.json()
        if (error.error === "Item already exists in this list") {
          setAddedToWishlist((prev) => new Set([...prev, movie.id]))
          return
        }
        throw new Error(error.error || "Failed to add to wishlist")
      }

      setAddedToWishlist((prev) => new Set([...prev, movie.id]))
    } catch (error) {
      console.error("Failed to add to wishlist:", error)
    } finally {
      setAddingToWishlist((prev) => {
        const newSet = new Set(prev)
        newSet.delete(movie.id)
        return newSet
      })
    }
  }

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

  if (isLoadingMore && suggestions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">
            {isPersonalized
              ? "Personalized Recommendations"
              : userProfile
                ? "AI Recommendations for You"
                : "Popular Movies You Might Like"}
          </h2>
          <p className="text-slate-400 text-sm">
            {isPersonalized
              ? "Based on movies in your Recommendations List"
              : userProfile
                ? "Based on your preferences: "
                : "Based on popular genres: "}
            {!isPersonalized && movieGenres.map((id) => genreMap[id.toString()] || "Unknown").join(", ")}
          </p>
        </div>

        <div className="text-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-400 border-t-transparent mx-auto mb-4" />
          <p className="text-slate-400">Loading fresh recommendations...</p>
        </div>
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">
            {isPersonalized
              ? "Personalized Recommendations"
              : userProfile
                ? "AI Recommendations for You"
                : "Popular Movies You Might Like"}
          </h2>
          <p className="text-slate-400 text-sm">
            {isPersonalized
              ? "Based on movies in your Recommendations List"
              : userProfile
                ? "Based on your preferences: "
                : "Based on popular genres: "}
            {!isPersonalized && movieGenres.map((id) => genreMap[id.toString()] || "Unknown").join(", ")}
          </p>
        </div>

        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No more suggestions</h3>
          <p className="text-slate-400 mb-4">You've seen all our current recommendations for your taste!</p>
          <Button onClick={fetchMoreSuggestions} disabled={isLoadingMore} className="bg-purple-600 hover:bg-purple-700">
            {isLoadingMore ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Get More Suggestions
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">
          {isPersonalized
            ? "Personalized Recommendations"
            : userProfile
              ? "AI Recommendations for You"
              : "Popular Movies You Might Like"}
        </h2>
        <p className="text-slate-400 text-sm">
          {isPersonalized
            ? "Based on movies in your Recommendations List"
            : userProfile
              ? "Based on your preferences: "
              : "Based on popular genres: "}
          {!isPersonalized && movieGenres.map((id) => genreMap[id.toString()] || "Unknown").join(", ")}
          {!userProfile && !isPersonalized && (
            <span className="block mt-1 text-xs">Complete your profile to get personalized recommendations!</span>
          )}
          {isPersonalized && (
            <span className="block mt-1 text-xs">
              Add more movies to your Recommendations List for better suggestions!
            </span>
          )}
        </p>
      </div>

      {suggestions.map((movie: Movie) => (
        <div key={movie.id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors relative">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDismiss(movie.id)}
            disabled={isLoadingReplacement === movie.id}
            className="absolute top-2 right-2 h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/10 z-10"
            title="Already watched this"
          >
            {isLoadingReplacement === movie.id ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>

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
            <div className="flex-1 min-w-0 text-center sm:text-left pr-8">
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
                  onClick={() => handleAddToWishlist(movie)}
                  disabled={addingToWishlist.has(movie.id) || addedToWishlist.has(movie.id)}
                  className={`min-h-[44px] sm:min-h-[36px] w-full sm:w-auto ${
                    addedToWishlist.has(movie.id)
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {addingToWishlist.has(movie.id) ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Adding...
                    </>
                  ) : addedToWishlist.has(movie.id) ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Added to Wishlist
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Wishlist
                    </>
                  )}
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
