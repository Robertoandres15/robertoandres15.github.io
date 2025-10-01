import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { action } = await request.json() // "accept" or "decline"

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update participant status
    const { error: updateError } = await supabase
      .from("watch_party_participants")
      .update({ status: action === "accept" ? "accepted" : "declined" })
      .eq("watch_party_id", params.id)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("Error updating participant status:", updateError)
      return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
    }

    // Check if all participants have accepted
    const { data: participants } = await supabase
      .from("watch_party_participants")
      .select("status")
      .eq("watch_party_id", params.id)

    const allAccepted = participants?.every((p) => p.status === "accepted")
    const anyDeclined = participants?.some((p) => p.status === "declined")

    // Update watch party status
    let newStatus = "pending"
    if (anyDeclined) {
      newStatus = "declined"
    } else if (allAccepted) {
      newStatus = "accepted"
    }

    await supabase.from("watch_parties").update({ status: newStatus }).eq("id", params.id)

    return NextResponse.json({
      status: newStatus,
      message: action === "accept" ? "Match accepted!" : "Match declined",
    })
  } catch (error) {
    console.error("Respond to match API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
