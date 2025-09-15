"use client"

import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
import Link from "next/link"
import { useRealtimeMatches } from "@/hooks/use-realtime-matches"
import { MovieMatchCard } from "@/components/movie-match-card"
import { SeriesMatchCard } from "@/components/series-match-card"

export function ReelClubMatches() {
  const { matches, loading, error, refetch } = useRealtimeMatches()

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
          <Users className="h-8 w-8 text-purple-400 animate-pulse" />
        </div>
        <p className="text-slate-400">Loading matches...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <Users className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Error Loading Matches</h3>
        <p className="text-slate-400 mb-4">{error}</p>
        <Button onClick={refetch} className="bg-purple-600 hover:bg-purple-700">
          Try Again
        </Button>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
          <Users className="h-8 w-8 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No matches yet!</h3>
        <p className="text-slate-400 mb-4">Add movies and shows to your wishlist to find matches with your friends.</p>
        <Button asChild className="bg-purple-600 hover:bg-purple-700">
          <Link href="/explore">Explore Movies</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => {
        const key = `${match.tmdb_id}-${match.media_type}`

        if (match.media_type === "movie") {
          return (
            <MovieMatchCard
              key={key}
              tmdb_id={match.tmdb_id}
              media_type={match.media_type}
              title={match.title}
              poster_path={match.poster_path}
              overview={match.overview}
              release_date={match.release_date}
              matched_friends={match.matched_friends}
              watch_party={match.watch_party}
              onMatchUpdate={refetch}
            />
          )
        } else {
          return (
            <SeriesMatchCard
              key={key}
              tmdb_id={match.tmdb_id}
              media_type={match.media_type}
              title={match.title}
              poster_path={match.poster_path}
              overview={match.overview}
              release_date={match.release_date}
              matched_friends={match.matched_friends}
              watch_party={match.watch_party}
              onMatchUpdate={refetch}
            />
          )
        }
      })}
    </div>
  )
}
