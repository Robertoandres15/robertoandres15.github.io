import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      console.error("[v0] Supabase client is null - environment variables not available")
      return NextResponse.json({ error: "Database service unavailable" }, { status: 503 })
    }

    const { data } = await supabase.auth.getUser()
    const user = data?.user

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id") || user.id
    const type = searchParams.get("type") // 'wishlist' or 'recommendations'

    let query = supabase
      .from("lists")
      .select(
        `
        id,
        name,
        description,
        type,
        is_public,
        created_at,
        updated_at,
        user:users(id, username, display_name, avatar_url),
        list_items(
          id,
          tmdb_id,
          media_type,
          title,
          poster_path,
          overview,
          release_date,
          rating,
          note,
          added_at
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (type) {
      query = query.eq("type", type)
    }

    const { data: lists, error } = await query

    if (error) {
      return NextResponse.json({ error: "Failed to fetch lists" }, { status: 500 })
    }

    return NextResponse.json({ lists })
  } catch (error) {
    console.error("Lists API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      console.error("[v0] Supabase client is null - environment variables not available")
      return NextResponse.json({ error: "Database service unavailable" }, { status: 503 })
    }

    const { data } = await supabase.auth.getUser()
    const user = data?.user

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, type, is_public } = await request.json()

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    if (!["wishlist", "recommendations"].includes(type)) {
      return NextResponse.json({ error: "Invalid list type" }, { status: 400 })
    }

    const { data: list, error } = await supabase
      .from("lists")
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        type,
        is_public: is_public ?? true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to create list" }, { status: 500 })
    }

    return NextResponse.json({ list })
  } catch (error) {
    console.error("Create list API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
