import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile with stats
    const { data: profile, error: profileError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }

    // Get user stats
    const [listsResult, friendsResult, activitiesResult] = await Promise.all([
      supabase.from("lists").select("id").eq("user_id", user.id),
      supabase.from("friends").select("id").eq("user_id", user.id).eq("status", "accepted"),
      supabase.from("feed_activities").select("id").eq("user_id", user.id),
    ])

    const stats = {
      lists: listsResult.data?.length || 0,
      friends: friendsResult.data?.length || 0,
      activities: activitiesResult.data?.length || 0,
    }

    return NextResponse.json({ profile, stats })
  } catch (error) {
    console.error("Profile API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { display_name, bio, avatar_url } = body

    const { data: profile, error } = await supabase
      .from("users")
      .update({
        display_name,
        bio,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Profile update error:", error)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Profile update API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
