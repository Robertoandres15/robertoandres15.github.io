import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { friendshipId, action } = await request.json()

    if (!friendshipId || !action) {
      return NextResponse.json({ error: "Friendship ID and action are required" }, { status: 400 })
    }

    if (!["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (action === "accept") {
      // Update the friendship status to accepted
      const { error } = await supabase
        .from("friends")
        .update({ status: "accepted" })
        .eq("id", friendshipId)
        .eq("friend_id", user.id)
        .eq("status", "pending")

      if (error) {
        console.error("Accept friend request error:", error)
        return NextResponse.json({ error: "Failed to accept friend request" }, { status: 500 })
      }
    } else {
      // Delete the friendship request
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("id", friendshipId)
        .eq("friend_id", user.id)
        .eq("status", "pending")

      if (error) {
        console.error("Decline friend request error:", error)
        return NextResponse.json({ error: "Failed to decline friend request" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Respond to friend request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
