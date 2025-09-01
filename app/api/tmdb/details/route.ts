import { type NextRequest, NextResponse } from "next/server"
import { TMDBClient } from "@/lib/tmdb"

export async function GET(request: NextRequest) {
  console.log("[v0] Details API route called")

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const type = searchParams.get("type") // "movie" or "tv"

    if (!id || !type) {
      return NextResponse.json({ error: "Missing required parameters: id and type" }, { status: 400 })
    }

    if (!["movie", "tv"].includes(type)) {
      return NextResponse.json({ error: "Invalid type. Must be 'movie' or 'tv'" }, { status: 400 })
    }

    console.log("[v0] Fetching details for:", { id, type })

    const tmdb = new TMDBClient()
    const details =
      type === "movie" ? await tmdb.getMovieDetails(Number.parseInt(id)) : await tmdb.getTVDetails(Number.parseInt(id))

    console.log("[v0] Successfully fetched details")
    return NextResponse.json(details)
  } catch (error) {
    console.error("[v0] Details API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch details" },
      { status: 500 },
    )
  }
}
