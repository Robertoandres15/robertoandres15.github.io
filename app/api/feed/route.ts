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
    const feedType = searchParams.get("type") || "following"
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("feed_activities")
      .select(`
        *,
        user:users!feed_activities_user_id_fkey(id, username, display_name, avatar_url),
        target_user:users!feed_activities_target_user_id_fkey(id, username, display_name, avatar_url),
        list:lists(id, name, description, type, is_public)
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (feedType === "following") {
      // Get activities from friends only
      const { data: friends } = await supabase
        .from("friends")
        .select("friend_id")
        .eq("user_id", user.id)
        .eq("status", "accepted")

      const friendIds = friends?.map((f) => f.friend_id) || []

      if (friendIds.length > 0) {
        query = query.in("user_id", friendIds)
      } else {
        // No friends yet, return empty array
        return NextResponse.json({ activities: [], hasMore: false })
      }
    } else if (feedType === "trending") {
      // Get activities from the last 7 days, ordered by engagement
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      query = query.gte("created_at", sevenDaysAgo.toISOString())
    }

    const { data: activities, error } = await query

    if (error) {
      console.error("Feed fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 })
    }

    return NextResponse.json({
      activities: activities || [],
      hasMore: (activities?.length || 0) === limit,
    })
  } catch (error) {
    console.error("Feed API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
