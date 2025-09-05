"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Heart,
  BookmarkPlus,
  Plus,
  Calendar,
  Star,
  Trash2,
  MessageCircle,
  Share,
  Home,
  Search,
  Users,
  User,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ListItem {
  id: string
  tmdb_id: number
  media_type: "movie" | "tv"
  title: string
  poster_path?: string
  overview?: string
  release_date?: string
  rating?: number
  note?: string
  added_at: string
}

interface List {
  id: string
  name: string
  description?: string
  type: "wishlist" | "recommendations"
  is_public: boolean
  created_at: string
  updated_at: string
  user: {
    id: string
    username: string
    display_name: string
    avatar_url?: string
  }
  list_items: ListItem[]
}

interface SocialSignal {
  id: string
  signal_type: "like" | "comment" | "share"
  content?: string
  created_at: string
  user: {
    id: string
    username: string
    display_name: string
    avatar_url?: string
  }
}

interface ListSocialSignals {
  likes: SocialSignal[]
  comments: SocialSignal[]
  shares: SocialSignal[]
}

const createList = async () => {
  // Placeholder for createList function implementation
}

export default function ListsPage() {
  const [lists, setLists] = useState<List[]>([])
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [newListDescription, setNewListDescription] = useState("")
  const [newListType, setNewListType] = useState<"wishlist" | "recommendations">("wishlist")
  const [newListPublic, setNewListPublic] = useState(true)
  const [socialSignals, setSocialSignals] = useState<Record<string, ListSocialSignals>>({})
  const [showCommentDialog, setShowCommentDialog] = useState<string | null>(null)
  const [commentText, setCommentText] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadLists()
  }, [])

  const loadLists = async () => {
    try {
      const response = await fetch("/api/lists")
      const data = await response.json()

      if (response.ok) {
        const loadedLists = data.lists || []
        setLists(loadedLists)
        await loadSocialSignalsForLists(loadedLists)
      } else {
        toast({
          title: "Failed to load lists",
          description: data.error || "An error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to load lists:", error)
      toast({
        title: "Failed to load lists",
        description: "An error occurred while loading your lists",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadSocialSignalsForLists = async (lists: List[]) => {
    const signalsData: Record<string, ListSocialSignals> = {}

    for (const list of lists) {
      try {
        const response = await fetch(`/api/social-signals?target_type=list&target_id=${list.id}`)
        if (response.ok) {
          const data = await response.json()
          const signals = data.signals || []

          signalsData[list.id] = {
            likes: signals.filter((s: SocialSignal) => s.signal_type === "like"),
            comments: signals.filter((s: SocialSignal) => s.signal_type === "comment"),
            shares: signals.filter((s: SocialSignal) => s.signal_type === "share"),
          }
        }
      } catch (error) {
        console.error(`Failed to load social signals for list ${list.id}:`, error)
      }
    }

    setSocialSignals(signalsData)
  }

  const handleLike = async (listId: string) => {
    try {
      const response = await fetch("/api/social-signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: "list",
          target_id: listId,
          signal_type: "like",
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Update local state
        setSocialSignals((prev) => {
          const current = prev[listId] || { likes: [], comments: [], shares: [] }

          if (data.action === "liked") {
            return {
              ...prev,
              [listId]: {
                ...current,
                likes: [...current.likes, data.signal],
              },
            }
          } else {
            // Unliked - remove the like (API handles the deletion)
            return {
              ...prev,
              [listId]: {
                ...current,
                likes: current.likes.filter((like) => like.user.id !== data.signal?.user?.id),
              },
            }
          }
        })

        toast({
          title: data.action === "liked" ? "Liked!" : "Unliked",
          description: data.action === "liked" ? "You liked this list" : "You removed your like",
        })
      }
    } catch (error) {
      console.error("Failed to toggle like:", error)
      toast({
        title: "Failed to like",
        description: "An error occurred",
        variant: "destructive",
      })
    }
  }

  const handleComment = async (listId: string) => {
    if (!commentText.trim()) return

    setIsSubmittingComment(true)
    try {
      const response = await fetch("/api/social-signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: "list",
          target_id: listId,
          signal_type: "comment",
          content: commentText.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Update local state
        setSocialSignals((prev) => {
          const current = prev[listId] || { likes: [], comments: [], shares: [] }
          return {
            ...prev,
            [listId]: {
              ...current,
              comments: [data.signal, ...current.comments],
            },
          }
        })

        setCommentText("")
        setShowCommentDialog(null)
        toast({
          title: "Comment added",
          description: "Your comment has been posted",
        })
      }
    } catch (error) {
      console.error("Failed to add comment:", error)
      toast({
        title: "Failed to comment",
        description: "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleShare = async (listId: string) => {
    try {
      const response = await fetch("/api/social-signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: "list",
          target_id: listId,
          signal_type: "share",
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Update local state
        setSocialSignals((prev) => {
          const current = prev[listId] || { likes: [], comments: [], shares: [] }
          return {
            ...prev,
            [listId]: {
              ...current,
              shares: [data.signal, ...current.shares],
            },
          }
        })

        // Copy list URL to clipboard
        const listUrl = `${window.location.origin}/lists/${listId}`
        await navigator.clipboard.writeText(listUrl)

        toast({
          title: "List shared!",
          description: "Link copied to clipboard",
        })
      }
    } catch (error) {
      console.error("Failed to share:", error)
      toast({
        title: "Failed to share",
        description: "An error occurred",
        variant: "destructive",
      })
    }
  }

  const removeFromList = async (listId: string, itemId: string) => {
    try {
      const response = await fetch(`/api/lists/${listId}/items?item_id=${itemId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Item removed",
          description: "Item has been removed from your list",
        })
        loadLists()
      } else {
        const data = await response.json()
        toast({
          title: "Failed to remove item",
          description: data.error || "An error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to remove item:", error)
      toast({
        title: "Failed to remove item",
        description: "An error occurred while removing the item",
        variant: "destructive",
      })
    }
  }

  const getPosterUrl = (posterPath: string | null) => {
    if (!posterPath) return "/placeholder.svg?height=300&width=200"
    return `https://image.tmdb.org/t/p/w300${posterPath}`
  }

  const getItemRoute = (item: ListItem) => {
    return `/explore/${item.media_type}/${item.tmdb_id}`
  }

  const wishlists = lists.filter((list) => list.type === "wishlist")
  const recommendations = lists.filter((list) => list.type === "recommendations")

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading your lists...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="flex items-center justify-center gap-8 p-4 border-b border-white/10">
        <Link
          href="/feed"
          className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition-colors"
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Feed</span>
        </Link>
        <Link
          href="/explore"
          className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition-colors"
        >
          <Search className="h-5 w-5" />
          <span className="text-xs">Explore</span>
        </Link>
        <Link
          href="/friends"
          className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition-colors"
        >
          <Users className="h-5 w-5" />
          <span className="text-xs">Friends</span>
        </Link>
        <div className="flex flex-col items-center gap-1 text-purple-400">
          <BookmarkPlus className="h-5 w-5" />
          <span className="text-xs">Lists</span>
        </div>
        <Link
          href="/profile"
          className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition-colors"
        >
          <User className="h-5 w-5" />
          <span className="text-xs">Profile</span>
        </Link>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">My Lists</h1>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Create List
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create New List</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-white">
                    Name *
                  </Label>
                  <Input
                    id="name"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="My Awesome List"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-white">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={newListDescription}
                    onChange={(e) => setNewListDescription(e.target.value)}
                    placeholder="Describe your list..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="type" className="text-white">
                    Type
                  </Label>
                  <Select
                    value={newListType}
                    onValueChange={(value: "wishlist" | "recommendations") => setNewListType(value)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wishlist">Wishlist</SelectItem>
                      <SelectItem value="recommendations">Recommendations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="public"
                    checked={newListPublic}
                    onChange={(e) => setNewListPublic(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="public" className="text-white">
                    Make this list public
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={createList} disabled={isCreating} className="bg-purple-600 hover:bg-purple-700">
                    {isCreating ? "Creating..." : "Create List"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="wishlists" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/10">
            <TabsTrigger value="wishlists" className="data-[state=active]:bg-purple-600">
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Wishlists ({wishlists.length})
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="data-[state=active]:bg-purple-600">
              <Heart className="h-4 w-4 mr-2" />
              Recommendations ({recommendations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wishlists" className="space-y-6">
            {wishlists.length === 0 ? (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <BookmarkPlus className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-white font-medium mb-2">No wishlists yet</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Create your first wishlist to save movies and shows you want to watch
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                    Create Wishlist
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {wishlists.map((list) => (
                  <Card key={list.id} className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white">{list.name}</CardTitle>
                          {list.description && <p className="text-slate-300 text-sm mt-1">{list.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={list.is_public ? "default" : "secondary"}>
                            {list.is_public ? "Public" : "Private"}
                          </Badge>
                          <Badge variant="outline" className="border-purple-400 text-purple-400">
                            {list.list_items.length} items
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {list.list_items.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-slate-400">No items in this list yet</p>
                          <Link href="/explore">
                            <Button
                              variant="outline"
                              className="mt-2 border-white/20 text-white hover:bg-white/10 bg-transparent"
                            >
                              Browse Movies
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {list.list_items.slice(0, 6).map((item) => (
                            <div key={item.id} className="group relative">
                              <Link href={getItemRoute(item)} className="block">
                                <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                                  <Image
                                    src={getPosterUrl(item.poster_path) || "/placeholder.svg"}
                                    alt={item.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute bottom-2 left-2 right-2">
                                    <div className="flex items-center gap-1 text-white text-xs">
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      <span>{item.rating?.toFixed(1) || "N/A"}</span>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeFromList(list.id, item.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="mt-2">
                                <Link href={getItemRoute(item)} className="hover:text-purple-300 transition-colors">
                                  <h4 className="text-white text-sm font-medium line-clamp-2 hover:underline">
                                    {item.title}
                                  </h4>
                                </Link>
                                <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{item.release_date?.split("-")[0] || "TBA"}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {list.list_items.length > 6 && (
                        <div className="text-center mt-4">
                          <Button
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                            onClick={() => router.push(`/lists/${list.id}`)}
                          >
                            View All {list.list_items.length} Items
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-4 text-slate-400 text-sm">
                          <button
                            className="flex items-center gap-1 hover:text-white transition-colors"
                            onClick={() => handleLike(list.id)}
                          >
                            <Heart
                              className={`h-4 w-4 ${
                                socialSignals[list.id]?.likes?.some((like) => like.user.id === "user-id")
                                  ? "fill-red-500 text-red-500"
                                  : ""
                              }`}
                            />
                            <span>{socialSignals[list.id]?.likes?.length || 0}</span>
                          </button>
                          <button
                            className="flex items-center gap-1 hover:text-white transition-colors"
                            onClick={() => setShowCommentDialog(list.id)}
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>{socialSignals[list.id]?.comments?.length || 0}</span>
                          </button>
                          <button
                            className="flex items-center gap-1 hover:text-white transition-colors"
                            onClick={() => handleShare(list.id)}
                          >
                            <Share className="h-4 w-4" />
                            <span>{socialSignals[list.id]?.shares?.length || 0}</span>
                          </button>
                        </div>
                        <p className="text-slate-400 text-xs">
                          Created {new Date(list.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            {recommendations.length === 0 ? (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <Heart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-white font-medium mb-2">No recommendation lists yet</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Create lists to share your favorite movies and shows with friends
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                    Create Recommendations
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {recommendations.map((list) => (
                  <Card key={list.id} className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white">{list.name}</CardTitle>
                          {list.description && <p className="text-slate-300 text-sm mt-1">{list.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={list.is_public ? "default" : "secondary"}>
                            {list.is_public ? "Public" : "Private"}
                          </Badge>
                          <Badge variant="outline" className="border-purple-400 text-purple-400">
                            {list.list_items.length} items
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {list.list_items.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-slate-400">No items in this list yet</p>
                          <Link href="/explore">
                            <Button
                              variant="outline"
                              className="mt-2 border-white/20 text-white hover:bg-white/10 bg-transparent"
                            >
                              Browse Movies
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {list.list_items.slice(0, 6).map((item) => (
                            <div key={item.id} className="group relative">
                              <Link href={getItemRoute(item)} className="block">
                                <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                                  <Image
                                    src={getPosterUrl(item.poster_path) || "/placeholder.svg"}
                                    alt={item.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute bottom-2 left-2 right-2">
                                    <div className="flex items-center gap-1 text-white text-xs">
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      <span>{item.rating?.toFixed(1) || "N/A"}</span>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeFromList(list.id, item.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="mt-2">
                                <Link href={getItemRoute(item)} className="hover:text-purple-300 transition-colors">
                                  <h4 className="text-white text-sm font-medium line-clamp-2 hover:underline">
                                    {item.title}
                                  </h4>
                                </Link>
                                <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{item.release_date?.split("-")[0] || "TBA"}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {list.list_items.length > 6 && (
                        <div className="text-center mt-4">
                          <Button
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                            onClick={() => router.push(`/lists/${list.id}`)}
                          >
                            View All {list.list_items.length} Items
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-4 text-slate-400 text-sm">
                          <button
                            className="flex items-center gap-1 hover:text-white transition-colors"
                            onClick={() => handleLike(list.id)}
                          >
                            <Heart
                              className={`h-4 w-4 ${
                                socialSignals[list.id]?.likes?.some((like) => like.user.id === "user-id")
                                  ? "fill-red-500 text-red-500"
                                  : ""
                              }`}
                            />
                            <span>{socialSignals[list.id]?.likes?.length || 0}</span>
                          </button>
                          <button
                            className="flex items-center gap-1 hover:text-white transition-colors"
                            onClick={() => setShowCommentDialog(list.id)}
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>{socialSignals[list.id]?.comments?.length || 0}</span>
                          </button>
                          <button
                            className="flex items-center gap-1 hover:text-white transition-colors"
                            onClick={() => handleShare(list.id)}
                          >
                            <Share className="h-4 w-4" />
                            <span>{socialSignals[list.id]?.shares?.length || 0}</span>
                          </button>
                        </div>
                        <p className="text-slate-400 text-xs">
                          Created {new Date(list.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={!!showCommentDialog} onOpenChange={() => setShowCommentDialog(null)}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Add Comment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write your comment..."
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => showCommentDialog && handleComment(showCommentDialog)}
                  disabled={isSubmittingComment || !commentText.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isSubmittingComment ? "Posting..." : "Post Comment"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCommentDialog(null)}
                  className="border-white/20 text-white hover:bg-white/10"
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
}
