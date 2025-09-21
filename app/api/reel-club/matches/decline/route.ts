import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(request: NextRequest) {
  try {
    const { tmdb_id, media_type, title, poster_path, friend_ids } = await request.json()

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // No-op for server-side
        },
      },
    })

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create a declined watch party to prevent this match from showing again
    const { data: watchParty, error: partyError } = await supabase
      .from("watch_parties")
      .insert({
        tmdb_id,
        media_type,
        title,
        poster_path,
        status: "declined",
        created_by: user.id,
      })
      .select()
      .single()

    if (partyError) {
      console.error("Error creating declined watch party:", partyError)
      return NextResponse.json({ error: "Failed to decline match" }, { status: 500 })
    }

    // Add the current user as a declined participant
    const { error: participantError } = await supabase.from("watch_party_participants").insert({
      watch_party_id: watchParty.id,
      user_id: user.id,
      status: "declined",
    })

    if (participantError) {
      console.error("Error adding declined participant:", participantError)
      return NextResponse.json({ error: "Failed to decline match" }, { status: 500 })
    }

    return NextResponse.json({ message: "Match declined successfully" })
  } catch (error) {
    console.error("Error in decline match API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
