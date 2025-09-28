import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error marking notification as read:", error)
      return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
    }

    return NextResponse.json({ notification: data })
  } catch (error) {
    console.error("Error in mark notification read API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
