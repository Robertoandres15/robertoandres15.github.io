import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tmdbId = searchParams.get("tmdb_id")

  if (!tmdbId) {
    return NextResponse.json({ error: "TMDB ID is required" }, { status: 400 })
  }

  try {
    const apiKey = process.env.TMBD_API_KEY || process.env.TMDB_API_READ_ACCESS_TOKEN

    if (!apiKey) {
      console.error("TMDB API key not found")
      return NextResponse.json({ error: "API configuration error" }, { status: 500 })
    }

    // Check if movie is in the "now playing" list
    const nowPlayingResponse = await fetch(
      `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&page=1&region=US`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!nowPlayingResponse.ok) {
      throw new Error(`TMDB API error: ${nowPlayingResponse.status}`)
    }

    const nowPlayingData = await nowPlayingResponse.json()
    const isInNowPlaying = nowPlayingData.results.some((movie: any) => movie.id === Number.parseInt(tmdbId))

    if (isInNowPlaying) {
      return NextResponse.json({ inTheaters: true })
    }

    // If not in now playing, check release dates for theatrical releases
    const releaseDatesResponse = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}/release_dates?api_key=${apiKey}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!releaseDatesResponse.ok) {
      return NextResponse.json({ inTheaters: false })
    }

    const releaseDatesData = await releaseDatesResponse.json()
    const currentDate = new Date()

    // Check for US theatrical releases within the last 45 days (typical theater run)
    const usReleases = releaseDatesData.results.find((country: any) => country.iso_3166_1 === "US")

    if (usReleases) {
      const theatricalReleases = usReleases.release_dates.filter(
        (release: any) => release.type === 3 || release.type === 2, // Theatrical or Limited Theatrical
      )

      for (const release of theatricalReleases) {
        const releaseDate = new Date(release.release_date)
        const daysSinceRelease = (currentDate.getTime() - releaseDate.getTime()) / (1000 * 3600 * 24)

        // Consider in theaters if released within last 45 days and not more than 2 days in the future
        if (daysSinceRelease >= -2 && daysSinceRelease <= 45) {
          return NextResponse.json({ inTheaters: true })
        }
      }
    }

    return NextResponse.json({ inTheaters: false })
  } catch (error) {
    console.error("Error checking theater status:", error)
    return NextResponse.json({ inTheaters: false })
  }
}
