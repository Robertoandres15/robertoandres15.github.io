import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { activity_type, content_id, content_type, list_id, target_user_id, metadata } = body

    const { data: activity, error } = await supabase
      .from("feed_activities")
      .insert({
        user_id: user.id,
        activity_type,
        content_id,
        content_type,
        list_id,
        target_user_id,
        metadata,
      })
      .select()
      .single()

    if (error) {
      console.error("Activity creation error:", error)
      return NextResponse.json({ error: "Failed to create activity" }, { status: 500 })
    }

    return NextResponse.json({ activity })
  } catch (error) {
    console.error("Activity API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
