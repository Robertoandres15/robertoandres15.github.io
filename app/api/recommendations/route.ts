import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: friendships } = await supabase
      .from("friends")
      .select(`
        user_id,
        friend_id,
        user:users!friends_user_id_fkey(id, username, display_name, avatar_url),
        friend:users!friends_friend_id_fkey(id, username, display_name, avatar_url)
      `)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq("status", "accepted")

    if (!friendships || friendships.length === 0) {
      return NextResponse.json({ recommendations: [] })
    }

    const friendIds = friendships.map((f) => (f.user_id === user.id ? f.friend_id : f.user_id))

    const { data: friendRecommendations } = await supabase
      .from("list_items")
      .select(`
        *,
        lists!inner(user_id, name, type)
      `)
      .eq("lists.type", "recommendations")
      .in("lists.user_id", friendIds)

    if (!friendRecommendations || friendRecommendations.length === 0) {
      return NextResponse.json({ recommendations: [] })
    }

    // Get items user has already seen or marked as not interested
    const { data: userSeen } = await supabase.from("user_seen").select("tmdb_id, media_type").eq("user_id", user.id)

    const { data: userNotInterested } = await supabase
      .from("user_not_interested")
      .select("tmdb_id, media_type")
      .eq("user_id", user.id)

    const { data: userWishlist } = await supabase
      .from("list_items")
      .select(`
        tmdb_id, 
        media_type, 
        lists!inner(name, type)
      `)
      .eq("lists.type", "wishlist")
      .eq("lists.user_id", user.id)

    // Create sets for quick lookup
    const seenSet = new Set(userSeen?.map((item) => `${item.tmdb_id}-${item.media_type}`) || [])
    const notInterestedSet = new Set(userNotInterested?.map((item) => `${item.tmdb_id}-${item.media_type}`) || [])
    const wishlistSet = new Set(userWishlist?.map((item) => `${item.tmdb_id}-${item.media_type}`) || [])

    // Group recommendations by movie/series and filter out unwanted items
    const groupedRecommendations = new Map()

    for (const rec of friendRecommendations) {
      const key = `${rec.tmdb_id}-${rec.media_type}`

      // Skip if user has seen, not interested, or already in wishlist
      if (seenSet.has(key) || notInterestedSet.has(key) || wishlistSet.has(key)) {
        continue
      }

      if (!groupedRecommendations.has(key)) {
        groupedRecommendations.set(key, {
          ...rec,
          recommending_friends: [],
        })
      }

      const recommendingFriend = friendships.find((f) => {
        const friendId = f.user_id === user.id ? f.friend_id : f.user_id
        return friendId === rec.lists.user_id
      })

      if (recommendingFriend) {
        const friendData = recommendingFriend.user_id === user.id ? recommendingFriend.friend : recommendingFriend.user
        groupedRecommendations.get(key).recommending_friends.push(friendData)
      }
    }

    // Convert to array and sort by number of recommending friends
    const recommendations = Array.from(groupedRecommendations.values()).sort(
      (a, b) => b.recommending_friends.length - a.recommending_friends.length,
    )

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error("Error fetching recommendations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
