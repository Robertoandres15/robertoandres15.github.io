import { type NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { listId: string } }) {
  try {
    const supabase = await createServerClient()

    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

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
      console.error("Database error:", listError)
      return NextResponse.json({ error: "Failed to fetch list" }, { status: 500 })
    }

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    // Check if user has access to this list
    if (!list.is_public && list.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ list })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
