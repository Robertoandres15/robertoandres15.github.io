"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, UserPlus, Users, Clock, Check, X, MessageSquare, Plus, User, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MobileNavigation } from "@/components/mobile-navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [autoSuggestResults, setAutoSuggestResults] = useState([])
  const [showAutoSuggest, setShowAutoSuggest] = useState(false)
  const [isAutoSuggesting, setIsAutoSuggesting] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  const checkAuthentication = async () => {
    try {
      console.log("[v0] Checking authentication...")
      const supabase = createClient()

      if (!supabase) {
        console.log("[v0] Supabase client not available")
        setAuthLoading(false)
        return
      }

      const { data: authData, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.log("[v0] Auth error:", authError.message)
        router.push("/auth/login")
        return
      }

      const authenticatedUser = authData?.user
      if (!authenticatedUser) {
        console.log("[v0] No auth session found, redirecting to login")
        router.push("/auth/login")
        return
      }

      console.log("[v0] User authenticated:", authenticatedUser.id)
      setUser(authenticatedUser)
    } catch (error) {
      console.log("[v0] Auth check error:", error)
      router.push("/auth/login")
    } finally {
      setAuthLoading(false)
    }
  }

  useEffect(() => {
    checkAuthentication()
  }, [])

  const handleAutoSuggest = async (query: string) => {
    if (!user) return

    if (query.trim().length < 2) {
      setAutoSuggestResults([])
      setShowAutoSuggest(false)
      return
    }

    setIsAutoSuggesting(true)
    try {
      const response = await fetch(`/api/friends/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setAutoSuggestResults(data.users || [])
      setShowAutoSuggest(true)
    } catch (error) {
      console.error("Auto-suggest failed:", error)
      setAutoSuggestResults([])
      setShowAutoSuggest(false)
    } finally {
      setIsAutoSuggesting(false)
    }
  }

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleAutoSuggest(value)
    }, 300)
  }

  const selectSuggestion = (user: any) => {
    setSearchQuery(user.username)
    setSearchResults([user])
    setShowAutoSuggest(false)
    setAutoSuggestResults([])
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowAutoSuggest(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const searchUsers = async () => {
    if (!user) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/friends/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setSearchResults(data.users || [])
      setShowAutoSuggest(false)
    } catch (error) {
      console.error("Failed to search users:", error)
      toast({
        title: "Failed to search",
        description: "An error occurred while searching for users",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return

    try {
      const response = await fetch("/api/friends/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendId }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Friend request sent",
          description: "Your friend request has been sent successfully",
        })

        setSearchResults((prev) =>
          prev.map((user: any) => (user.id === friendId ? { ...user, friendship_status: "pending_sent" } : user)),
        )
        setAutoSuggestResults((prev) =>
          prev.map((user: any) => (user.id === friendId ? { ...user, friendship_status: "pending_sent" } : user)),
        )
      } else {
        toast({
          title: "Failed to send request",
          description: data.error || "An error occurred while sending the friend request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to send friend request:", error)
      toast({
        title: "Failed to send request",
        description: "An error occurred while sending the friend request",
        variant: "destructive",
      })
    }
  }

  const respondToRequest = async (friendshipId: string, action: "accept" | "decline") => {
    if (!user) return

    try {
      const response = await fetch("/api/friends/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendshipId, action }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: action === "accept" ? "Friend request accepted" : "Friend request declined",
          description: `You have ${action === "accept" ? "accepted" : "declined"} the friend request`,
        })

        setPendingRequests((prev) => prev.filter((request: any) => request.id !== friendshipId))

        if (action === "accept") {
          fetchFriendsAndRequests()
        }
      } else {
        toast({
          title: `Failed to ${action} request`,
          description: data.error || `An error occurred while ${action}ing the friend request`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Failed to ${action} friend request:`, error)
      toast({
        title: `Failed to ${action} request`,
        description: `An error occurred while ${action}ing the friend request`,
        variant: "destructive",
      })
    }
  }

  const fetchFriendsAndRequests = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const friendsResponse = await fetch("/api/friends/list?type=friends")
      const friendsData = await friendsResponse.json()
      setFriends(friendsData.friends || [])

      const requestsResponse = await fetch("/api/friends/list?type=pending")
      const requestsData = await requestsResponse.json()
      setPendingRequests(requestsData.requests || [])
    } catch (error) {
      console.error("Failed to fetch friends and requests:", error)
      toast({
        title: "Failed to load friends and requests",
        description: "An error occurred while loading your friends and pending requests",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchFriendsAndRequests()
    }
  }, [user])

  const openNativeSMS = () => {
    const inviteLink = `${window.location.origin}/signup?ref=${btoa(Date.now().toString())}`

    const message = `Hey! I'm using Reel Friends to discover and share movies & TV shows with friends. Join me! ${inviteLink}`

    const smsUrl = `sms:?body=${encodeURIComponent(message)}`

    try {
      window.open(smsUrl, "_self")
      toast({
        title: "SMS app opened",
        description: "Select contacts and send your invite!",
      })
      setShowInviteDialog(false)
    } catch (error) {
      console.error("Failed to open SMS app:", error)
      toast({
        title: "Unable to open SMS app",
        description: "Please copy the invite link and share it manually",
        variant: "destructive",
      })
    }
  }

  const copyInviteLink = async () => {
    const inviteLink = `${window.location.origin}/signup?ref=${btoa(Date.now().toString())}`

    try {
      await navigator.clipboard.writeText(
        `Hey! I'm using Reel Friends to discover and share movies & TV shows with friends. Join me! ${inviteLink}`,
      )
      toast({
        title: "Invite copied",
        description: "Share this message with your friends!",
      })
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      toast({
        title: "Copy failed",
        description: "Please manually copy the invite link",
        variant: "destructive",
      })
    }
  }

  const getFriendButtonContent = (user: any) => {
    switch (user.friendship_status) {
      case "friends":
        return (
          <Button variant="outline" className="bg-green-600 hover:bg-green-700 text-white" disabled>
            <Check className="h-4 w-4 mr-2" />
            Friends
          </Button>
        )
      case "pending_sent":
        return (
          <Button variant="outline" className="bg-yellow-600 hover:bg-yellow-700 text-white" disabled>
            <Clock className="h-4 w-4 mr-2" />
            Pending
          </Button>
        )
      case "pending_received":
        return (
          <Button variant="outline" className="bg-blue-600 hover:bg-blue-700 text-white" disabled>
            <Clock className="h-4 w-4 mr-2" />
            Respond in Requests
          </Button>
        )
      default:
        return (
          <Button
            variant="outline"
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => sendFriendRequest(user.id)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Friend
          </Button>
        )
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-white">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="hidden md:block border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <a href="/feed" className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors">
                <Users className="h-5 w-5" />
                <span>Feed</span>
              </a>
              <a
                href="/explore"
                className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
              >
                <Search className="h-5 w-5" />
                <span>Explore</span>
              </a>
              <a href="/friends" className="flex items-center space-x-2 text-purple-400 font-medium">
                <Users className="h-5 w-5" />
                <span>Friends</span>
              </a>
              <a href="/lists" className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors">
                <Plus className="h-5 w-5" />
                <span>Lists</span>
              </a>
              <a
                href="/profile"
                className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Friends</h1>

          <Tabs defaultValue="search" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/10">
              <TabsTrigger value="search" className="data-[state=active]:bg-purple-600">
                <Search className="h-4 w-4 mr-2" />
                Search
              </TabsTrigger>
              <TabsTrigger value="friends" className="data-[state=active]:bg-purple-600">
                <Users className="h-4 w-4 mr-2" />
                Friends ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="requests" className="data-[state=active]:bg-purple-600">
                <Clock className="h-4 w-4 mr-2" />
                Requests ({pendingRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4">
              <Card className="bg-slate-800/80 border-slate-600 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-slate-200">Find Friends</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1" ref={searchInputRef}>
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
                      <Input
                        placeholder="Search by username, name, or phone number..."
                        value={searchQuery}
                        onChange={(e) => handleSearchInputChange(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && searchUsers()}
                        onFocus={() => searchQuery.length >= 2 && setShowAutoSuggest(true)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />

                      {showAutoSuggest && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
                          {isAutoSuggesting ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="h-4 w-4 animate-spin text-slate-400 mr-2" />
                              <span className="text-slate-400 text-sm">Searching...</span>
                            </div>
                          ) : autoSuggestResults.length > 0 ? (
                            autoSuggestResults.map((user: any) => (
                              <div
                                key={user.id}
                                className="flex items-center gap-3 p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-b-0"
                                onClick={() => selectSuggestion(user)}
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={user.avatar_url || "/placeholder.svg"}
                                    alt={user.display_name}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.style.display = "none"
                                    }}
                                  />
                                  <AvatarFallback className="text-xs bg-purple-600 text-white">
                                    {user.display_name?.charAt(0) || user.username?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-medium truncate">{user.display_name}</p>
                                  <p className="text-slate-400 text-xs truncate">@{user.username}</p>
                                </div>
                                <div className="flex-shrink-0">
                                  {user.friendship_status === "friends" ? (
                                    <Check className="h-4 w-4 text-green-400" />
                                  ) : user.friendship_status === "pending_sent" ? (
                                    <Clock className="h-4 w-4 text-yellow-400" />
                                  ) : user.friendship_status === "pending_received" ? (
                                    <Clock className="h-4 w-4 text-blue-400" />
                                  ) : (
                                    <UserPlus className="h-4 w-4 text-purple-400" />
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center">
                              <p className="text-slate-400 text-sm">No users found</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Button onClick={searchUsers} disabled={isSearching} className="bg-purple-600 hover:bg-purple-700">
                      {isSearching ? "Searching..." : "Search"}
                    </Button>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-slate-200 font-medium">Invite Friends</h3>
                      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white bg-transparent"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Invite Friends
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-white/10">
                          <DialogHeader>
                            <DialogTitle className="text-white">Invite Friends to Reel Friends</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                              <p className="text-white text-sm mb-2">Your invite message:</p>
                              <p className="text-slate-300 text-sm italic">
                                "Hey! I'm using Reel Friends to discover and share movies & TV shows with friends. Join
                                me! [invite link]"
                              </p>
                            </div>

                            <div className="space-y-3">
                              <Button
                                onClick={openNativeSMS}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Open SMS App
                              </Button>

                              <Button
                                onClick={copyInviteLink}
                                variant="outline"
                                className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white bg-slate-800/50"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Copy Invite Message
                              </Button>
                            </div>

                            <div className="text-xs text-slate-400 space-y-1">
                              <p>• SMS app will open with pre-written message</p>
                              <p>• Select contacts and send from your phone</p>
                              <p>• No SMS charges from Reel Friends</p>
                            </div>

                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                onClick={() => setShowInviteDialog(false)}
                                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white bg-slate-800/50"
                              >
                                Close
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Invite friends using your phone's messaging app. They'll get a personal invite from you!
                    </p>
                  </div>
                </CardContent>
              </Card>

              {searchResults.length > 0 && (
                <Card className="bg-slate-800/80 border-slate-600 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-slate-200">Search Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {searchResults.map((user: any) => (
                      <div key={user.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
                        <Avatar>
                          <AvatarImage
                            src={user.avatar_url || "/placeholder.svg"}
                            alt={user.display_name}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = "none"
                            }}
                          />
                          <AvatarFallback className="bg-purple-600 text-white">
                            {user.display_name?.charAt(0) || user.username?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{user.display_name}</h3>
                          <p className="text-slate-400 text-sm">@{user.username}</p>
                        </div>
                        {getFriendButtonContent(user)}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="friends" className="space-y-4">
              <Card className="bg-slate-800/80 border-slate-600 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-slate-200">Your Friends</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {friends.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-400">No friends yet. Start by searching for people you know!</p>
                    </div>
                  ) : (
                    friends.map((friend: any) => (
                      <div key={friend.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
                        <Avatar>
                          <AvatarImage
                            src={friend.friend?.avatar_url || "/placeholder.svg"}
                            alt={friend.friend?.display_name}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = "none"
                            }}
                          />
                          <AvatarFallback className="bg-purple-600 text-white">
                            {friend.friend?.display_name?.charAt(0) || friend.friend?.username?.charAt(0) || "F"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Link
                            href={`/friends/${friend.friend.id}`}
                            className="hover:text-purple-300 transition-colors"
                          >
                            <h3 className="text-white font-medium hover:underline">{friend.friend?.display_name}</h3>
                          </Link>
                          <p className="text-slate-400 text-sm">@{friend.friend?.username}</p>
                        </div>
                        <Button variant="outline" className="bg-green-600 hover:bg-green-700 text-white" disabled>
                          <Check className="h-4 w-4 mr-2" />
                          Friends
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              <Card className="bg-slate-800/80 border-slate-600 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-slate-200">Friend Requests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-400">No pending friend requests.</p>
                    </div>
                  ) : (
                    pendingRequests.map((request: any) => (
                      <div key={request.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
                        <Avatar>
                          <AvatarImage
                            src={request.user?.avatar_url || "/placeholder.svg"}
                            alt={request.user?.display_name}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = "none"
                            }}
                          />
                          <AvatarFallback className="bg-purple-600 text-white">
                            {request.user?.display_name?.charAt(0) || request.user?.username?.charAt(0) || "R"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{request.user?.display_name}</h3>
                          <p className="text-slate-400 text-sm">@{request.user?.username}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => respondToRequest(request.id, "accept")}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => respondToRequest(request.id, "decline")}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <MobileNavigation />
    </div>
  )
}
