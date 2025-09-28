import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { notifyRecommendationAddedToWishlist } from "@/lib/notifications"

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()
    const { action, tmdb_id, media_type, title, poster_path, release_date, recommended_by, recommender_id } =
      requestData

    const supabase = await createClient()

    const { data } = await supabase.auth.getUser()
    const user = data?.user

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    switch (action) {
      case "add_to_wishlist":
        let { data: wishlist, error: wishlistQueryError } = await supabase
          .from("lists")
          .select("id")
          .eq("user_id", user.id)
          .eq("type", "wishlist")
          .single()

        if (wishlistQueryError && wishlistQueryError.code !== "PGRST116") {
          return NextResponse.json({ error: "Failed to find wishlist" }, { status: 500 })
        }

        if (!wishlist) {
          const { data: newWishlist, error: createError } = await supabase
            .from("lists")
            .insert({
              user_id: user.id,
              name: "My Wishlist",
              description: "Movies and series I want to watch",
              type: "wishlist",
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
          release_date: release_date ? new Date(release_date) : null,
          note: recommended_by ? `Recommended by ${recommended_by}` : null,
        })

        if (wishlistError) {
          return NextResponse.json({ error: "Failed to add to wishlist" }, { status: 500 })
        }

        if (recommender_id && recommender_id !== user.id) {
          try {
            const { data: userProfile } = await supabase
              .from("profiles")
              .select("display_name")
              .eq("id", user.id)
              .single()

            await notifyRecommendationAddedToWishlist(
              recommender_id,
              user.id,
              title,
              userProfile?.display_name || "Someone",
            )
          } catch (notificationError) {
            console.error("Failed to send recommendation notification:", notificationError)
            // Don't fail the request if notification fails
          }
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
