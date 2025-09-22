const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p"

export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  adult: boolean
  original_language: string
  original_title: string
  popularity: number
  video: boolean
}

export interface TMDBTVShow {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  adult: boolean
  original_language: string
  original_name: string
  popularity: number
  origin_country: string[]
}

export interface TMDBSearchResponse {
  page: number
  results: (TMDBMovie | TMDBTVShow)[]
  total_pages: number
  total_results: number
}

export interface TMDBPerson {
  id: number
  name: string
  profile_path: string | null
  adult: boolean
  known_for_department: string
  known_for: (TMDBMovie | TMDBTVShow)[]
  popularity: number
}

export interface TMDBPersonSearchResponse {
  page: number
  results: TMDBPerson[]
  total_pages: number
  total_results: number
}

export interface TMDBPersonCredits {
  id: number
  cast: (TMDBMovie | TMDBTVShow)[]
  crew: (TMDBMovie | (TMDBTVShow & { job: string; department: string }))[]
}

export interface TMDBGenre {
  id: number
  name: string
}

export interface TMDBWatchProvider {
  display_priority: number
  logo_path: string
  provider_id: number
  provider_name: string
}

export interface TMDBWatchProviders {
  id: number
  results: {
    [countryCode: string]: {
      link: string
      flatrate?: TMDBWatchProvider[]
      rent?: TMDBWatchProvider[]
      buy?: TMDBWatchProvider[]
    }
  }
}

export class TMDBClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = TMDB_BASE_URL
  }

  private getAuthToken(): string {
    const readAccessToken = process.env.TMDB_API_READ_ACCESS_TOKEN
    const apiKey = process.env.TMBD_API_KEY || process.env.TMDB_API_KEY

    console.log("[v0] Environment check - TMDB token exists:", !!(readAccessToken || apiKey))
    console.log("[v0] Environment check - TMDB token length:", (readAccessToken || apiKey)?.length || 0)

    const token = readAccessToken || apiKey
    if (!token) {
      console.error("[v0] No TMDB API credentials found. Please check environment variables.")
      throw new Error(
        "TMDB API credentials are required. Please add TMDB_API_READ_ACCESS_TOKEN or TMDB_API_KEY to your environment variables.",
      )
    }

    console.log("[v0] Using token type:", this.isV3ApiKey(token) ? "v3 API Key" : "v4 Read Access Token")
    console.log("[v0] Token length:", token.length)

    return token
  }

  private isV3ApiKey(token: string): boolean {
    // v3 API keys are typically 32 characters long and alphanumeric
    // v4 Read Access Tokens are much longer JWT-like tokens
    return token.length <= 40 && !token.includes(".")
  }

  private async request(endpoint: string, params: Record<string, string> = {}) {
    const token = this.getAuthToken()
    const url = new URL(`${this.baseUrl}${endpoint}`)

    if (this.isV3ApiKey(token)) {
      // v3 API key goes as query parameter
      url.searchParams.append("api_key", token)
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value)
    })

    console.log("[v0] TMDB API request:", url.toString())

    try {
      const headers: Record<string, string> = {
        accept: "application/json",
      }

      if (!this.isV3ApiKey(token)) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(url.toString(), { headers })

      // Get response text first to handle both JSON and HTML responses
      const responseText = await response.text()
      console.log("[v0] TMDB API response status:", response.status)
      console.log("[v0] TMDB API response preview:", responseText.substring(0, 200))

      if (responseText.includes("Too Many Requests") || response.status === 429) {
        console.error("[v0] TMDB API rate limit exceeded")
        throw new Error("TMDB API rate limit exceeded. Please try again later.")
      }

      if (!response.ok) {
        console.error("[v0] TMDB API error response:", responseText)
        if (response.status === 401) {
          throw new Error(`TMDB API authentication failed. Please check your API key/token.`)
        } else if (response.status === 404) {
          throw new Error(`TMDB API endpoint not found: ${endpoint}`)
        } else {
          throw new Error(`TMDB API error (${response.status}): ${responseText.substring(0, 100)}`)
        }
      }

      // Try to parse as JSON, with better error handling
      try {
        return JSON.parse(responseText)
      } catch (parseError) {
        console.error("[v0] Failed to parse TMDB response as JSON:", parseError)
        console.error("[v0] Response text:", responseText)
        throw new Error(`TMDB API returned invalid JSON: ${responseText.substring(0, 100)}`)
      }
    } catch (fetchError) {
      if (fetchError instanceof TypeError && fetchError.message.includes("fetch")) {
        throw new Error(`Network error connecting to TMDB API: ${fetchError.message}`)
      }
      throw fetchError
    }
  }

  async searchMulti(query: string, page = 1): Promise<TMDBSearchResponse> {
    return this.request("/search/multi", { query, page: page.toString() })
  }

  async getPopularMovies(page = 1): Promise<TMDBSearchResponse> {
    return this.request("/movie/popular", { page: page.toString() })
  }

  async getPopularTVShows(page = 1): Promise<TMDBSearchResponse> {
    return this.request("/tv/popular", { page: page.toString() })
  }

  async getTrendingAll(timeWindow: "day" | "week" = "week", page = 1): Promise<TMDBSearchResponse> {
    return this.request(`/trending/all/${timeWindow}`, { page: page.toString() })
  }

  async getMovieDetails(id: number) {
    return this.request(`/movie/${id}`)
  }

  async getTVDetails(id: number) {
    return this.request(`/tv/${id}`)
  }

  async getMovieGenres(): Promise<{ genres: TMDBGenre[] }> {
    return this.request("/genre/movie/list")
  }

  async getTVGenres(): Promise<{ genres: TMDBGenre[] }> {
    return this.request("/genre/tv/list")
  }

  async discoverMovies(
    params: {
      page?: number
      genre?: string
      year?: string
      sort_by?: string
      vote_average_gte?: string
      with_watch_providers?: string
      watch_region?: string
      release_date_gte?: string
      release_date_lte?: string
      with_release_type?: string
    } = {},
  ): Promise<TMDBSearchResponse> {
    const queryParams: Record<string, string> = {}

    if (params.page) queryParams.page = params.page.toString()
    if (params.genre) queryParams.with_genres = params.genre
    if (params.year) {
      queryParams.primary_release_year = params.year
    }
    if (params.sort_by) queryParams.sort_by = params.sort_by
    if (params.vote_average_gte) queryParams["vote_average.gte"] = params.vote_average_gte
    if (params.with_watch_providers) queryParams.with_watch_providers = params.with_watch_providers
    if (params.watch_region) queryParams.watch_region = params.watch_region
    if (params.release_date_gte) queryParams["release_date.gte"] = params.release_date_gte
    if (params.release_date_lte) queryParams["release_date.lte"] = params.release_date_lte
    if (params.with_release_type) queryParams.with_release_type = params.with_release_type

    console.log("[v0] Movie discover query params:", queryParams)
    return this.request("/discover/movie", queryParams)
  }

  async discoverTV(
    params: {
      page?: number
      genre?: string
      year?: string
      sort_by?: string
      vote_average_gte?: string
      with_watch_providers?: string
      watch_region?: string
    } = {},
  ): Promise<TMDBSearchResponse> {
    const queryParams: Record<string, string> = {}

    if (params.page) queryParams.page = params.page.toString()
    if (params.genre) queryParams.with_genres = params.genre
    if (params.year) {
      queryParams.first_air_date_year = params.year
    }
    if (params.sort_by) queryParams.sort_by = params.sort_by
    if (params.vote_average_gte) queryParams["vote_average.gte"] = params.vote_average_gte
    if (params.with_watch_providers) queryParams.with_watch_providers = params.with_watch_providers
    if (params.watch_region) queryParams.watch_region = params.watch_region

    console.log("[v0] TV discover query params:", queryParams)
    return this.request("/discover/tv", queryParams)
  }

  async getMovieWatchProviders(id: number): Promise<TMDBWatchProviders> {
    return this.request(`/movie/${id}/watch/providers`)
  }

  async getTVWatchProviders(id: number): Promise<TMDBWatchProviders> {
    return this.request(`/tv/${id}/watch/providers`)
  }

  async searchPerson(query: string, page = 1): Promise<TMDBPersonSearchResponse> {
    return this.request("/search/person", { query, page: page.toString() })
  }

  async getPersonCredits(personId: number): Promise<TMDBPersonCredits> {
    return this.request(`/person/${personId}/combined_credits`)
  }

  getImageUrl(path: string | null, size: "w200" | "w300" | "w500" | "w780" | "original" = "w500"): string | null {
    if (!path) return null
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`
  }
}

export const tmdb = new TMDBClient()
