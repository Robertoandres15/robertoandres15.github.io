"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, X, Play, Plus, Minus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRealtimeProgress } from "@/hooks/use-realtime-progress"

interface Friend {
  id: string
  username: string
  display_name: string
  avatar_url?: string
}

interface WatchParty {
  id: string
  status: string
  watch_party_participants: Array<{
    user_id: string
    status: string
  }>
}

interface Progress {
  user_id: string
  display_name: string
  username: string
  avatar_url?: string
  current_season: number
  current_episode: number
  last_updated: string
}

interface SeriesMatchProps {
  tmdb_id: number
  media_type: string
  title: string
  poster_path?: string
  overview?: string
  release_date?: string
  matched_friends: Friend[]
  watch_party?: WatchParty | null
  onMatchUpdate?: () => void
}

export function SeriesMatchCard({
  tmdb_id,
  media_type,
  title,
  poster_path,
  overview,
  release_date,
  matched_friends,
  watch_party,
  onMatchUpdate,
}: SeriesMatchProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  const [currentSeason, setCurrentSeason] = useState(1)
  const [currentEpisode, setCurrentEpisode] = useState(1)
  const { toast } = useToast()

  const { progress, refetch: refetchProgress } = useRealtimeProgress(watch_party?.id || null)

  const handleCreateMatch = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/reel-club/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tmdb_id,
          media_type,
          title,
          poster_path,
          friend_ids: matched_friends.map((f) => f.id),
        }),
      })

      if (response.ok) {
        toast({
          title: "Match Created!",
          description: `Sent "Do you want to watch this together?" to your friends.`,
        })
        onMatchUpdate?.()
      } else {
        const error = await response.json()
        toast({
          title: "Failed to create match",
          description: error.error || "Something went wrong",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating match:", error)
      toast({
        title: "Error",
        description: "Failed to create match",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRespondToMatch = async (action: "accept" | "decline") => {
    if (!watch_party) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/reel-club/matches/${watch_party.id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: data.message,
          description: action === "accept" ? "Great! Progress tracking is now active." : "Match declined.",
        })
        onMatchUpdate?.()
        if (action === "accept") {
          refetchProgress()
        }
      } else {
        const error = await response.json()
        toast({
          title: "Failed to respond",
          description: error.error || "Something went wrong",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error responding to match:", error)
      toast({
        title: "Error",
        description: "Failed to respond to match",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeclineMatch = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/reel-club/matches/decline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tmdb_id,
          media_type,
          title,
          poster_path,
          friend_ids: matched_friends.map((f) => f.id),
        }),
      })

      if (response.ok) {
        toast({
          title: "Match Declined",
          description: "This match won't be shown again.",
        })
        onMatchUpdate?.()
      } else {
        const error = await response.json()
        toast({
          title: "Failed to decline match",
          description: error.error || "Something went wrong",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error declining match:", error)
      toast({
        title: "Error",
        description: "Failed to decline match",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateProgress = async () => {
    if (!watch_party) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/reel-club/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          watch_party_id: watch_party.id,
          season_number: currentSeason,
          episode_number: currentEpisode,
        }),
      })

      if (response.ok) {
        toast({
          title: "Progress Updated!",
          description: `Marked S${currentSeason}E${currentEpisode} as watched.`,
        })
        setShowProgressDialog(false)
      } else {
        const error = await response.json()
        toast({
          title: "Failed to update progress",
          description: error.error || "Something went wrong",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating progress:", error)
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getMatchStatus = () => {
    if (!watch_party) return "no_party"
    return watch_party.status
  }

  const renderProgressTracker = () => {
    if (!progress.length) {
      return (
        <div className="text-center py-4">
          <p className="text-slate-400 text-sm">No progress tracked yet</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {progress.map((p) => (
          <div key={p.user_id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <Avatar className="h-8 w-8">
              <AvatarImage src={p.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-purple-600 text-white text-xs">
                {p.display_name?.[0] || p.username?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{p.display_name}</p>
              <p className="text-slate-400 text-xs">
                Season {p.current_season}, Episode {p.current_episode}
              </p>
            </div>
            <Badge variant="outline" className="border-purple-500 text-purple-300">
              S{p.current_season}E{p.current_episode}
            </Badge>
          </div>
        ))}
      </div>
    )
  }

  const renderActionButtons = () => {
    const status = getMatchStatus()

    switch (status) {
      case "no_party":
        return (
          <div className="flex gap-2">
            <Button
              onClick={handleCreateMatch}
              disabled={isLoading}
              variant="outline"
              className="border-green-500 text-green-400 hover:bg-green-500/10 bg-transparent"
            >
              <Check className="h-4 w-4 mr-2" />
              {isLoading ? "Creating..." : "Yes"}
            </Button>
            <Button
              onClick={handleDeclineMatch}
              disabled={isLoading}
              variant="outline"
              className="border-red-500 text-red-400 hover:bg-red-500/10 bg-transparent"
            >
              <X className="h-4 w-4 mr-2" />
              {isLoading ? "Declining..." : "No"}
            </Button>
          </div>
        )

      case "pending":
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => handleRespondToMatch("accept")}
              disabled={isLoading}
              variant="outline"
              className="border-green-500 text-green-400 hover:bg-green-500/10"
            >
              <Check className="h-4 w-4 mr-2" />
              Accept
            </Button>
            <Button
              onClick={() => handleRespondToMatch("decline")}
              disabled={isLoading}
              variant="outline"
              className="border-red-500 text-red-400 hover:bg-red-500/10"
            >
              <X className="h-4 w-4 mr-2" />
              Decline
            </Button>
          </div>
        )

      case "accepted":
        return (
          <div className="space-y-3">
            <Badge className="bg-green-600 text-white">
              <Check className="h-3 w-3 mr-1" />
              Progress Tracking Active
            </Badge>
            <div className="space-y-2">
              {renderProgressTracker()}
              <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Update Progress
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-white">Update Your Progress</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                      <h3 className="text-white font-medium mb-2">{title}</h3>
                      <p className="text-slate-300 text-sm">
                        Track your progress with {matched_friends.map((f) => f.display_name).join(", ")}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="season" className="text-white">
                          Season
                        </Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentSeason(Math.max(1, currentSeason - 1))}
                            className="h-8 w-8 border-white/20"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            id="season"
                            type="number"
                            min="1"
                            value={currentSeason}
                            onChange={(e) => setCurrentSeason(Math.max(1, Number.parseInt(e.target.value) || 1))}
                            className="bg-white/10 border-white/20 text-white text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentSeason(currentSeason + 1)}
                            className="h-8 w-8 border-white/20"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="episode" className="text-white">
                          Episode
                        </Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentEpisode(Math.max(1, currentEpisode - 1))}
                            className="h-8 w-8 border-white/20"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            id="episode"
                            type="number"
                            min="1"
                            value={currentEpisode}
                            onChange={(e) => setCurrentEpisode(Math.max(1, Number.parseInt(e.target.value) || 1))}
                            className="bg-white/10 border-white/20 text-white text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentEpisode(currentEpisode + 1)}
                            className="h-8 w-8 border-white/20"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={updateProgress}
                        disabled={isLoading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoading ? "Updating..." : "Update Progress"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowProgressDialog(false)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-800"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )

      case "declined":
        return (
          <Badge variant="outline" className="border-red-500 text-red-400">
            <X className="h-3 w-3 mr-1" />
            Match Declined
          </Badge>
        )

      default:
        return null
    }
  }

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <img
            src={
              poster_path
                ? `https://image.tmdb.org/t/p/w200${poster_path}`
                : `/placeholder.svg?height=120&width=80&query=${title} poster`
            }
            alt={title}
            className="w-20 h-30 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-semibold mb-1 truncate">{title}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-blue-600/20 text-blue-300">
                    TV Series
                  </Badge>
                  {release_date && (
                    <Badge variant="outline" className="border-white/20 text-slate-300">
                      {release_date.split("-")[0]}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex -space-x-2">
                {matched_friends.slice(0, 3).map((friend) => (
                  <Avatar key={friend.id} className="h-6 w-6 border-2 border-slate-900">
                    <AvatarImage src={friend.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-purple-600 text-white text-xs">
                      {friend.display_name?.[0] || friend.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-slate-400 text-sm">
                {matched_friends.length === 1
                  ? `${matched_friends[0].display_name} wants to watch this`
                  : `${matched_friends.length} friends want to watch this`}
              </span>
            </div>

            {overview && <p className="text-slate-400 text-sm mb-3 line-clamp-2">{overview}</p>}

            <div className="flex flex-col gap-3">{renderActionButtons()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
