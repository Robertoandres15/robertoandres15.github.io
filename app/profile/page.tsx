"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Film, Users, Search, Settings, Edit, List, Activity } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

async function UserLists({ userId }: { userId: string }) {
  try {
    const supabase = createClient()
    if (!supabase) {
      return (
        <div className="text-center py-8">
          <List className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-400">Unable to load lists</p>
        </div>
      )
    }

    const { data: lists } = await supabase
      .from("lists")
      .select(`
        *,
        list_items(
          id,
          content_id,
          metadata
        )
      `)
      .eq("user_id", userId)
      .eq("is_public", true)
      .order("created_at", { ascending: false })

    if (!lists || lists.length === 0) {
      return (
        <div className="text-center py-8">
          <List className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-400">No public lists yet</p>
          <Button asChild className="mt-4 bg-purple-600 hover:bg-purple-700">
            <Link href="/lists">Create Your First List</Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="grid gap-4">
        {lists.map((list) => (
          <Card key={list.id} className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">{list.name}</CardTitle>
                <Badge variant="secondary" className="bg-purple-600/20 text-purple-300">
                  {list.type}
                </Badge>
              </div>
              {list.description && <p className="text-slate-400 text-sm">{list.description}</p>}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>{list.list_items?.length || 0} items</span>
                <span>•</span>
                <span>{new Date(list.created_at).toLocaleDateString()}</span>
              </div>
              {list.list_items && list.list_items.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {list.list_items.slice(0, 4).map((item) => (
                    <img
                      key={item.id}
                      src={
                        item.metadata?.poster_path
                          ? `https://image.tmdb.org/t/p/w200${item.metadata.poster_path}`
                          : "/placeholder.svg?height=120&width=80"
                      }
                      alt={item.metadata?.title || "Movie poster"}
                      className="w-12 h-18 object-cover rounded flex-shrink-0"
                    />
                  ))}
                  {list.list_items.length > 4 && (
                    <div className="w-12 h-18 bg-white/10 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-white">+{list.list_items.length - 4}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  } catch (error) {
    console.error("[v0] UserLists error:", error)
    return (
      <div className="text-center py-8">
        <List className="h-12 w-12 mx-auto mb-4 text-slate-400" />
        <p className="text-slate-400">Unable to load lists</p>
      </div>
    )
  }
}

interface ProfileData {
  user: any
  profile: any
  stats: {
    lists: number
    friends: number
    activities: number
  }
}

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient()

        if (!supabase) {
          router.push("/auth/login")
          return
        }

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

        if (!profile?.username) {
          router.push("/onboarding")
          return
        }

        const [listsResult, friendsResult, activitiesResult] = await Promise.allSettled([
          supabase.from("lists").select("id").eq("user_id", user.id),
          supabase.from("friends").select("id").eq("user_id", user.id).eq("status", "accepted"),
          supabase.from("feed_activities").select("id").eq("user_id", user.id),
        ])

        const stats = {
          lists: listsResult.status === "fulfilled" ? listsResult.value.data?.length || 0 : 0,
          friends: friendsResult.status === "fulfilled" ? friendsResult.value.data?.length || 0 : 0,
          activities: activitiesResult.status === "fulfilled" ? activitiesResult.value.data?.length || 0 : 0,
        }

        setProfileData({ user, profile, stats })
      } catch (error) {
        console.error("[v0] Profile page error:", error)
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!profileData) {
    return null
  }

  const { user, profile, stats } = profileData

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Film className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Reel Friends</h1>
          </div>
          <nav className="flex gap-2">
            <Button variant="ghost" asChild className="text-white hover:bg-white/10">
              <Link href="/feed">
                <Activity className="h-4 w-4 mr-2" />
                Feed
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-white hover:bg-white/10">
              <Link href="/explore">
                <Search className="h-4 w-4 mr-2" />
                Explore
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-white hover:bg-white/10">
              <Link href="/friends">
                <Users className="h-4 w-4 mr-2" />
                Friends
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-white hover:bg-white/10">
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </nav>
        </header>

        <div className="max-w-4xl mx-auto">
          <Card className="bg-slate-800/80 border-slate-600 backdrop-blur-sm mb-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-purple-600 text-white text-2xl">
                    {profile.display_name?.[0] || profile.username?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-slate-200">{profile.display_name || profile.username}</h2>
                    <Button size="sm" asChild className="bg-purple-600 hover:bg-purple-700">
                      <Link href="/settings">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Link>
                    </Button>
                  </div>

                  <p className="text-slate-400 mb-1">@{profile.username}</p>

                  {profile.bio && <p className="text-slate-300 mb-4">{profile.bio}</p>}

                  <div className="flex gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-200">{stats.lists}</div>
                      <div className="text-sm text-slate-400">Lists</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-200">{stats.friends}</div>
                      <div className="text-sm text-slate-400">Friends</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-200">{stats.activities}</div>
                      <div className="text-sm text-slate-400">Activities</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="lists" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/80 border-slate-600 text-slate-200">
              <TabsTrigger
                value="lists"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-200"
              >
                My Lists
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-200"
              >
                Recent Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lists" className="mt-6">
              <UserLists userId={user.id} />
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-semibold text-white mb-2">Activity Timeline</h3>
                <p className="text-slate-400 mb-4">
                  Your recent activities will appear here as you interact with movies and friends.
                </p>
                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                  <Link href="/explore">Start Exploring</Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
