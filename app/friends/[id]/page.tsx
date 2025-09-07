import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Film, Users, Star } from "lucide-react"
import Link from "next/link"
import { MobileNavigation } from "@/components/mobile-navigation"

interface FriendProfilePageProps {
  params: {
    id: string
  }
}

export default async function FriendProfilePage({ params }: FriendProfilePageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get friend's profile
  const { data: friendProfile } = await supabase.from("users").select("*").eq("id", params.id).single()

  if (!friendProfile) {
    notFound()
  }

  // Verify friendship exists
  const { data: friendship } = await supabase
    .from("friends")
    .select("*")
    .or(`and(user_id.eq.${user.id},friend_id.eq.${params.id}),and(user_id.eq.${params.id},friend_id.eq.${user.id})`)
    .eq("status", "accepted")
    .single()

  if (!friendship) {
    notFound()
  }

  // Get friend's public lists
  const { data: friendLists } = await supabase
    .from("lists")
    .select(`
      *,
      list_items(
        id,
        tmdb_id,
        media_type,
        title,
        poster_path,
        overview,
        release_date,
        rating,
        note,
        added_at
      )
    `)
    .eq("user_id", params.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false })

  const recommendationsList = friendLists?.find((list) => list.type === "recommendations")
  const wishlist = friendLists?.find((list) => list.type === "wishlist")
  const otherLists = friendLists?.filter((list) => list.type !== "recommendations" && list.type !== "wishlist") || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" asChild className="text-white hover:bg-white/10">
              <Link href="/friends">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Friends
              </Link>
            </Button>
          </div>

          {/* Profile Header */}
          <Card className="bg-slate-800/80 border-slate-600 backdrop-blur-sm mb-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={friendProfile.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-purple-600 text-white text-2xl">
                    {friendProfile.display_name?.[0] || friendProfile.username?.[0] || "F"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-slate-200 mb-2">
                    {friendProfile.display_name || friendProfile.username}
                  </h1>
                  <p className="text-slate-400 mb-4">@{friendProfile.username}</p>
                  {friendProfile.bio && <p className="text-slate-300 mb-4">{friendProfile.bio}</p>}

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-600/20 text-green-300">
                      <Users className="h-3 w-3 mr-1" />
                      Friends
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations List */}
          {recommendationsList && recommendationsList.list_items && recommendationsList.list_items.length > 0 && (
            <Card className="bg-slate-800/80 border-slate-600 backdrop-blur-sm mb-6">
              <CardHeader>
                <CardTitle className="text-slate-200 flex items-center gap-2">
                  <Film className="h-5 w-5 text-purple-400" />
                  Recommendations ({recommendationsList.list_items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendationsList.list_items.map((item: any) => (
                  <Link
                    key={item.id}
                    href={`/explore/${item.media_type}/${item.tmdb_id}`}
                    className="block hover:bg-slate-700/40 rounded-lg transition-colors"
                  >
                    <div className="flex gap-4 p-3 rounded-lg bg-slate-700/60">
                      <img
                        src={
                          item.poster_path
                            ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
                            : `/placeholder.svg?height=120&width=80&query=${item.title} poster`
                        }
                        alt={item.title}
                        className="w-16 h-24 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-slate-200 font-semibold mb-1 truncate hover:text-purple-300 transition-colors">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 text-xs">
                            {item.media_type === "movie" ? "Movie" : "TV Series"}
                          </Badge>
                          {item.release_date && (
                            <span className="text-slate-400 text-sm">{new Date(item.release_date).getFullYear()}</span>
                          )}
                          {item.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-sm text-slate-300">{item.rating}</span>
                            </div>
                          )}
                        </div>
                        {item.overview && <p className="text-slate-400 text-sm line-clamp-2 mb-2">{item.overview}</p>}
                        {item.note && <p className="text-slate-300 text-sm italic">"{item.note}"</p>}
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Wishlist */}
          {wishlist && wishlist.list_items && wishlist.list_items.length > 0 && (
            <Card className="bg-slate-800/80 border-slate-600 backdrop-blur-sm mb-6">
              <CardHeader>
                <CardTitle className="text-slate-200">Wishlist ({wishlist.list_items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {wishlist.list_items.slice(0, 12).map((item: any) => (
                    <Link key={item.id} href={`/explore/${item.media_type}/${item.tmdb_id}`} className="group block">
                      <img
                        src={
                          item.poster_path
                            ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
                            : `/placeholder.svg?height=150&width=100&query=${item.title} poster`
                        }
                        alt={item.title}
                        className="w-full aspect-[2/3] rounded-lg object-cover group-hover:scale-105 transition-transform"
                      />
                      <p className="text-slate-200 text-xs mt-1 truncate group-hover:text-purple-300 transition-colors">
                        {item.title}
                      </p>
                    </Link>
                  ))}
                </div>
                {wishlist.list_items.length > 12 && (
                  <p className="text-slate-400 text-sm mt-3 text-center">
                    +{wishlist.list_items.length - 12} more items
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* No Content Message */}
          {(!recommendationsList || !recommendationsList.list_items || recommendationsList.list_items.length === 0) &&
            (!wishlist || !wishlist.list_items || wishlist.list_items.length === 0) && (
              <Card className="bg-slate-800/80 border-slate-600 backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <Film className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">No public lists yet</h3>
                  <p className="text-slate-400">
                    {friendProfile.display_name || friendProfile.username} hasn't shared any public lists yet.
                  </p>
                </CardContent>
              </Card>
            )}
        </div>
      </div>

      <MobileNavigation />
    </div>
  )
}
