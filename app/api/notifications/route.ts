import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const unreadOnly = searchParams.get("unread_only") === "true"

    const offset = (page - 1) * limit

    let query = supabase
      .from("notifications")
      .select(`
        *,
        from_user:from_user_id(display_name, username, avatar_url)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (unreadOnly) {
      query = query.eq("read", false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error("Error fetching notifications:", error)
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false)

    return NextResponse.json({
      notifications,
      unreadCount: unreadCount || 0,
      page,
      hasMore: notifications.length === limit,
    })
  } catch (error) {
    console.error("Error in notifications API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
