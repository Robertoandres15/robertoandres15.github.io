import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    // Get user's friends
    const { data: friendships } = await supabase
      .from("friends")
      .select("friend_id")
      .eq("user_id", user.id)
      .eq("status", "accepted")

    if (!friendships || friendships.length === 0) {
      return NextResponse.json({ matches: [] })
    }

    const friendIds = friendships.map((f) => f.friend_id)

    // Get user's wishlist items
    const { data: userWishlist } = await supabase
      .from("list_items")
      .select(`
        tmdb_id,
        media_type,
        title,
        poster_path,
        overview,
        release_date,
        lists!inner(type, user_id)
      `)
      .eq("lists.user_id", user.id)
      .eq("lists.type", "wishlist")

    // Get friends' wishlist items
    const { data: friendsWishlist } = await supabase
      .from("list_items")
      .select(`
        tmdb_id,
        media_type,
        title,
        poster_path,
        overview,
        release_date,
        lists!inner(type, user_id),
        users:lists(id, username, display_name, avatar_url)
      `)
      .in("lists.user_id", friendIds)
      .eq("lists.type", "wishlist")

    // Find shared items (matches)
    const matches = []
    if (userWishlist && friendsWishlist) {
      for (const userItem of userWishlist) {
        const matchingFriends = friendsWishlist.filter(
          (friendItem) => friendItem.tmdb_id === userItem.tmdb_id && friendItem.media_type === userItem.media_type,
        )

        if (matchingFriends.length > 0) {
          // Check if there's already an active watch party for this item
          const { data: existingParty } = await supabase
            .from("watch_parties")
            .select(`
              id,
              status,
              watch_party_participants(user_id, status)
            `)
            .eq("tmdb_id", userItem.tmdb_id)
            .eq("media_type", userItem.media_type)
            .eq("creator_id", user.id)
            .in("status", ["pending", "accepted", "active"])
            .single()

          matches.push({
            tmdb_id: userItem.tmdb_id,
            media_type: userItem.media_type,
            title: userItem.title,
            poster_path: userItem.poster_path,
            overview: userItem.overview,
            release_date: userItem.release_date,
            matched_friends: matchingFriends.map((f) => ({
              id: f.users.id,
              username: f.users.username,
              display_name: f.users.display_name,
              avatar_url: f.users.avatar_url,
            })),
            watch_party: existingParty || null,
          })
        }
      }
    }

    return NextResponse.json({ matches })
  } catch (error) {
    console.error("Matches API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { tmdb_id, media_type, title, poster_path, friend_ids } = await request.json()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create watch party
    const { data: watchParty, error: partyError } = await supabase
      .from("watch_parties")
      .insert({
        creator_id: user.id,
        tmdb_id,
        media_type,
        title,
        poster_path,
        status: "pending",
      })
      .select()
      .single()

    if (partyError) {
      console.error("Error creating watch party:", partyError)
      return NextResponse.json({ error: "Failed to create watch party" }, { status: 500 })
    }

    // Add creator as participant (auto-accepted)
    await supabase.from("watch_party_participants").insert({
      watch_party_id: watchParty.id,
      user_id: user.id,
      status: "accepted",
    })

    // Add friends as participants (pending)
    const friendParticipants = friend_ids.map((friendId: string) => ({
      watch_party_id: watchParty.id,
      user_id: friendId,
      status: "pending",
    }))

    await supabase.from("watch_party_participants").insert(friendParticipants)

    return NextResponse.json({ watch_party: watchParty })
  } catch (error) {
    console.error("Create match API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
