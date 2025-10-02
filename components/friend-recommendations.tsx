"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Check, X, Users, Film } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ListSelector } from "@/components/list-selector"

interface Friend {
  id: string
  username: string
  display_name: string
  avatar_url?: string
}

interface Recommendation {
  id: string
  tmdb_id: number
  media_type: string
  title: string
  poster_path?: string
  release_date?: string
  recommending_friends: Friend[]
}

export function FriendRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    try {
      const response = await fetch("/api/recommendations")
      const data = await response.json()
      setRecommendations(data.recommendations || [])
    } catch (error) {
      console.error("Error fetching recommendations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: string) => {
    if (currentIndex >= recommendations.length) return

    const recommendation = recommendations[currentIndex]

    try {
      const response = await fetch("/api/recommendations/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          tmdb_id: recommendation.tmdb_id,
          media_type: recommendation.media_type,
          title: recommendation.title,
          poster_path: recommendation.poster_path,
          release_date: recommendation.release_date,
          recommended_by: recommendation.recommending_friends[0]?.username,
        }),
      })

      if (response.ok) {
        // Move to next recommendation
        setCurrentIndex((prev) => prev + 1)

        // Show success message
        switch (action) {
          case "mark_seen":
            toast({
              title: "Marked as Seen",
              description: `${recommendation.title} has been marked as seen.`,
            })
            break
          case "not_interested":
            toast({
              title: "Not Interested",
              description: `${recommendation.title} won't be shown again.`,
            })
            break
        }
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Something went wrong. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error handling action:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
          <Film className="h-8 w-8 text-purple-400 animate-pulse" />
        </div>
        <p className="text-slate-400">Loading recommendations...</p>
      </div>
    )
  }

  if (recommendations.length === 0 || currentIndex >= recommendations.length) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
          <Users className="h-8 w-8 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No recommendations yet!</h3>
        <p className="text-slate-400 mb-4">
          Ask your friends to add movies to their recommendations list to see suggestions here.
        </p>
        <Button asChild className="bg-purple-600 hover:bg-purple-700">
          <Link href="/friends">Find Friends</Link>
        </Button>
      </div>
    )
  }

  const currentRecommendation = recommendations[currentIndex]
  const primaryFriend = currentRecommendation.recommending_friends[0]
  const hasMultipleFriends = currentRecommendation.recommending_friends.length > 1

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-4 text-center">
        <p className="text-slate-400 text-sm">
          {currentIndex + 1} of {recommendations.length} recommendations
        </p>
      </div>

      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            {currentRecommendation.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w300${currentRecommendation.poster_path}`}
                alt={currentRecommendation.title}
                className="w-48 h-72 object-cover rounded-lg mx-auto mb-4"
              />
            )}

            <h2 className="text-xl font-bold text-white mb-2">{currentRecommendation.title}</h2>

            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-purple-600/20 text-purple-300">
                {currentRecommendation.media_type === "movie" ? "Movie" : "TV Series"}
              </Badge>
              {currentRecommendation.release_date && (
                <Badge variant="outline" className="border-white/20 text-slate-300">
                  {currentRecommendation.release_date.split("-")[0]}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 mb-6">
              <Avatar className="h-8 w-8">
                <AvatarImage src={primaryFriend?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-purple-600 text-white text-sm">
                  {primaryFriend?.display_name?.[0] || primaryFriend?.username?.[0] || "U"}
                </AvatarFallback>
              </Avatar>

              {hasMultipleFriends ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-white hover:text-purple-300 transition-colors">
                      <span className="font-medium">+{primaryFriend?.display_name || primaryFriend?.username}</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-white/10">
                    <DialogHeader>
                      <DialogTitle className="text-white">Recommended by</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      {currentRecommendation.recommending_friends.map((friend) => (
                        <div key={friend.id} className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={friend.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className="bg-purple-600 text-white">
                              {friend.display_name?.[0] || friend.username?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">{friend.display_name || friend.username}</p>
                            <p className="text-slate-400 text-sm">@{friend.username}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <span className="text-white font-medium">{primaryFriend?.display_name || primaryFriend?.username}</span>
              )}
            </div>
          </div>

          <div className="flex gap-3 items-center justify-center">
            <ListSelector
              mediaItem={{
                id: currentRecommendation.tmdb_id,
                title: currentRecommendation.title,
                poster_path: currentRecommendation.poster_path || null,
                overview: "",
                release_date: currentRecommendation.release_date,
                vote_average: 0,
                media_type: currentRecommendation.media_type as "movie" | "tv",
              }}
              actionType="wishlist"
              onSuccess={() => {
                setCurrentIndex((prev) => prev + 1)
              }}
            />
            <Button
              onClick={() => handleAction("mark_seen")}
              variant="outline"
              size="icon"
              className="border-green-500/50 text-green-400 hover:bg-green-500/10 bg-transparent h-10 w-10"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleAction("not_interested")}
              variant="outline"
              size="icon"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent h-10 w-10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
