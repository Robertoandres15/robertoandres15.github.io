import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      console.error("[v0] Supabase client is null - environment variables not available")
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }

    const { data } = await supabase.auth.getUser()
    const user = data?.user

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "friends"

    if (type === "friends") {
      // Get accepted friends
      const { data: friendships, error } = await supabase
        .from("friends")
        .select(
          `
          id,
          user_id,
          friend_id,
          status,
          created_at,
          user:users!friends_user_id_fkey(id, username, display_name, bio, avatar_url),
          friend:users!friends_friend_id_fkey(id, username, display_name, bio, avatar_url)
        `,
        )
        .or(`and(user_id.eq.${user.id},status.eq.accepted),and(friend_id.eq.${user.id},status.eq.accepted)`)
        .order("created_at", { ascending: false })

      if (error) {
        return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 })
      }

      // Format the response to always show the friend (not the current user)
      const friends = friendships?.map((friendship) => {
        const friend = friendship.user_id === user.id ? friendship.friend : friendship.user
        return {
          id: friendship.id,
          friend,
          created_at: friendship.created_at,
        }
      })

      return NextResponse.json({ friends })
    } else if (type === "pending") {
      // Get pending friend requests (received)
      const { data: pendingRequests, error } = await supabase
        .from("friends")
        .select(
          `
          id,
          user_id,
          friend_id,
          status,
          created_at,
          user:users!friends_user_id_fkey(id, username, display_name, bio, avatar_url)
        `,
        )
        .eq("friend_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (error) {
        return NextResponse.json({ error: "Failed to fetch pending requests" }, { status: 500 })
      }

      const requests = pendingRequests?.map((request) => ({
        id: request.id,
        user: request.user,
        created_at: request.created_at,
      }))

      return NextResponse.json({ requests })
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 })
  } catch (error) {
    console.error("Friends list API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
