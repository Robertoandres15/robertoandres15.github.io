import { type NextRequest, NextResponse } from "next/server"
import { TMDBClient } from "@/lib/tmdb"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Discover API route called")
    const hasToken = !!(process.env.TMDB_API_READ_ACCESS_TOKEN || process.env.TMDB_API_KEY)
    const tokenLength = (process.env.TMDB_API_READ_ACCESS_TOKEN || process.env.TMDB_API_KEY || "").length
    console.log("[v0] Environment check - TMDB token exists:", hasToken)
    console.log("[v0] Environment check - TMDB token length:", tokenLength)

    const tmdb = new TMDBClient()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "movie"
    const page = searchParams.get("page") || "1"
    const genre = searchParams.get("genre") || ""
    const yearParam = searchParams.get("year") || ""
    const sortBy = searchParams.get("sort_by") || "popularity.desc"
    const minRating = searchParams.get("min_rating") || ""
    const inTheaters = searchParams.get("in_theaters") === "true"
    const comingSoon = searchParams.get("coming_soon") === "true"
    const streamingServices = searchParams.get("streaming_services") || ""
    const excludeIds = searchParams.get("exclude_ids") || ""
    const withGenres = searchParams.get("with_genres") || ""

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

    if (withGenres) {
      params.with_genres = withGenres
    } else if (genre && genre !== "0") {
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

    if (comingSoon) {
      const today = new Date()
      const sixMonthsFromNow = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000)

      if (type === "movie") {
        params.release_date_gte = today.toISOString().split("T")[0]
        params.release_date_lte = sixMonthsFromNow.toISOString().split("T")[0]
        params.region = "US"
        params.with_original_language = "en" // Focus on English releases for consistency
      } else {
        // For TV shows, use first_air_date
        params.first_air_date_gte = today.toISOString().split("T")[0]
        params.first_air_date_lte = sixMonthsFromNow.toISOString().split("T")[0]
      }
    }

    if (streamingServices) {
      params.with_watch_providers = streamingServices
      params.watch_region = "US" // Default to US region
    }

    console.log("[v0] Discovering content:", {
      type,
      params,
      inTheaters,
      comingSoon,
      streamingServices,
      processedYear: year,
      excludeIds,
    })
    const results = type === "tv" ? await tmdb.discoverTV(params) : await tmdb.discoverMovies(params)

    if (comingSoon && results.results) {
      const today = new Date()
      const currentDateString = today.toISOString().split("T")[0] // Get YYYY-MM-DD format

      console.log(`[v0] Current date for comparison: ${currentDateString}`)

      const filteredResults = []

      for (const item of results.results) {
        const releaseDateString = item.release_date || item.first_air_date

        if (!releaseDateString) {
          console.log(`[v0] Coming Soon filter - ${item.title || item.name}: No release date, skipping`)
          continue
        }

        const isFuture = releaseDateString >= currentDateString

        console.log(`[v0] Coming Soon filter - ${item.title || item.name}: ${releaseDateString}, isFuture: ${isFuture}`)

        if (isFuture) {
          filteredResults.push(item)
        }
      }

      results.results = filteredResults
      console.log(`[v0] After Coming Soon filtering: ${results.results.length} items remaining`)
    }

    if (excludeIds && results.results) {
      const excludeIdArray = excludeIds
        .split(",")
        .map((id) => Number.parseInt(id.trim()))
        .filter((id) => !isNaN(id))
      results.results = results.results.filter((item: any) => !excludeIdArray.includes(item.id))
      console.log("[v0] Filtered out", excludeIdArray.length, "excluded items, remaining:", results.results.length)
    }

    console.log("[v0] Successfully fetched discover results:", results.results?.length, "items")

    return NextResponse.json(results)
  } catch (error) {
    console.error("[v0] TMDB discover error:", error)
    console.error("[v0] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })

    if (
      error instanceof Error &&
      (error.message.includes("TMDB API Read Access Token") || error.message.includes("TMDB_API_KEY"))
    ) {
      return NextResponse.json(
        {
          error: "TMDB API key configuration error",
          details: error.message,
          suggestion:
            "Please check that TMDB_API_READ_ACCESS_TOKEN or TMDB_API_KEY environment variable is set correctly",
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
