import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      console.error("[v0] Supabase client is null - environment variables not available")
      return NextResponse.json({ error: "Database service unavailable" }, { status: 503 })
    }

    const { data } = await supabase.auth.getUser()
    const user = data?.user

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { list_id, friend_ids } = await request.json()

    if (!list_id || !friend_ids || !Array.isArray(friend_ids) || friend_ids.length === 0) {
      return NextResponse.json({ error: "List ID and friend IDs are required" }, { status: 400 })
    }

    // Verify the list belongs to the user
    const { data: list, error: listError } = await supabase
      .from("lists")
      .select("id, name, user_id")
      .eq("id", list_id)
      .eq("user_id", user.id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: "List not found or access denied" }, { status: 404 })
    }

    // Create notifications for each friend
    const notifications = friend_ids.map((friend_id: string) => ({
      user_id: friend_id,
      type: "list_shared",
      title: "List shared with you",
      message: `${user.user_metadata?.display_name || user.email} shared a list "${list.name}" with you`,
      data: {
        list_id: list.id,
        shared_by: user.id,
        shared_by_name: user.user_metadata?.display_name || user.email,
      },
    }))

    const { error: notificationError } = await supabase.from("notifications").insert(notifications)

    if (notificationError) {
      console.error("[v0] Failed to create notifications:", notificationError)
      return NextResponse.json({ error: "Failed to notify friends" }, { status: 500 })
    }

    // Create a social signal for the share
    const { data: signal, error: signalError } = await supabase
      .from("social_signals")
      .insert({
        user_id: user.id,
        target_type: "list",
        target_id: list_id,
        signal_type: "share",
        content: `Shared with ${friend_ids.length} friend${friend_ids.length > 1 ? "s" : ""}`,
      })
      .select(
        `
        id,
        signal_type,
        content,
        created_at,
        user:users!social_signals_user_id_fkey(id, username, display_name, avatar_url)
      `,
      )
      .single()

    if (signalError) {
      console.error("[v0] Failed to create social signal:", signalError)
    }

    return NextResponse.json({
      message: "List shared successfully",
      shared_with: friend_ids.length,
      signal: signal || null,
    })
  } catch (error) {
    console.error("Share list API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
