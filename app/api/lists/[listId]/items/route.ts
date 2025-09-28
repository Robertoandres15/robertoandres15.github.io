import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { notifyMutualMatch } from "@/lib/notifications"

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
      .select("id, user_id, type")
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

    if (list.type === "wishlist") {
      try {
        // Get user's friends
        const { data: friendships } = await supabase
          .from("friends")
          .select("user_id, friend_id")
          .or(`and(user_id.eq.${user.id},status.eq.accepted),and(friend_id.eq.${user.id},status.eq.accepted)`)

        if (friendships && friendships.length > 0) {
          // Get friend IDs
          const friendIds = friendships.map((f) => (f.user_id === user.id ? f.friend_id : f.user_id))

          // Check if any friends have this same item in their wishlist
          const { data: friendWishlists } = await supabase
            .from("lists")
            .select("id, user_id")
            .eq("type", "wishlist")
            .in("user_id", friendIds)

          if (friendWishlists && friendWishlists.length > 0) {
            const friendWishlistIds = friendWishlists.map((w) => w.id)

            // Check for matching items
            const { data: matchingItems } = await supabase
              .from("list_items")
              .select(`
                id,
                list_id,
                lists!inner(user_id, users!inner(id, display_name))
              `)
              .in("list_id", friendWishlistIds)
              .eq("tmdb_id", tmdb_id)
              .eq("media_type", media_type)

            if (matchingItems && matchingItems.length > 0) {
              // Get current user's profile
              const { data: userProfile } = await supabase
                .from("profiles")
                .select("display_name")
                .eq("id", user.id)
                .single()

              const userName = userProfile?.display_name || "Someone"

              // Notify each friend with a matching item
              for (const matchingItem of matchingItems) {
                const friendId = matchingItem.lists.user_id
                const friendName = matchingItem.lists.users.display_name || "Someone"

                await notifyMutualMatch(user.id, friendId, title, userName, friendName)
              }
            }
          }
        }
      } catch (matchError) {
        console.error("Failed to check for mutual matches:", matchError)
        // Don't fail the request if mutual match check fails
      }
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
