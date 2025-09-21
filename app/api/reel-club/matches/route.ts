import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

async function fetchTMDBData(tmdbId: number, mediaType: string) {
  try {
    const baseUrl = "https://api.themoviedb.org/3"
    const endpoint = mediaType === "movie" ? "movie" : "tv"

    let response

    if (process.env.TMDB_API_KEY) {
      console.log(`[v0] Trying TMDB API with API key for ${mediaType} ${tmdbId}`)
      response = await fetch(`${baseUrl}/${endpoint}/${tmdbId}?api_key=${process.env.TMDB_API_KEY}`)
    }

    // If API key fails, try with Bearer token
    if (!response || !response.ok) {
      if (process.env.TMDB_API_READ_ACCESS_TOKEN) {
        console.log(`[v0] Trying TMDB API with Bearer token for ${mediaType} ${tmdbId}`)
        response = await fetch(`${baseUrl}/${endpoint}/${tmdbId}`, {
          headers: {
            Authorization: `Bearer ${process.env.TMDB_API_READ_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        })
      }
    }

    if (!response || !response.ok) {
      console.log(`[v0] TMDB API error for ${mediaType} ${tmdbId}:`, response?.status || "No response")
      console.log(`[v0] TMDB API - Bearer token available:`, !!process.env.TMDB_API_READ_ACCESS_TOKEN)
      console.log(`[v0] TMDB API - API key available:`, !!process.env.TMDB_API_KEY)
      console.log(
        `[v0] TMDB API - Bearer token value:`,
        process.env.TMDB_API_READ_ACCESS_TOKEN?.substring(0, 10) + "...",
      )
      console.log(`[v0] TMDB API - API key value:`, process.env.TMDB_API_KEY?.substring(0, 10) + "...")
      return null
    }

    const data = await response.json()
    console.log(`[v0] TMDB API success for ${mediaType} ${tmdbId}:`, data.title || data.name)
    return {
      title: data.title || data.name,
      poster_path: data.poster_path,
      overview: data.overview,
      release_date: data.release_date || data.first_air_date,
    }
  } catch (error) {
    console.error(`[v0] Error fetching TMDB data for ${mediaType} ${tmdbId}:`, error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Matches API called")
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      console.log("[v0] Matches API - No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Matches API - User ID:", user.id)

    const { data: acceptedFriendships } = await supabase
      .from("friends")
      .select("friend_id")
      .eq("user_id", user.id)
      .eq("status", "accepted")

    const { data: pendingSentRequests } = await supabase
      .from("friends")
      .select("friend_id")
      .eq("user_id", user.id)
      .eq("status", "pending")

    const { data: pendingReceivedRequests } = await supabase
      .from("friends")
      .select("user_id")
      .eq("friend_id", user.id)
      .eq("status", "pending")

    const { data: acceptedFriendshipsReverse } = await supabase
      .from("friends")
      .select("user_id")
      .eq("friend_id", user.id)
      .eq("status", "accepted")

    const allPotentialFriends = [
      ...(acceptedFriendships || []).map((f) => f.friend_id),
      ...(acceptedFriendshipsReverse || []).map((f) => f.user_id),
      ...(pendingSentRequests || []).map((f) => f.friend_id),
      ...(pendingReceivedRequests || []).map((f) => f.user_id),
    ]

    let uniqueFriendIds = [...new Set(allPotentialFriends)].filter((id) => id !== user.id)

    console.log("[v0] Matches API - Accepted friendships found:", acceptedFriendships?.length || 0)
    console.log("[v0] Matches API - Accepted friendships reverse found:", acceptedFriendshipsReverse?.length || 0)
    console.log("[v0] Matches API - Pending sent requests found:", pendingSentRequests?.length || 0)
    console.log("[v0] Matches API - Pending received requests found:", pendingReceivedRequests?.length || 0)
    console.log("[v0] Matches API - Total unique potential friends:", uniqueFriendIds.length)

    console.log("[v0] Matches API - Looking for users with shared interests...")

    // Get user's wishlist items first
    const userWishlistLists = await supabase
      .from("lists")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", "wishlist")
      .then((response) => response.data)

    let userWishlist = [] // Declare userWishlist variable

    if (userWishlistLists && userWishlistLists.length > 0) {
      userWishlist = await supabase // Assign userWishlist variable
        .from("list_items")
        .select("tmdb_id, media_type")
        .in(
          "list_id",
          userWishlistLists.map((l) => l.id),
        )
        .then((response) => response.data)

      if (userWishlist && userWishlist.length > 0) {
        // Find other users who have the same items in their wishlists
        const otherUsersWithSameItems = await supabase
          .from("list_items")
          .select(`
            list_id,
            lists!inner(user_id, type)
          `)
          .in(
            "tmdb_id",
            userWishlist.map((item) => item.tmdb_id),
          )
          .eq("lists.type", "wishlist")
          .neq("lists.user_id", user.id)
          .then((response) => response.data)

        if (otherUsersWithSameItems && otherUsersWithSameItems.length > 0) {
          const potentialFriendIds = [...new Set(otherUsersWithSameItems.map((item) => item.lists.user_id))]

          const newPotentialFriends = potentialFriendIds.filter((id) => !uniqueFriendIds.includes(id))
          uniqueFriendIds = [...uniqueFriendIds, ...newPotentialFriends.slice(0, 20)] // Limit total to reasonable number

          console.log("[v0] Matches API - Found users with shared interests:", potentialFriendIds.length)
          console.log("[v0] Matches API - Added new potential friends:", newPotentialFriends.length)
        }
      }
    }

    if (uniqueFriendIds.length === 0) {
      console.log("[v0] Matches API - No potential friends found")
      return NextResponse.json({ matches: [] })
    }

    console.log("[v0] Matches API - Final friend IDs to check:", uniqueFriendIds)

    const friendsDebugInfo = await supabase
      .from("users")
      .select("id, username, display_name")
      .in("id", uniqueFriendIds)
      .then((response) => response.data)

    console.log("[v0] Matches API - Friend details:", JSON.stringify(friendsDebugInfo))

    console.log("[v0] Matches API - User wishlist lists:", userWishlistLists?.length || 0)

    if (!userWishlistLists || userWishlistLists.length === 0) {
      console.log("[v0] Matches API - No user wishlist found")
      return NextResponse.json({ matches: [] })
    }

    console.log("[v0] Matches API - User wishlist items:", userWishlist?.length || 0)
    console.log(
      "[v0] Matches API - User wishlist item details:",
      JSON.stringify(
        userWishlist?.map((item) => ({ title: item.title, tmdb_id: item.tmdb_id, media_type: item.media_type })),
      ),
    )

    const friendsWishlistLists = await supabase
      .from("lists")
      .select("id, user_id")
      .in("user_id", uniqueFriendIds)
      .eq("type", "wishlist")
      .then((response) => response.data)

    console.log("[v0] Matches API - Friends wishlist lists:", friendsWishlistLists?.length || 0)

    if (!friendsWishlistLists || friendsWishlistLists.length === 0) {
      console.log("[v0] Matches API - No friends wishlists found")
      return NextResponse.json({ matches: [] })
    }

    console.log(
      "[v0] Matches API - Friends wishlist list IDs:",
      friendsWishlistLists.map((l) => l.id),
    )
    console.log("[v0] Matches API - Friends wishlist list details:", JSON.stringify(friendsWishlistLists))

    for (const friendList of friendsWishlistLists) {
      const friendInfo = friendsDebugInfo?.find((f) => f.id === friendList.user_id)
      const friendItems = await supabase
        .from("list_items")
        .select("tmdb_id, media_type, title")
        .eq("list_id", friendList.id)
        .then((response) => response.data)

      console.log(
        `[v0] Matches API - ${friendInfo?.display_name || friendInfo?.username || "Unknown"} (${friendList.user_id}) has ${friendItems?.length || 0} wishlist items:`,
        JSON.stringify(
          friendItems?.map((item) => ({ title: item.title, tmdb_id: item.tmdb_id, media_type: item.media_type })),
        ),
      )
    }

    const debugListItems = await supabase
      .from("list_items")
      .select("*")
      .in(
        "list_id",
        friendsWishlistLists.map((l) => l.id),
      )
      .then((response) => response.data)

    console.log("[v0] Matches API - Debug: Raw list_items query result:", debugListItems?.length || 0)
    console.log("[v0] Matches API - Debug: Raw list_items data:", JSON.stringify(debugListItems))

    // Get friends' wishlist items
    const friendsWishlist = await supabase
      .from("list_items")
      .select("tmdb_id, media_type, title, poster_path, overview, release_date, list_id")
      .in(
        "list_id",
        friendsWishlistLists.map((l) => l.id),
      )
      .then((response) => response.data)

    console.log("[v0] Matches API - Friends wishlist items:", friendsWishlist?.length || 0)

    // Get user info for matched friends
    const friendsInfo = await supabase
      .from("users")
      .select("id, username, display_name, avatar_url")
      .in("id", uniqueFriendIds)
      .then((response) => response.data)

    // Find shared items (matches)
    const matches = []
    if (userWishlist && friendsWishlist && friendsWishlistLists) {
      console.log("[v0] Matches API - Starting match detection...")
      for (const userItem of userWishlist) {
        console.log("[v0] Matches API - Checking user item:", userItem.title, userItem.tmdb_id)

        // Find matching items from friends
        const matchingFriendItems = friendsWishlist.filter(
          (friendItem) => friendItem.tmdb_id === userItem.tmdb_id && friendItem.media_type === userItem.media_type,
        )

        if (matchingFriendItems.length > 0) {
          console.log(
            "[v0] Matches API - Found match for:",
            userItem.title,
            "with",
            matchingFriendItems.length,
            "friends",
          )

          const matchedFriends = matchingFriendItems.map((friendItem) => {
            const friendList = friendsWishlistLists.find((list) => list.id === friendItem.list_id)
            const friendInfo = friendsInfo?.find((friend) => friend.id === friendList?.user_id)
            return {
              id: friendList?.user_id || "",
              username: friendInfo?.username || "Unknown",
              display_name: friendInfo?.display_name || "Unknown",
              avatar_url: friendInfo?.avatar_url || null,
            }
          })

          // Check if there's already an active watch party for this item
          const existingParty = await supabase
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
            .then((response) => response.data)

          let movieData = {
            title: userItem.title,
            poster_path: userItem.poster_path,
            overview: userItem.overview,
            release_date: userItem.release_date,
          }

          // If any essential data is missing, fetch from TMDB
          if (!movieData.title || !movieData.poster_path) {
            console.log(`[v0] Fetching TMDB data for ${userItem.media_type} ${userItem.tmdb_id}`)
            const tmdbData = await fetchTMDBData(userItem.tmdb_id, userItem.media_type)
            if (tmdbData) {
              movieData = {
                title: tmdbData.title || movieData.title,
                poster_path: tmdbData.poster_path || movieData.poster_path,
                overview: tmdbData.overview || movieData.overview,
                release_date: tmdbData.release_date || movieData.release_date,
              }
            }
          }

          matches.push({
            tmdb_id: userItem.tmdb_id,
            media_type: userItem.media_type,
            title: movieData.title,
            poster_path: movieData.poster_path,
            overview: movieData.overview,
            release_date: movieData.release_date,
            matched_friends: matchedFriends,
            watch_party: existingParty || null,
          })
        }
      }
    }

    console.log("[v0] Matches API - Total matches found:", matches.length)
    return NextResponse.json({ matches })
  } catch (error) {
    console.error("[v0] Matches API error:", error)
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

    const userWishlistLists = await supabase
      .from("lists")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", "wishlist")
      .then((response) => response.data)

    if (!userWishlistLists || userWishlistLists.length === 0) {
      return NextResponse.json({ error: "No wishlist found" }, { status: 400 })
    }

    const listItem = await supabase
      .from("list_items")
      .select("id")
      .in(
        "list_id",
        userWishlistLists.map((l) => l.id),
      )
      .eq("tmdb_id", tmdb_id)
      .eq("media_type", media_type)
      .single()
      .then((response) => response.data)

    if (!listItem) {
      return NextResponse.json({ error: "Item not found in wishlist" }, { status: 400 })
    }

    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const watchParty = await serviceSupabase
      .from("watch_parties")
      .insert({
        creator_id: user.id,
        tmdb_id,
        media_type,
        title,
        poster_path,
        item_id: listItem.id, // Added the required item_id field
        status: "pending",
      })
      .select()
      .single()
      .then((response) => response.data)

    if (!watchParty) {
      console.error("Error creating watch party")
      return NextResponse.json({ error: "Failed to create watch party" }, { status: 500 })
    }

    // Add creator as participant (auto-accepted) using service role client
    await serviceSupabase.from("watch_party_participants").insert({
      watch_party_id: watchParty.id,
      user_id: user.id,
      status: "accepted",
    })

    // Add friends as participants (pending) using service role client
    const friendParticipants = friend_ids.map((friendId: string) => ({
      watch_party_id: watchParty.id,
      user_id: friendId,
      status: "pending",
    }))

    await serviceSupabase.from("watch_party_participants").insert(friendParticipants)

    return NextResponse.json({ watch_party: watchParty })
  } catch (error) {
    console.error("Create match API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
