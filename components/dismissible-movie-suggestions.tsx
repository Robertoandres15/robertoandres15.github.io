"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Star, Plus, X } from "lucide-react"

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
  const [suggestions, setSuggestions] = useState<Movie[]>(initialSuggestions)
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set())
  const [isLoadingReplacement, setIsLoadingReplacement] = useState<number | null>(null)

  const handleDismiss = async (movieId: number) => {
    setIsLoadingReplacement(movieId)

    // Remove the dismissed movie from current suggestions
    const updatedSuggestions = suggestions.filter((movie) => movie.id !== movieId)
    setSuggestions(updatedSuggestions)
    setDismissedIds((prev) => new Set([...prev, movieId]))

    try {
      // Fetch a replacement suggestion
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
          // Add the first new suggestion to replace the dismissed one
          setSuggestions((prev) => [...prev, newSuggestions[0]])
        }
      }
    } catch (error) {
      console.error("Failed to fetch replacement suggestion:", error)
    } finally {
      setIsLoadingReplacement(null)
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
