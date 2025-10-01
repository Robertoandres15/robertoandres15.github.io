import { type NextRequest, NextResponse } from "next/server"
import { TMDBClient } from "@/lib/tmdb"

export async function GET(request: NextRequest, { params }: { params: { directorId: string } }) {
  try {
    console.log("[v0] Director API route called for director:", params.directorId)

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")

    const tmdb = new TMDBClient()

    // Get the director's combined credits (movies and TV shows they directed)
    const creditsResponse = await tmdb.request(`/person/${params.directorId}/combined_credits`)

    if (!creditsResponse.crew) {
      return NextResponse.json({
        results: [],
        directors: [],
        page: 1,
        total_pages: 1,
        total_results: 0,
      })
    }

    // Filter for directing credits only
    const directedWorks = creditsResponse.crew.filter(
      (credit: any) => credit.job === "Director" || credit.department === "Directing",
    )

    // Sort by popularity and release date
    const sortedWorks = directedWorks.sort((a: any, b: any) => {
      const aDate = new Date(a.release_date || a.first_air_date || "1900-01-01")
      const bDate = new Date(b.release_date || b.first_air_date || "1900-01-01")
      return bDate.getTime() - aDate.getTime() // Most recent first
    })

    // Paginate results (20 per page)
    const startIndex = (page - 1) * 20
    const endIndex = startIndex + 20
    const paginatedResults = sortedWorks.slice(startIndex, endIndex)

    // Transform to match expected format
    const results = paginatedResults.map((work: any) => ({
      id: work.id,
      title: work.title,
      name: work.name,
      media_type: work.media_type,
      poster_path: work.poster_path,
      backdrop_path: work.backdrop_path,
      overview: work.overview,
      release_date: work.release_date,
      first_air_date: work.first_air_date,
      vote_average: work.vote_average,
      genre_ids: work.genre_ids || [],
      popularity: work.popularity || 0,
    }))

    const totalResults = sortedWorks.length
    const totalPages = Math.ceil(totalResults / 20)

    console.log("[v0] Director works found:", results.length, "of", totalResults, "total")

    return NextResponse.json({
      results,
      directors: [], // No directors in director-specific results
      page,
      total_pages: totalPages,
      total_results: totalResults,
    })
  } catch (error: any) {
    console.error("[v0] Director API error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch director's works" }, { status: 500 })
  }
}
