"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Check, X, ExternalLink, Ticket } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

interface MovieMatchProps {
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

export function MovieMatchCard({
  tmdb_id,
  media_type,
  title,
  poster_path,
  overview,
  release_date,
  matched_friends,
  watch_party,
  onMatchUpdate,
}: MovieMatchProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showTicketDialog, setShowTicketDialog] = useState(false)
  const { toast } = useToast()

  const handleCreateMatch = async () => {
    console.log("[v0] Yes button clicked - creating match")
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

      console.log("[v0] Create match response status:", response.status)
      if (response.ok) {
        toast({
          title: "Match Created!",
          description: `Sent "Do you want to watch this together?" to your friends.`,
        })
        onMatchUpdate?.()
      } else {
        const error = await response.json()
        console.log("[v0] Create match error:", error)
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
          description: action === "accept" ? "Great! Waiting for others to respond." : "Match declined.",
        })
        onMatchUpdate?.()
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
    console.log("[v0] No button clicked - declining match")
    setIsLoading(true)
    try {
      const response = await fetch("/api/reel-club/matches/decline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          tmdb_id,
          media_type,
          title,
          poster_path,
          friend_ids: matched_friends.map((f) => f.id),
        }),
      })

      console.log("[v0] Decline match response status:", response.status)
      if (response.ok) {
        toast({
          title: "Match Declined",
          description: "This match won't be shown again.",
        })
        window.location.reload()
      } else {
        const error = await response.json()
        console.log("[v0] Decline match error:", error)
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

  const openTicketPurchase = () => {
    const movieTitle = encodeURIComponent(title)
    const fandangoUrl = `https://www.fandango.com/search/?q=${movieTitle}`
    window.open(fandangoUrl, "_blank")
    setShowTicketDialog(false)
  }

  const getMatchStatus = () => {
    if (!watch_party) return "no_party"
    return watch_party.status
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
          <div className="space-y-2">
            <Badge className="bg-green-600 text-white">
              <Check className="h-3 w-3 mr-1" />
              Match Activated!
            </Badge>
            <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700 w-full">
                  <Ticket className="h-4 w-4 mr-2" />
                  Buy Tickets
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">Purchase Tickets</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <h3 className="text-white font-medium mb-2 truncate">{title}</h3>
                    <p className="text-slate-300 text-sm">
                      Ready to watch with {matched_friends.map((f) => f.display_name).join(", ")}!
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button onClick={openTicketPurchase} className="w-full bg-orange-600 hover:bg-orange-700">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Fandango
                    </Button>

                    <div className="text-xs text-slate-400 space-y-1">
                      <p>• Opens Fandango with movie search</p>
                      <p>• Find showtimes and purchase tickets</p>
                      <p>• Coordinate with your friends for the same showing</p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
                  <Badge variant="secondary" className="bg-purple-600/20 text-purple-300">
                    Movie
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

            <div className="flex items-center justify-between">{renderActionButtons()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
