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

    const { friendId } = await request.json()

    if (!friendId) {
      return NextResponse.json({ error: "Friend ID is required" }, { status: 400 })
    }

    if (friendId === user.id) {
      return NextResponse.json({ error: "Cannot send friend request to yourself" }, { status: 400 })
    }

    // Check if friendship already exists
    const { data: existingFriendship } = await supabase
      .from("friends")
      .select("id, status")
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
      .single()

    if (existingFriendship) {
      return NextResponse.json({ error: "Friendship already exists" }, { status: 400 })
    }

    // Create friend request
    const { error } = await supabase.from("friends").insert({
      user_id: user.id,
      friend_id: friendId,
      status: "pending",
    })

    if (error) {
      console.error("Create friend request error:", error)
      return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Send friend request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
