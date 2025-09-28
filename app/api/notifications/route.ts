import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Notifications API called with URL:", request.url)

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      console.log("[v0] Notifications API - User not authenticated:", userError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Notifications API - User authenticated:", user.id)

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const unreadOnly = searchParams.get("unread_only") === "true"

    console.log("[v0] Notifications API - Query params:", { page, limit, unreadOnly })

    const offset = (page - 1) * limit

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (unreadOnly) {
      query = query.eq("read", false)
    }

    console.log("[v0] Notifications API - About to execute query")

    const { data: notifications, error } = await query

    if (error) {
      console.error("[v0] Notifications API - Query error:", error)
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    console.log("[v0] Notifications API - Query successful, found:", notifications?.length || 0, "notifications")

    const notificationsWithUsers = await Promise.all(
      notifications.map(async (notification) => {
        if (notification.from_user_id) {
          const { data: fromUser } = await supabase
            .from("users")
            .select("display_name, username, avatar_url")
            .eq("id", notification.from_user_id)
            .single()

          return {
            ...notification,
            from_user: fromUser,
          }
        }
        return notification
      }),
    )

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false)

    console.log("[v0] Notifications API - Unread count:", unreadCount)

    return NextResponse.json({
      notifications: notificationsWithUsers,
      unreadCount: unreadCount || 0,
      page,
      hasMore: notifications.length === limit,
    })
  } catch (error) {
    console.error("[v0] Notifications API - Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
