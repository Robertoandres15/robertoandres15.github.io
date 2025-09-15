import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const watchPartyId = searchParams.get("watch_party_id")

    if (!watchPartyId) {
      return NextResponse.json({ error: "Watch party ID required" }, { status: 400 })
    }

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get progress for all participants
    const { data: progress } = await supabase
      .from("episode_progress")
      .select(`
        user_id,
        season_number,
        episode_number,
        completed_at,
        users(display_name, username, avatar_url)
      `)
      .eq("watch_party_id", watchPartyId)
      .order("season_number", { ascending: false })
      .order("episode_number", { ascending: false })

    // Group by user and get latest progress
    const userProgress = new Map()
    progress?.forEach((p) => {
      if (!userProgress.has(p.user_id)) {
        userProgress.set(p.user_id, {
          user_id: p.user_id,
          display_name: p.users.display_name,
          username: p.users.username,
          avatar_url: p.users.avatar_url,
          current_season: p.season_number,
          current_episode: p.episode_number,
          last_updated: p.completed_at,
        })
      }
    })

    return NextResponse.json({
      progress: Array.from(userProgress.values()),
    })
  } catch (error) {
    console.error("Get progress API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { watch_party_id, season_number, episode_number } = await request.json()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update or insert progress
    const { error: progressError } = await supabase.from("episode_progress").upsert(
      {
        watch_party_id,
        user_id: user.id,
        season_number,
        episode_number,
        completed_at: new Date().toISOString(),
      },
      {
        onConflict: "watch_party_id,user_id,season_number,episode_number",
      },
    )

    if (progressError) {
      console.error("Error updating progress:", progressError)
      return NextResponse.json({ error: "Failed to update progress" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Progress updated successfully",
    })
  } catch (error) {
    console.error("Update progress API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
