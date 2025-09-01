import { type NextRequest, NextResponse } from "next/server"
import { TMDBClient } from "@/lib/tmdb"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Discover API route called")
    console.log("[v0] Environment check - TMDB_API_KEY exists:", !!process.env.TMDB_API_KEY)
    console.log("[v0] Environment check - TMDB_API_KEY length:", process.env.TMDB_API_KEY?.length || 0)

    const tmdb = new TMDBClient()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "movie"
    const page = searchParams.get("page") || "1"
    const genre = searchParams.get("genre") || ""
    const yearParam = searchParams.get("year") || ""
    const sortBy = searchParams.get("sort_by") || "popularity.desc"
    const minRating = searchParams.get("min_rating") || ""
    const inTheaters = searchParams.get("in_theaters") === "true"
    const streamingServices = searchParams.get("streaming_services") || ""

    let year = ""
    if (yearParam && yearParam !== "0") {
      const yearNum = Number.parseInt(yearParam, 10)
      const currentYear = new Date().getFullYear()
      // Validate year is reasonable (between 1900 and current year + 5)
      if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= currentYear + 5) {
        year = yearParam
      } else {
        console.warn("[v0] Invalid year parameter:", yearParam, "- ignoring")
      }
    }

    const params: any = {
      page: Number.parseInt(page),
    }

    if (genre && genre !== "0") {
      params.genre = genre
    }

    if (year) {
      params.year = year
    }

    if (sortBy) {
      params.sort_by = sortBy
    }

    if (minRating && minRating !== "0") {
      params.vote_average_gte = minRating
    }

    if (inTheaters && type === "movie") {
      const today = new Date()
      const fourWeeksAgo = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000)
      const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)

      params.release_date_gte = fourWeeksAgo.toISOString().split("T")[0]
      params.release_date_lte = twoWeeksFromNow.toISOString().split("T")[0]
      params.with_release_type = "3" // Theatrical release
    }

    if (streamingServices) {
      params.with_watch_providers = streamingServices
      params.watch_region = "US" // Default to US region
    }

    console.log("[v0] Discovering content:", { type, params, inTheaters, streamingServices, processedYear: year })
    const results = type === "tv" ? await tmdb.discoverTV(params) : await tmdb.discoverMovies(params)
    console.log("[v0] Successfully fetched discover results:", results.results?.length, "items")

    return NextResponse.json(results)
  } catch (error) {
    console.error("[v0] TMDB discover error:", error)
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

    const errorMessage = error instanceof Error ? error.message : "Failed to discover content"
    return NextResponse.json(
      {
        error: errorMessage,
        details: "Check server logs for more information",
      },
      { status: 500 },
    )
  }
}
