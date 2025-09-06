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

    const { searchParams } = new URL(request.url)
    const friendId = searchParams.get("friend_id")

    console.log("[v0] Recommendations API - Friend ID requested:", friendId)

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
      console.log("[v0] Recommendations API - No friendships found")
      return NextResponse.json({ recommendations: [] })
    }

    let friendIds = friendships.map((f) => (f.user_id === user.id ? f.friend_id : f.user_id))
    console.log("[v0] Recommendations API - All friend IDs:", friendIds)

    if (friendId) {
      // If specific friend is selected, only get recommendations from that friend
      const isValidFriend = friendIds.includes(friendId)
      if (!isValidFriend) {
        console.log("[v0] Recommendations API - Friend not found in friendships:", friendId)
        return NextResponse.json({ error: "Friend not found or not connected" }, { status: 404 })
      }
      friendIds = [friendId]
      console.log("[v0] Recommendations API - Filtering to specific friend:", friendId)
    }

    const { data: friendLists } = await supabase
      .from("lists")
      .select("id, user_id, name, type")
      .eq("type", "recommendations")
      .in("user_id", friendIds)

    console.log("[v0] Recommendations API - Friend recommendation lists found:", friendLists?.length || 0)
    if (friendLists) {
      friendLists.forEach((list) => {
        console.log("[v0] Recommendations API - List:", {
          id: list.id,
          user_id: list.user_id,
          name: list.name,
          type: list.type,
        })
      })
    }

    const { data: friendRecommendations } = await supabase
      .from("list_items")
      .select(`
        *,
        lists!inner(user_id, name, type)
      `)
      .eq("lists.type", "recommendations")
      .in("lists.user_id", friendIds)

    console.log("[v0] Recommendations API - Friend recommendation items found:", friendRecommendations?.length || 0)
    if (friendRecommendations) {
      friendRecommendations.forEach((item) => {
        console.log("[v0] Recommendations API - Item:", {
          tmdb_id: item.tmdb_id,
          title: item.title,
          media_type: item.media_type,
          list_user: item.lists.user_id,
        })
      })
    }

    if (!friendRecommendations || friendRecommendations.length === 0) {
      console.log("[v0] Recommendations API - No recommendations found for friend(s)")
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

    console.log("[v0] Applying filters with recommendedBy:", friendId)

    // Group recommendations by movie/series and filter out unwanted items
    const groupedRecommendations = new Map()

    for (const rec of friendRecommendations) {
      const key = `${rec.tmdb_id}-${rec.media_type}`

      // Allow seen and wishlist items to show since user specifically wants to see this friend's recommendations
      if (friendId) {
        // For specific friend recommendations, only skip items user marked as not interested
        if (notInterestedSet.has(key)) {
          console.log("[v0] Skipping not interested item:", rec.title)
          continue
        }
      } else {
        // For general recommendations, skip if user has seen, not interested, or already in wishlist
        if (seenSet.has(key) || notInterestedSet.has(key) || wishlistSet.has(key)) {
          continue
        }
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
