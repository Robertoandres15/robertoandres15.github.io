import { type NextRequest, NextResponse } from "next/server"
import { TMDBClient } from "@/lib/tmdb"

export async function GET(request: NextRequest) {
  console.log("[v0] Watch providers API called")

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const type = searchParams.get("type") // 'movie' or 'tv'

    if (!id || !type) {
      return NextResponse.json({ error: "Missing required parameters: id and type" }, { status: 400 })
    }

    console.log(`[v0] Fetching watch providers for ${type} ID: ${id}`)

    const client = new TMDBClient()
    let watchProviders

    if (type === "movie") {
      watchProviders = await client.getMovieWatchProviders(Number.parseInt(id))
    } else if (type === "tv") {
      watchProviders = await client.getTVWatchProviders(Number.parseInt(id))
    } else {
      return NextResponse.json({ error: "Invalid type. Must be 'movie' or 'tv'" }, { status: 400 })
    }

    console.log("[v0] Watch providers fetched successfully")
    return NextResponse.json(watchProviders)
  } catch (error) {
    console.error("[v0] Watch providers API error:", error)
    return NextResponse.json({ error: "Failed to fetch watch providers" }, { status: 500 })
  }
}
