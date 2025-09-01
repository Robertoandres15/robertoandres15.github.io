import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: sharedItems, error } = await supabase
      .from("list_items")
      .select(`
        id,
        tmdb_id,
        media_type,
        title,
        poster_path,
        overview,
        release_date,
        rating,
        lists!inner(
          user_id,
          type,
          users!inner(
            id,
            display_name,
            username
          )
        )
      `)
      .eq("lists.type", "wishlist")
      .neq("lists.user_id", user.id)

    if (error) {
      console.error("Error fetching shared wishlist items:", error)
      return NextResponse.json({ error: "Failed to fetch shared items" }, { status: 500 })
    }

    // Get user's own wishlist items
    const { data: userWishlistItems, error: userError2 } = await supabase
      .from("list_items")
      .select("tmdb_id, media_type")
      .eq("lists.type", "wishlist")
      .eq("lists.user_id", user.id)

    if (userError2) {
      console.error("Error fetching user wishlist:", userError2)
      return NextResponse.json({ error: "Failed to fetch user wishlist" }, { status: 500 })
    }

    // Create a set of user's wishlist items for quick lookup
    const userWishlistSet = new Set(userWishlistItems?.map((item) => `${item.tmdb_id}-${item.media_type}`) || [])

    // Filter to only items that are also in user's wishlist and group by item
    const itemsMap = new Map()

    sharedItems?.forEach((item) => {
      const itemKey = `${item.tmdb_id}-${item.media_type}`

      // Only include if user also has this item in their wishlist
      if (userWishlistSet.has(itemKey)) {
        if (!itemsMap.has(itemKey)) {
          itemsMap.set(itemKey, {
            id: item.id,
            tmdb_id: item.tmdb_id,
            media_type: item.media_type,
            title: item.title,
            poster_path: item.poster_path,
            overview: item.overview,
            release_date: item.release_date,
            rating: item.rating,
            shared_with: [],
          })
        }

        // Add friend to shared_with array
        const friend = {
          id: item.lists.users.id,
          display_name: item.lists.users.display_name,
          username: item.lists.users.username,
        }

        const existingItem = itemsMap.get(itemKey)
        if (!existingItem.shared_with.find((f) => f.id === friend.id)) {
          existingItem.shared_with.push(friend)
        }
      }
    })

    const items = Array.from(itemsMap.values())

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Shared wishlist API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
