import { type NextRequest, NextResponse } from "next/server"
import { TMDBClient } from "@/lib/tmdb"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Search API route called")
    console.log("[v0] Environment check - TMDB_API_KEY exists:", !!process.env.TMDB_API_KEY)
    console.log("[v0] Environment check - TMDB_API_KEY length:", process.env.TMDB_API_KEY?.length || 0)

    const tmdb = new TMDBClient() // Create instance instead of importing singleton

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const page = searchParams.get("page") || "1"

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    console.log("[v0] Searching for:", query, "page:", page)
    const results = await tmdb.searchMulti(query, Number.parseInt(page))
    console.log("[v0] Successfully fetched search results:", results.results?.length, "items")
    return NextResponse.json(results)
  } catch (error) {
    console.error("[v0] TMDB search error:", error)
    console.error("[v0] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })

    if (error instanceof Error && error.message.includes("TMDB_API_KEY")) {
      return NextResponse.json(
        {
          error: "TMDB API key configuration error",
          details: error.message,
          suggestion: "Please check that TMDB_API_KEY environment variable is set correctly",
        },
        { status: 500 },
      )
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to search movies"
    return NextResponse.json(
      {
        error: errorMessage,
        details: "Check server logs for more information",
      },
      { status: 500 },
    )
  }
}
