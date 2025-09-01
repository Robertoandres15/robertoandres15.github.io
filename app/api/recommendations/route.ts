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

    // Get user's friends
    const { data: friends } = await supabase
      .from("friends")
      .select("friend_id, users!friends_friend_id_fkey(id, username, display_name, avatar_url)")
      .eq("user_id", user.id)
      .eq("status", "accepted")

    if (!friends || friends.length === 0) {
      return NextResponse.json({ recommendations: [] })
    }

    const friendIds = friends.map((f) => f.friend_id)

    // Get all recommendations from friends (items in their "Recommendations" lists)
    const { data: friendRecommendations } = await supabase
      .from("list_items")
      .select(`
        *,
        list:lists!inner(user_id, name),
        user:lists(user:users(id, username, display_name, avatar_url))
      `)
      .eq("list.name", "Recommendations")
      .in("list.user_id", friendIds)

    if (!friendRecommendations || friendRecommendations.length === 0) {
      return NextResponse.json({ recommendations: [] })
    }

    // Get items user has already seen or marked as not interested
    const { data: userSeen } = await supabase.from("user_seen").select("tmdb_id, media_type").eq("user_id", user.id)

    const { data: userNotInterested } = await supabase
      .from("user_not_interested")
      .select("tmdb_id, media_type")
      .eq("user_id", user.id)

    // Get items already in user's wishlist
    const { data: userWishlist } = await supabase
      .from("list_items")
      .select("tmdb_id, media_type, list:lists!inner(name)")
      .eq("list.name", "Wishlist")
      .eq("list.user_id", user.id)

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

      const friend = friends.find((f) => f.friend_id === rec.list.user_id)
      if (friend) {
        groupedRecommendations.get(key).recommending_friends.push(friend.users)
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
