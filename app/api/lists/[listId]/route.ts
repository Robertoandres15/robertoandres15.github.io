import { type NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { listId: string } }) {
  try {
    console.log("[v0] Lists API route called for listId:", params.listId)

    const supabase = await createServerClient()

    if (!supabase) {
      console.log("[v0] Database connection failed")
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    console.log("[v0] Supabase client created successfully")

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Authentication failed:", authError)
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("[v0] User authenticated:", user.id)

    // Get the specific list with its items
    const { data: list, error: listError } = await supabase
      .from("lists")
      .select(`
        *,
        user:users(id, username, display_name, avatar_url),
        list_items(*)
      `)
      .eq("id", params.listId)
      .single()

    if (listError) {
      console.error("[v0] Database error:", listError)
      return NextResponse.json({ error: "Failed to fetch list" }, { status: 500 })
    }

    if (!list) {
      console.log("[v0] List not found for ID:", params.listId)
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    console.log("[v0] List found:", list.name, "with", list.list_items?.length || 0, "items")

    // Check if user has access to this list
    if (!list.is_public && list.user_id !== user.id) {
      console.log("[v0] Access denied for user:", user.id, "to list:", params.listId)
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    console.log("[v0] Returning list data successfully")
    return NextResponse.json({ list })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
