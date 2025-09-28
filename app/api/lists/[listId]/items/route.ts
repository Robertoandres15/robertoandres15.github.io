import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { listId: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { listId } = params
    const { tmdb_id, media_type, title, poster_path, overview, release_date, rating, note } = await request.json()

    if (!tmdb_id || !media_type || !title) {
      return NextResponse.json({ error: "TMDB ID, media type, and title are required" }, { status: 400 })
    }

    // Verify the list belongs to the user
    const { data: list, error: listError } = await supabase
      .from("lists")
      .select("id, user_id")
      .eq("id", listId)
      .eq("user_id", user.id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: "List not found or access denied" }, { status: 404 })
    }

    // Check if item already exists in the list
    const { data: existingItems, error: existingError } = await supabase
      .from("list_items")
      .select("id")
      .eq("list_id", listId)
      .eq("tmdb_id", tmdb_id)
      .eq("media_type", media_type)

    if (existingError) {
      console.error("Error checking existing item:", existingError)
      return NextResponse.json({ error: "Failed to check existing items" }, { status: 500 })
    }

    if (existingItems && existingItems.length > 0) {
      return NextResponse.json({ error: "Item already exists in this list" }, { status: 400 })
    }

    const { data: listItem, error } = await supabase
      .from("list_items")
      .insert({
        list_id: listId,
        tmdb_id,
        media_type,
        title,
        poster_path: poster_path || null,
        overview: overview || null,
        release_date: release_date || null,
        rating: rating || null,
        note: note || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Add list item error:", error)
      return NextResponse.json({ error: "Failed to add item to list" }, { status: 500 })
    }

    return NextResponse.json({ listItem })
  } catch (error) {
    console.error("Add list item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { listId: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { listId } = params
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get("item_id")

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    // Verify the list belongs to the user
    const { data: list, error: listError } = await supabase
      .from("lists")
      .select("id, user_id")
      .eq("id", listId)
      .eq("user_id", user.id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: "List not found or access denied" }, { status: 404 })
    }

    const { error } = await supabase.from("list_items").delete().eq("id", itemId).eq("list_id", listId)

    if (error) {
      console.error("Remove list item error:", error)
      return NextResponse.json({ error: "Failed to remove item from list" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Remove list item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
