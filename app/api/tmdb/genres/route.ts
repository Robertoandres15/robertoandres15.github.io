import { type NextRequest, NextResponse } from "next/server"
import { TMDBClient } from "@/lib/tmdb"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Genres API route called")
    const hasToken = !!(process.env.TMDB_API_READ_ACCESS_TOKEN || process.env.TMBD_API_KEY)
    const tokenLength = (process.env.TMDB_API_READ_ACCESS_TOKEN || process.env.TMBD_API_KEY || "").length
    console.log("[v0] Environment check - TMDB API token exists:", hasToken)
    console.log("[v0] Environment check - TMDB API token length:", tokenLength)

    const tmdb = new TMDBClient()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "movie"

    console.log("[v0] Fetching genres for type:", type)
    const results = type === "tv" ? await tmdb.getTVGenres() : await tmdb.getMovieGenres()
    console.log("[v0] Successfully fetched genres:", results.genres?.length, "genres")
    return NextResponse.json(results)
  } catch (error) {
    console.error("[v0] TMDB genres error:", error)
    console.error("[v0] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })

    if (error instanceof Error && error.message.includes("TMDB API")) {
      return NextResponse.json(
        {
          error: "TMDB API authentication error",
          details: error.message,
          suggestion:
            "Please check that TMDB_API_READ_ACCESS_TOKEN or TMBD_API_KEY environment variable is set correctly",
        },
        { status: 500 },
      )
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to fetch genres"
    return NextResponse.json(
      {
        error: errorMessage,
        details: "Check server logs for more information",
      },
      { status: 500 },
    )
  }
}
