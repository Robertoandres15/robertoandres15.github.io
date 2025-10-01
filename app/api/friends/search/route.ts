import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

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
    const query = searchParams.get("q")

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 })
    }

    // Search for users by username, display_name, or phone_number, excluding current user
    const { data: users, error } = await supabase
      .from("users")
      .select("id, username, display_name, bio, avatar_url, phone_number")
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,phone_number.ilike.%${query}%`)
      .neq("id", user.id)
      .limit(20)

    if (error) {
      console.error("Search users error:", error)
      return NextResponse.json({ error: "Failed to search users" }, { status: 500 })
    }

    // Get friendship status for each user
    const userIds = users?.map((u) => u.id) || []
    const { data: friendships } = await supabase
      .from("friends")
      .select("friend_id, status")
      .eq("user_id", user.id)
      .in("friend_id", userIds)

    const { data: incomingRequests } = await supabase
      .from("friends")
      .select("user_id, status")
      .eq("friend_id", user.id)
      .in("user_id", userIds)

    // Map friendship status to users
    const usersWithStatus = users?.map((searchUser) => {
      const outgoingFriendship = friendships?.find((f) => f.friend_id === searchUser.id)
      const incomingFriendship = incomingRequests?.find((f) => f.user_id === searchUser.id)

      let friendshipStatus = "none"
      if (outgoingFriendship) {
        friendshipStatus = outgoingFriendship.status === "accepted" ? "friends" : "pending_sent"
      } else if (incomingFriendship) {
        friendshipStatus = incomingFriendship.status === "accepted" ? "friends" : "pending_received"
      }

      return {
        ...searchUser,
        friendship_status: friendshipStatus,
      }
    })

    return NextResponse.json({ users: usersWithStatus })
  } catch (error) {
    console.error("Search users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
