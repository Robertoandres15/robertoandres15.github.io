"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Search, Filter, Star, Calendar, Plus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/components/ui/use-mobile"
import type { TMDBMovie, TMDBTVShow, TMDBGenre } from "@/lib/tmdb"

interface MediaItem extends TMDBMovie, TMDBTVShow {
  media_type?: "movie" | "tv"
}

interface List {
  id: string
  name: string
  type: "wishlist" | "recommendations"
}

interface Friend {
  id: string
  display_name: string
  username: string
}

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [mediaType, setMediaType] = useState<"all" | "movie" | "tv">("all")
  const [selectedGenre, setSelectedGenre] = useState("0")
  const [selectedYear, setSelectedYear] = useState("0")
  const [sortBy, setSortBy] = useState("popularity.desc")
  const [minRating, setMinRating] = useState("0")
  const [inTheaters, setInTheaters] = useState(false)
  const [selectedStreamingServices, setSelectedStreamingServices] = useState<string[]>([])
  const [movieDuration, setMovieDuration] = useState("any")
  const [recommendedBy, setRecommendedBy] = useState("0")
  const [friends, setFriends] = useState<Friend[]>([])
  const [results, setResults] = useState<MediaItem[]>([])
  const [genres, setGenres] = useState<TMDBGenre[]>([])
  const [userLists, setUserLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [showAddToListDialog, setShowAddToListDialog] = useState(false)
  const [isAddingToList, setIsAddingToList] = useState(false)
  const { toast } = useToast()
  const isMobile = useIsMobile()

  const streamingServices = [
    { id: "8", name: "Netflix" },
    { id: "9", name: "Amazon Prime Video" },
    { id: "337", name: "Disney+" },
    { id: "384", name: "HBO Max" },
    { id: "15", name: "Hulu" },
    { id: "350", name: "Apple TV+" },
    { id: "531", name: "Paramount+" },
    { id: "387", name: "Peacock" },
    { id: "283", name: "Crunchyroll" },
    { id: "1899", name: "Max" },
  ]

  useEffect(() => {
    loadGenres()
    loadUserLists()
    loadFriends()
    loadTrending()
  }, [])

  useEffect(() => {
    if (mediaType === "tv" && inTheaters) {
      setInTheaters(false)
    }
    if (mediaType === "tv" && movieDuration !== "any") {
      setMovieDuration("any")
    }
  }, [mediaType, inTheaters, movieDuration])

  const loadGenres = async () => {
    try {
      const [movieResponse, tvResponse] = await Promise.all([
        fetch("/api/tmdb/genres?type=movie"),
        fetch("/api/tmdb/genres?type=tv"),
      ])

      const movieContentType = movieResponse.headers.get("content-type")
      const tvContentType = tvResponse.headers.get("content-type")

      if (!movieContentType?.includes("application/json") || !tvContentType?.includes("application/json")) {
        console.error("[v0] Genres API returned non-JSON response")
        return
      }

      const [movieGenres, tvGenres] = await Promise.all([movieResponse.json(), tvResponse.json()])

      if (!movieResponse.ok || !tvResponse.ok) {
        console.error("[v0] Genres API error:", movieGenres.error || tvGenres.error)
        return
      }

      const allGenres = [...(movieGenres.genres || []), ...(tvGenres.genres || [])]
      const uniqueGenres = allGenres.filter((genre, index, self) => index === self.findIndex((g) => g.id === genre.id))
      setGenres(uniqueGenres)
    } catch (error) {
      console.error("[v0] Failed to load genres:", error)
    }
  }

  const loadUserLists = async () => {
    try {
      const response = await fetch("/api/lists")
      const data = await response.json()
      if (response.ok) {
        setUserLists(data.lists || [])
      }
    } catch (error) {
      console.error("Failed to load user lists:", error)
    }
  }

  const loadFriends = async () => {
    try {
      const response = await fetch("/api/friends/list")
      const data = await response.json()
      if (response.ok) {
        setFriends(data.friends || [])
      }
    } catch (error) {
      console.error("Failed to load friends:", error)
    }
  }

  const loadTrending = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/tmdb/trending")
      const contentType = response.headers.get("content-type")

      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Trending API returned non-JSON response: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to load trending content: ${response.status}`)
      }

      setResults(data.results || [])
      setTotalPages(data.total_pages || 1)
      setCurrentPage(1)
    } catch (error) {
      console.error("[v0] Failed to load trending content:", error)
      toast({
        title: "Failed to load content",
        description: "Please check your TMDB API key configuration",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (page = 1) => {
    setIsLoading(true)
    setCurrentPage(page)

    try {
      let url = ""
      const params = new URLSearchParams({ page: page.toString() })

      if (searchQuery.trim()) {
        url = "/api/tmdb/search"
        params.append("q", searchQuery.trim())
      } else {
        url = "/api/tmdb/discover"
        if (mediaType !== "all") params.append("type", mediaType)
        if (selectedGenre !== "0") params.append("genre", selectedGenre)
        if (selectedYear !== "0") params.append("year", selectedYear)
        if (sortBy) params.append("sort_by", sortBy)
        if (minRating !== "0") params.append("min_rating", minRating)
        if (inTheaters) params.append("in_theaters", "true")
        if (selectedStreamingServices.length > 0) {
          params.append("streaming_services", selectedStreamingServices.join(","))
        }
        if (movieDuration !== "any") params.append("duration", movieDuration)
        if (recommendedBy !== "0") params.append("recommended_by", recommendedBy)
      }

      const response = await fetch(`${url}?${params}`)

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Search API returned non-JSON response: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Search failed: ${response.status}`)
      }

      if (page === 1) {
        setResults(data.results || [])
      } else {
        setResults((prev) => [...prev, ...(data.results || [])])
      }
      setTotalPages(data.total_pages || 1)
    } catch (error) {
      console.error("[v0] Search failed:", error)
      toast({
        title: "Search failed",
        description: "Please check your TMDB API key configuration",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadMore = () => {
    if (currentPage < totalPages) {
      handleSearch(currentPage + 1)
    }
  }

  const addToList = async (listId: string) => {
    if (!selectedItem) return

    setIsAddingToList(true)
    try {
      const response = await fetch(`/api/lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdb_id: selectedItem.id,
          media_type: getMediaType(selectedItem),
          title: getTitle(selectedItem),
          poster_path: selectedItem.poster_path,
          overview: selectedItem.overview,
          release_date: getReleaseDate(selectedItem),
          rating: selectedItem.vote_average,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Added to list",
          description: `${getTitle(selectedItem)} has been added to your list`,
        })
        setShowAddToListDialog(false)
        setSelectedItem(null)
      } else {
        toast({
          title: "Failed to add to list",
          description: data.error || "An error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to add to list:", error)
      toast({
        title: "Failed to add to list",
        description: "An error occurred while adding to your list",
        variant: "destructive",
      })
    } finally {
      setIsAddingToList(false)
    }
  }

  const getTitle = (item: MediaItem) => {
    return item.title || item.name || "Unknown Title"
  }

  const getReleaseDate = (item: MediaItem) => {
    return item.release_date || item.first_air_date || ""
  }

  const getMediaType = (item: MediaItem) => {
    if (item.media_type) return item.media_type
    return item.title ? "movie" : "tv"
  }

  const getPosterUrl = (posterPath: string | null) => {
    if (!posterPath) return "/placeholder.svg?height=450&width=300"
    return `https://image.tmdb.org/t/p/w300${posterPath}`
  }

  const toggleStreamingService = (serviceId: string) => {
    setSelectedStreamingServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <nav className="flex items-center justify-center gap-4 sm:gap-8 mb-8 p-3 sm:p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 overflow-x-auto">
          <Link
            href="/feed"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors whitespace-nowrap text-sm sm:text-base"
          >
            <span>Feed</span>
          </Link>
          <Link
            href="/explore"
            className="flex items-center gap-2 text-purple-400 font-medium whitespace-nowrap text-sm sm:text-base"
          >
            <span>Explore</span>
          </Link>
          <Link
            href="/friends"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors whitespace-nowrap text-sm sm:text-base"
          >
            <span>Friends</span>
          </Link>
          <Link
            href="/lists"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors whitespace-nowrap text-sm sm:text-base"
          >
            <span>Lists</span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors whitespace-nowrap text-sm sm:text-base"
          >
            <span>Profile</span>
          </Link>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Explore Movies & TV</h1>
          <div className="flex gap-2">
            {isMobile ? (
              <Drawer>
                <DrawerTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/20 bg-white/10 flex-1 sm:flex-none"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="bg-slate-900 border-slate-700 max-h-[85vh]">
                  <DrawerHeader>
                    <DrawerTitle className="text-white">Filters</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 pb-6 overflow-y-auto">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-white text-sm mb-2 block">Type</label>
                          <Select
                            value={mediaType}
                            onValueChange={(value: "all" | "movie" | "tv") => setMediaType(value)}
                          >
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="movie">Movies</SelectItem>
                              <SelectItem value="tv">TV Shows</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-white text-sm mb-2 block">Genre</label>
                          <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Any Genre</SelectItem>
                              {genres.map((genre) => (
                                <SelectItem key={genre.id} value={genre.id.toString()}>
                                  {genre.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-white text-sm mb-2 block">Year</label>
                          <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Any Year</SelectItem>
                              {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-white text-sm mb-2 block">Sort By</label>
                          <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="popularity.desc">Most Popular</SelectItem>
                              <SelectItem value="vote_average.desc">Highest Rated</SelectItem>
                              <SelectItem value="release_date.desc">Newest</SelectItem>
                              <SelectItem value="title.asc">A-Z</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-white text-sm mb-2 block">Min Rating</label>
                          <Select value={minRating} onValueChange={setMinRating}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Any Rating</SelectItem>
                              <SelectItem value="7">7+ Stars</SelectItem>
                              <SelectItem value="8">8+ Stars</SelectItem>
                              <SelectItem value="9">9+ Stars</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-white text-sm mb-2 block">Duration</label>
                          <Select value={movieDuration} onValueChange={setMovieDuration} disabled={mediaType === "tv"}>
                            <SelectTrigger
                              className={
                                mediaType === "tv"
                                  ? "bg-white/5 border-white/10 text-white/50 cursor-not-allowed"
                                  : "bg-white/10 border-white/20 text-white"
                              }
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any Duration</SelectItem>
                              <SelectItem value="0-90">Under 90 min</SelectItem>
                              <SelectItem value="90-120">90-120 min</SelectItem>
                              <SelectItem value="120-150">120-150 min</SelectItem>
                              <SelectItem value="150-999">Over 150 min</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="text-white text-sm mb-3 block">Streaming Services</label>
                        <div className="grid grid-cols-2 gap-2">
                          {streamingServices.map((service) => (
                            <Button
                              key={service.id}
                              variant={selectedStreamingServices.includes(service.id) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleStreamingService(service.id)}
                              className={
                                selectedStreamingServices.includes(service.id)
                                  ? "bg-purple-600 hover:bg-purple-700 text-white text-xs h-10"
                                  : "border-white/20 text-white hover:bg-white/20 bg-white/10 text-xs h-10"
                              }
                            >
                              {selectedStreamingServices.includes(service.id) ? "✓ " : ""}
                              {service.name}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                        <Button onClick={() => handleSearch()} className="bg-purple-600 hover:bg-purple-700 h-12">
                          Apply Filters
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedGenre("0")
                            setSelectedYear("0")
                            setSortBy("popularity.desc")
                            setMinRating("0")
                            setMediaType("all")
                            setInTheaters(false)
                            setSelectedStreamingServices([])
                            setMovieDuration("any")
                            setRecommendedBy("0")
                            loadTrending()
                          }}
                          className="border-white/20 text-white hover:bg-white/20 bg-white/10 h-12"
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="border-white/20 text-white hover:bg-white/20 bg-white/10"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            )}
            <Button
              variant="outline"
              asChild
              className="border-white/20 text-white hover:bg-white/10 bg-transparent flex-1 sm:flex-none"
            >
              <Link href="/lists">My Lists</Link>
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search for movies, TV shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 pr-20 bg-white/10 border-white/20 text-white placeholder:text-slate-400 h-12 sm:h-10"
            />
            <Button
              onClick={() => handleSearch()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-600 hover:bg-purple-700 h-8"
              size="sm"
            >
              Search
            </Button>
          </div>
        </div>

        {showFilters && !isMobile && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="text-white text-sm mb-2 block">Type</label>
                  <Select value={mediaType} onValueChange={(value: "all" | "movie" | "tv") => setMediaType(value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="movie">Movies</SelectItem>
                      <SelectItem value="tv">TV Shows</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-white text-sm mb-2 block">Genre</label>
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any Genre</SelectItem>
                      {genres.map((genre) => (
                        <SelectItem key={genre.id} value={genre.id.toString()}>
                          {genre.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-white text-sm mb-2 block">Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any Year</SelectItem>
                      {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-white text-sm mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popularity.desc">Most Popular</SelectItem>
                      <SelectItem value="vote_average.desc">Highest Rated</SelectItem>
                      <SelectItem value="release_date.desc">Newest</SelectItem>
                      <SelectItem value="title.asc">A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-white text-sm mb-2 block">Min Rating</label>
                  <Select value={minRating} onValueChange={setMinRating}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any Rating</SelectItem>
                      <SelectItem value="7">7+ Stars</SelectItem>
                      <SelectItem value="8">8+ Stars</SelectItem>
                      <SelectItem value="9">9+ Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-white text-sm mb-2 block">Duration</label>
                  <Select value={movieDuration} onValueChange={setMovieDuration} disabled={mediaType === "tv"}>
                    <SelectTrigger
                      className={
                        mediaType === "tv"
                          ? "bg-white/5 border-white/10 text-white/50 cursor-not-allowed"
                          : "bg-white/10 border-white/20 text-white"
                      }
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Duration</SelectItem>
                      <SelectItem value="0-90">Under 90 min</SelectItem>
                      <SelectItem value="90-120">90-120 min</SelectItem>
                      <SelectItem value="120-150">120-150 min</SelectItem>
                      <SelectItem value="150-999">Over 150 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="text-white text-sm mb-2 block">Recommended By</label>
                  <Select value={recommendedBy} onValueChange={setRecommendedBy}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Anyone</SelectItem>
                      {friends.map((friend) => (
                        <SelectItem key={friend.id} value={friend.id}>
                          {friend.display_name || friend.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-white text-sm mb-2 block">Availability</label>
                  <Button
                    variant={inTheaters ? "default" : "outline"}
                    onClick={() => setInTheaters(!inTheaters)}
                    disabled={mediaType === "tv"}
                    className={
                      mediaType === "tv"
                        ? "border-white/10 text-white/50 bg-white/5 cursor-not-allowed"
                        : inTheaters
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : "border-white/20 text-white hover:bg-white/20 bg-white/10"
                    }
                  >
                    {inTheaters ? "✓ " : ""}In Theaters
                  </Button>
                </div>

                <div>
                  <label className="text-white text-sm mb-2 block">Streaming Services</label>
                  <div className="flex flex-wrap gap-2">
                    {streamingServices.map((service) => (
                      <Button
                        key={service.id}
                        variant={selectedStreamingServices.includes(service.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleStreamingService(service.id)}
                        className={
                          selectedStreamingServices.includes(service.id)
                            ? "bg-purple-600 hover:bg-purple-700 text-white text-xs"
                            : "border-white/20 text-white hover:bg-white/20 bg-white/10 text-xs"
                        }
                      >
                        {selectedStreamingServices.includes(service.id) ? "✓ " : ""}
                        {service.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={() => handleSearch()} className="bg-purple-600 hover:bg-purple-700">
                  Apply Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedGenre("0")
                    setSelectedYear("0")
                    setSortBy("popularity.desc")
                    setMinRating("0")
                    setMediaType("all")
                    setInTheaters(false)
                    setSelectedStreamingServices([])
                    setMovieDuration("any")
                    setRecommendedBy("0")
                    loadTrending()
                  }}
                  className="border-white/20 text-white hover:bg-white/20 bg-white/10"
                >
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading && results.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-white">Loading...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
              {results.map((item) => (
                <Card
                  key={`${getMediaType(item)}-${item.id}`}
                  className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group"
                >
                  <CardContent className="p-0">
                    <Link href={`/explore/${getMediaType(item)}/${item.id}`}>
                      <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
                        <Image
                          src={getPosterUrl(item.poster_path) || "/placeholder.svg"}
                          alt={getTitle(item)}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="bg-black/50 text-white text-xs">
                            {getMediaType(item) === "movie" ? "Movie" : "TV"}
                          </Badge>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="flex items-center gap-1 text-white text-xs">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{item.vote_average?.toFixed(1) || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="p-2 sm:p-3">
                      <h3 className="text-white font-medium text-xs sm:text-sm mb-1 line-clamp-2">{getTitle(item)}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-slate-400 text-xs">
                          <Calendar className="h-3 w-3" />
                          <span>{getReleaseDate(item)?.split("-")[0] || "TBA"}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-purple-400 hover:text-purple-300 hover:bg-white/10"
                          onClick={() => {
                            setSelectedItem(item)
                            setShowAddToListDialog(true)
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {currentPage < totalPages && (
              <div className="text-center">
                <Button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto h-12 sm:h-10"
                >
                  {isLoading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </>
        )}

        <Dialog open={showAddToListDialog} onOpenChange={setShowAddToListDialog}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Add to List</DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-24 overflow-hidden rounded">
                    <Image
                      src={getPosterUrl(selectedItem.poster_path) || "/placeholder.svg"}
                      alt={getTitle(selectedItem)}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{getTitle(selectedItem)}</h3>
                    <p className="text-slate-400 text-sm">
                      {getMediaType(selectedItem) === "movie" ? "Movie" : "TV Show"} •{" "}
                      {getReleaseDate(selectedItem)?.split("-")[0] || "TBA"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-white font-medium">Select a list:</h4>
                  {userLists.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-slate-400 text-sm mb-2">No lists found</p>
                      <Button
                        asChild
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                      >
                        <Link href="/lists">Create a List</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {userLists.map((list) => (
                        <Button
                          key={list.id}
                          variant="outline"
                          className="w-full justify-start border-white/20 text-white hover:bg-white/10 bg-transparent"
                          onClick={() => addToList(list.id)}
                          disabled={isAddingToList}
                        >
                          <div className="flex items-center gap-2">
                            {list.type === "wishlist" ? "📚" : "❤️"}
                            <span>{list.name}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
