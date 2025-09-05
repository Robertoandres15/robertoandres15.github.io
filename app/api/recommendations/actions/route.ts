import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()
    const { action, tmdb_id, media_type, title, poster_path, release_date, recommended_by } = requestData

    const supabase = await createClient()

    const { data } = await supabase.auth.getUser()
    const user = data?.user

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    switch (action) {
      case "add_to_wishlist":
        // Get or create user's wishlist
        let { data: wishlist, error: wishlistQueryError } = await supabase
          .from("lists")
          .select("id")
          .eq("user_id", user.id)
          .eq("name", "Wishlist")
          .single()

        if (wishlistQueryError && wishlistQueryError.code !== "PGRST116") {
          return NextResponse.json({ error: "Failed to find wishlist" }, { status: 500 })
        }

        if (!wishlist) {
          const { data: newWishlist, error: createError } = await supabase
            .from("lists")
            .insert({
              user_id: user.id,
              name: "Wishlist",
              description: "Movies and series I want to watch",
              type: "personal",
            })
            .select("id")
            .single()

          if (createError) {
            return NextResponse.json({ error: "Failed to create wishlist" }, { status: 500 })
          }

          wishlist = newWishlist
        }

        // Add item to wishlist with recommendation info
        const { error: wishlistError } = await supabase.from("list_items").insert({
          list_id: wishlist.id,
          tmdb_id,
          media_type,
          title,
          poster_path,
          release_date,
          metadata: { recommended_by },
        })

        if (wishlistError) {
          return NextResponse.json({ error: "Failed to add to wishlist" }, { status: 500 })
        }

        return NextResponse.json({ success: true })

      case "mark_seen":
        const { error: seenError } = await supabase.from("user_seen").insert({
          user_id: user.id,
          tmdb_id,
          media_type,
        })

        if (seenError) {
          return NextResponse.json({ error: "Failed to mark as seen" }, { status: 500 })
        }

        return NextResponse.json({ success: true })

      case "not_interested":
        const { error: notInterestedError } = await supabase.from("user_not_interested").insert({
          user_id: user.id,
          tmdb_id,
          media_type,
        })

        if (notInterestedError) {
          return NextResponse.json({ error: "Failed to mark as not interested" }, { status: 500 })
        }

        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Recommendations actions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
