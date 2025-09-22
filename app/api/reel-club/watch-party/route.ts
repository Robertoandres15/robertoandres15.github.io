import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { item_id, scheduled_date, participants, media_type, tmdb_id, title, poster_path } = body

    const { data: watchParty, error: partyError } = await supabase
      .from("watch_parties")
      .insert({
        item_id,
        tmdb_id,
        media_type,
        title,
        poster_path,
        creator_id: user.id,
        scheduled_date: scheduled_date || null,
        status: media_type === "movie" ? "proposed" : "watching",
      })
      .select()
      .single()

    if (partyError) {
      console.error("Error creating watch party:", partyError)
      return NextResponse.json({ error: "Failed to create watch party" }, { status: 500 })
    }

    if (participants && participants.length > 0) {
      const participantInserts = participants.map((participantId) => ({
        watch_party_id: watchParty.id,
        user_id: participantId,
        status: "invited",
      }))

      const { error: participantsError } = await supabase.from("watch_party_participants").insert(participantInserts)

      if (participantsError) {
        console.error("Error adding participants:", participantsError)
        return NextResponse.json({ error: "Failed to add participants" }, { status: 500 })
      }
    }

    const { error: feedError } = await supabase.from("feed_activities").insert({
      user_id: user.id,
      activity_type: media_type === "movie" ? "watch_party_proposed" : "series_started",
      content: {
        watch_party_id: watchParty.id,
        title,
        media_type,
        participants: participants.length,
      },
    })

    if (feedError) {
      console.error("Error creating feed activity:", feedError)
      // Don't fail the request for feed errors
    }

    return NextResponse.json({
      success: true,
      watch_party: watchParty,
      message: media_type === "movie" ? "Watch party invitation sent!" : "Series watch party started!",
    })
  } catch (error) {
    console.error("Watch party API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
