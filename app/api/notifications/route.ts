import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

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

    // Build the base query with explicit column selection
    let baseQuery = supabase
      .from("notifications")
      .select("id, user_id, from_user_id, type, title, message, data, read, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (unreadOnly) {
      baseQuery = baseQuery.eq("read", false)
    }

    // Apply pagination
    const query = baseQuery.range(offset, offset + limit - 1)

    console.log("[v0] Notifications API - About to execute query")
    console.log("[v0] Notifications API - Query details:", {
      table: "notifications",
      select: "id, user_id, from_user_id, type, title, message, data, read, created_at, updated_at",
      filters: { user_id: user.id, ...(unreadOnly && { read: false }) },
      order: "created_at desc",
      range: [offset, offset + limit - 1],
    })

    const { data: notifications, error } = await query

    if (error) {
      console.error("[v0] Notifications API - Query error:", error)
      console.error("[v0] Notifications API - Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    console.log("[v0] Notifications API - Query successful, found:", notifications?.length || 0, "notifications")

    const notificationsWithUsers = await Promise.all(
      (notifications || []).map(async (notification) => {
        if (notification.from_user_id) {
          try {
            console.log("[v0] Notifications API - Fetching user data for:", notification.from_user_id)
            const { data: fromUser, error: userFetchError } = await supabase
              .from("users")
              .select("display_name, username, avatar_url")
              .eq("id", notification.from_user_id)
              .single()

            if (userFetchError) {
              console.error("[v0] Notifications API - Error fetching user:", userFetchError)
              return notification // Return notification without user data if fetch fails
            }

            return {
              ...notification,
              from_user: fromUser,
            }
          } catch (userError) {
            console.error("[v0] Notifications API - Exception fetching user:", userError)
            return notification
          }
        }
        return notification
      }),
    )

    let unreadCount = 0
    try {
      console.log("[v0] Notifications API - Fetching unread count")
      const { count, error: countError } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)

      if (countError) {
        console.error("[v0] Notifications API - Error fetching unread count:", countError)
      } else {
        unreadCount = count || 0
      }
    } catch (countException) {
      console.error("[v0] Notifications API - Exception fetching unread count:", countException)
    }

    console.log("[v0] Notifications API - Unread count:", unreadCount)

    return NextResponse.json({
      notifications: notificationsWithUsers,
      unreadCount,
      page,
      hasMore: (notifications || []).length === limit,
    })
  } catch (error) {
    console.error("[v0] Notifications API - Unexpected error:", error)
    console.error("[v0] Notifications API - Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
