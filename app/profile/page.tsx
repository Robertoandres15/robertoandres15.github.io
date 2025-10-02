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
import { useIsMobile } from "@/hooks/use-mobile"

function UserLists({ userId }: { userId: string }) {
  const [lists, setLists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadLists() {
      try {
        console.log("[v0] Loading user lists for:", userId)
        const supabase = createClient()
        if (!supabase) {
          setError("Unable to connect to database")
          return
        }

        const { data: listsData, error: listsError } = await supabase
          .from("lists")
          .select(`
            *,
            list_items(
              id,
              tmdb_id,
              title,
              poster_path,
              media_type,
              overview,
              rating,
              release_date
            )
          `)
          .eq("user_id", userId)
          .eq("is_public", true)
          .order("created_at", { ascending: false })

        if (listsError) {
          console.error("[v0] Lists fetch error:", listsError)
          setError("Failed to load lists")
          return
        }

        console.log("[v0] User lists loaded:", listsData?.length || 0)
        setLists(listsData || [])
      } catch (error) {
        console.error("[v0] UserLists error:", error)
        setError("Unable to load lists")
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      loadLists()
    }
  }, [userId])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading lists...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <List className="h-12 w-12 mx-auto mb-4 text-slate-400" />
        <p className="text-slate-400">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4 bg-purple-600 hover:bg-purple-700">
          Try Again
        </Button>
      </div>
    )
  }

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
                      item.poster_path
                        ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
                        : "/placeholder.svg?height=120&width=80"
                    }
                    alt={item.title || "Movie poster"}
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
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const isMobile = useIsMobile()

  useEffect(() => {
    async function loadProfile() {
      try {
        if (typeof window !== "undefined") {
          const keysToRemove: string[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && (key.includes("profile") || key.includes("user_data"))) {
              keysToRemove.push(key)
            }
          }
          keysToRemove.forEach((key) => localStorage.removeItem(key))
          console.log("[v0] Cleared cached profile data from localStorage")
        }

        console.log("[v0] Loading profile page")
        const supabase = createClient()

        if (!supabase) {
          console.error("[v0] Supabase client not available")
          router.push("/auth/signin")
          return
        }

        const { data: authData, error: authError } = await supabase.auth.getUser()

        if (authError || !authData?.user) {
          console.error("[v0] Auth error or no user:", authError)
          console.log("[v0] Redirecting to sign in - no valid session")
          router.push("/auth/signin")
          return
        }

        const user = authData.user

        console.log("[v0] ===== PROFILE DEBUG INFO =====")
        console.log("[v0] Authenticated User ID:", user.id)
        console.log("[v0] Authenticated User Email:", user.email)
        console.log("[v0] User created at:", user.created_at)
        console.log("[v0] User metadata:", JSON.stringify(user.user_metadata))
        console.log("[v0] Fetching profile for user ID:", user.id)

        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("[v0] Profile fetch error:", profileError)

          if (profileError.code === "PGRST116") {
            console.log("[v0] No profile found - redirecting to onboarding")
            router.push("/onboarding")
            return
          }

          setError("Failed to load profile")
          setLoading(false)
          return
        }

        console.log("[v0] Profile fetched from database:")
        console.log("[v0] - Profile ID:", profile?.id)
        console.log("[v0] - Profile Username:", profile?.username)
        console.log("[v0] - Profile Display Name:", profile?.display_name)
        console.log("[v0] - Profile Created At:", profile?.created_at)
        console.log("[v0] - Full profile data:", JSON.stringify(profile))

        if (profile.id !== user.id) {
          console.error("[v0] CRITICAL: Profile ID mismatch!")
          console.error("[v0] Expected user ID:", user.id)
          console.error("[v0] Got profile ID:", profile.id)
          setError("Profile data mismatch - please contact support")
          setLoading(false)
          return
        }

        console.log("[v0] ✓ Profile ID matches authenticated user ID")
        console.log("[v0] ===== END DEBUG INFO =====")

        if (!profile?.username) {
          console.log("[v0] User needs onboarding")
          router.push("/onboarding")
          return
        }

        console.log("[v0] Profile loaded:", profile.username)

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

        console.log("[v0] Profile stats:", stats)
        setProfileData({ user, profile, stats })
      } catch (error) {
        console.error("[v0] Profile page error:", error)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-white">Loading your profile...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <div className="space-x-4">
            <Button onClick={() => window.location.reload()} className="bg-purple-600 hover:bg-purple-700">
              Try Again
            </Button>
            <Button
              onClick={() => router.push("/feed")}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Go to Feed
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Profile not found</div>
      </div>
    )
  }

  const { user, profile, stats } = profileData

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Film className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Reel Friends</h1>
          </div>
          <nav className="flex flex-wrap gap-2">
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

        <div className="max-w-4xl mx-auto mb-4">
          <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-3 text-sm text-purple-200">
            <span className="font-semibold">Logged in as:</span> {user.email}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="bg-slate-800/80 border-slate-600 backdrop-blur-sm mb-8">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0">
                  <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-purple-600 text-white text-xl sm:text-2xl">
                    {profile.display_name?.[0] || profile.username?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center sm:text-left w-full">
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 mb-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-200">
                      {profile.display_name || profile.username}
                    </h2>
                    <Button size="sm" asChild className="bg-purple-600 hover:bg-purple-700 shrink-0">
                      <Link href="/settings">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Link>
                    </Button>
                  </div>

                  <p className="text-slate-400 mb-1">@{profile.username}</p>

                  {profile.bio && <p className="text-slate-300 mb-4">{profile.bio}</p>}

                  <div className="flex justify-center sm:justify-start gap-4 sm:gap-6 flex-wrap">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-slate-200">{stats.lists}</div>
                      <div className="text-xs sm:text-sm text-slate-400">Lists</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-slate-200">{stats.friends}</div>
                      <div className="text-xs sm:text-sm text-slate-400">Friends</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-slate-200">{stats.activities}</div>
                      <div className="text-xs sm:text-sm text-slate-400">Activities</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="lists" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/80 border-slate-600 text-slate-200 gap-1">
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
