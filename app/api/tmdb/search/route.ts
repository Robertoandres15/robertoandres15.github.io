import { type NextRequest, NextResponse } from "next/server"
import { TMDBClient } from "@/lib/tmdb"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Search API route called")
    console.log("[v0] Environment check - TMDB_API_READ_ACCESS_TOKEN exists:", !!process.env.TMDB_API_READ_ACCESS_TOKEN)
    console.log("[v0] Environment check - TMBD_API_KEY exists:", !!process.env.TMBD_API_KEY)

    const tmdb = new TMDBClient()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const page = searchParams.get("page") || "1"

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    console.log("[v0] Searching for:", query, "page:", page)

    const directorVariations: Record<string, string[]> = {
      "christoper nolan": ["christopher nolan"],
      "chris nolan": ["christopher nolan"],
      "quentin tarentino": ["quentin tarantino"],
      "martin scorcese": ["martin scorsese"],
      "steven speilberg": ["steven spielberg"],
      "ridley scot": ["ridley scott"],
      "david fincher": ["david fincher"],
      "denis villanueve": ["denis villeneuve"],
      "denis villeneuve": ["denis villeneuve"],
      "wes anderson": ["wes anderson"],
      "paul thomas anderson": ["paul thomas anderson"],
      pta: ["paul thomas anderson"],
      kubrik: ["stanley kubrick"],
      "stanley kubrik": ["stanley kubrick"],
      hitchcock: ["alfred hitchcock"],
      "alfred hitchock": ["alfred hitchcock"],
      "coen brothers": ["joel coen", "ethan coen"],
      "russo brothers": ["anthony russo", "joe russo"],
      wachowski: ["lana wachowski", "lilly wachowski"],
      "wachowski brothers": ["lana wachowski", "lilly wachowski"],
      "wachowski sisters": ["lana wachowski", "lilly wachowski"],
    }

    const getSearchVariations = (searchQuery: string): string[] => {
      const normalizedQuery = searchQuery.toLowerCase().trim()
      const variations = [searchQuery] // Always include original query

      // Check for exact matches in variations dictionary
      if (directorVariations[normalizedQuery]) {
        variations.push(...directorVariations[normalizedQuery])
      }

      // Check for partial matches (if query contains a key)
      for (const [key, values] of Object.entries(directorVariations)) {
        if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
          variations.push(...values)
        }
      }

      return [...new Set(variations)] // Remove duplicates
    }

    const searchVariations = getSearchVariations(query)
    let multiResults: any = null
    let personResults: any = null
    let usedQuery = query

    for (const searchQuery of searchVariations) {
      console.log("[v0] Trying search variation:", searchQuery)

      const [multiRes, personRes] = await Promise.all([
        tmdb.searchMulti(searchQuery, Number.parseInt(page)),
        tmdb.searchPerson(searchQuery, Number.parseInt(page)),
      ])

      // If we found results, use them
      if (multiRes.results?.length > 0 || personRes.results?.length > 0) {
        multiResults = multiRes
        personResults = personRes
        usedQuery = searchQuery
        console.log("[v0] Found results with variation:", searchQuery)
        break
      }
    }

    // If no variations worked, use the last attempt
    if (!multiResults || !personResults) {
      const [multiRes, personRes] = await Promise.all([
        tmdb.searchMulti(query, Number.parseInt(page)),
        tmdb.searchPerson(query, Number.parseInt(page)),
      ])
      multiResults = multiRes
      personResults = personRes
      usedQuery = query
    }

    console.log("[v0] Multi search results:", multiResults.results?.length, "items")
    console.log("[v0] Person search results:", personResults.results?.length, "items")

    const directorResults = []
    for (const person of personResults.results || []) {
      if (person.known_for_department === "Directing" || person.known_for?.some((work) => work.title || work.name)) {
        try {
          const credits = await tmdb.getPersonCredits(person.id)
          // Get movies/shows they directed
          const directedWorks =
            credits.crew?.filter((work) => work.job === "Director" || work.department === "Directing") || []

          if (directedWorks.length > 0) {
            directorResults.push({
              director: person,
              works: directedWorks.slice(0, 10), // Limit to top 10 works
            })
          }
        } catch (error) {
          console.error("[v0] Error fetching credits for director:", person.name, error)
        }
      }
    }

    const combinedResults = {
      page: multiResults.page,
      total_pages: Math.max(multiResults.total_pages, personResults.total_pages),
      total_results: multiResults.total_results + personResults.total_results,
      results: multiResults.results || [],
      directors: directorResults,
      searchQuery: usedQuery,
      originalQuery: query,
      corrected: usedQuery !== query,
    }

    console.log(
      "[v0] Combined search results:",
      combinedResults.results.length,
      "media items,",
      directorResults.length,
      "directors",
    )
    return NextResponse.json(combinedResults)
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
