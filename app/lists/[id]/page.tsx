"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookmarkPlus, Calendar, Star, Trash2, ArrowLeft, Home, Search, Users, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"

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

export default function ListDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [list, setList] = useState<List | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadList(params.id as string)
    }
  }, [params.id])

  const loadList = async (listId: string) => {
    try {
      const response = await fetch(`/api/lists/${listId}`)
      const data = await response.json()

      if (response.ok) {
        setList(data.list)
      } else {
        toast({
          title: "Failed to load list",
          description: data.error || "An error occurred",
          variant: "destructive",
        })
        router.push("/lists")
      }
    } catch (error) {
      console.error("Failed to load list:", error)
      toast({
        title: "Failed to load list",
        description: "An error occurred while loading the list",
        variant: "destructive",
      })
      router.push("/lists")
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromList = async (itemId: string) => {
    if (!list) return

    try {
      const response = await fetch(`/api/lists/${list.id}/items?item_id=${itemId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Item removed",
          description: "Item has been removed from your list",
        })
        loadList(list.id)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading list...</div>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">List not found</div>
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
        <Link href="/lists" className="flex flex-col items-center gap-1 text-purple-400">
          <BookmarkPlus className="h-5 w-5" />
          <span className="text-xs">Lists</span>
        </Link>
        <Link
          href="/profile"
          className="flex flex-col items-center gap-1 text-slate-300 hover:text-white transition-colors"
        >
          <User className="h-5 w-5" />
          <span className="text-xs">Profile</span>
        </Link>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{list.name}</h1>
            {list.description && <p className="text-slate-300 mt-1">{list.description}</p>}
          </div>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={list.is_public ? "default" : "secondary"}>
                  {list.is_public ? "Public" : "Private"}
                </Badge>
                <Badge variant="outline" className="border-purple-400 text-purple-400">
                  {list.type === "wishlist" ? "Wishlist" : "Recommendations"}
                </Badge>
                <Badge variant="outline" className="border-slate-400 text-slate-400">
                  {list.list_items.length} items
                </Badge>
              </div>
              <p className="text-slate-400 text-sm">Created {new Date(list.created_at).toLocaleDateString()}</p>
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
                {list.list_items.map((item) => (
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
                        onClick={() => removeFromList(item.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="mt-2">
                      <Link href={getItemRoute(item)} className="hover:text-purple-300 transition-colors">
                        <h4 className="text-white text-sm font-medium line-clamp-2 hover:underline">{item.title}</h4>
                      </Link>
                      <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>{item.release_date?.split("-")[0] || "TBA"}</span>
                      </div>
                      {item.note && <p className="text-slate-400 text-xs mt-1 line-clamp-2">{item.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
