import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data } = await supabase.auth.getUser()
    const user = data?.user

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get("target_type")
    const targetId = searchParams.get("target_id")
    const signalType = searchParams.get("signal_type")

    if (!targetType || !targetId) {
      return NextResponse.json({ error: "Target type and ID are required" }, { status: 400 })
    }

    let query = supabase
      .from("social_signals")
      .select(
        `
        id,
        signal_type,
        content,
        created_at,
        user:users(id, username, display_name, avatar_url)
      `,
      )
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .order("created_at", { ascending: false })

    if (signalType) {
      query = query.eq("signal_type", signalType)
    }

    const { data: signals, error } = await query

    if (error) {
      return NextResponse.json({ error: "Failed to fetch social signals" }, { status: 500 })
    }

    return NextResponse.json({ signals })
  } catch (error) {
    console.error("Social signals API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data } = await supabase.auth.getUser()
    const user = data?.user

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { target_type, target_id, signal_type, content } = await request.json()

    if (!target_type || !target_id || !signal_type) {
      return NextResponse.json({ error: "Target type, target ID, and signal type are required" }, { status: 400 })
    }

    if (!["like", "comment", "share"].includes(signal_type)) {
      return NextResponse.json({ error: "Invalid signal type" }, { status: 400 })
    }

    if (!["list", "list_item"].includes(target_type)) {
      return NextResponse.json({ error: "Invalid target type" }, { status: 400 })
    }

    // For likes, check if user already liked this target
    if (signal_type === "like") {
      const { data: existingLike } = await supabase
        .from("social_signals")
        .select("id")
        .eq("user_id", user.id)
        .eq("target_type", target_type)
        .eq("target_id", target_id)
        .eq("signal_type", "like")
        .single()

      if (existingLike) {
        // Unlike - remove the existing like
        const { error } = await supabase.from("social_signals").delete().eq("id", existingLike.id)

        if (error) {
          return NextResponse.json({ error: "Failed to unlike" }, { status: 500 })
        }

        return NextResponse.json({ action: "unliked" })
      }
    }

    const { data: signal, error } = await supabase
      .from("social_signals")
      .insert({
        user_id: user.id,
        target_type,
        target_id,
        signal_type,
        content: content || null,
      })
      .select(
        `
        id,
        signal_type,
        content,
        created_at,
        user:users(id, username, display_name, avatar_url)
      `,
      )
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to create social signal" }, { status: 500 })
    }

    return NextResponse.json({ signal, action: signal_type === "like" ? "liked" : "created" })
  } catch (error) {
    console.error("Create social signal API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
