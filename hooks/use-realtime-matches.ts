"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface Match {
  tmdb_id: number
  media_type: string
  title: string
  poster_path?: string
  overview?: string
  release_date?: string
  matched_friends: Array<{
    id: string
    username: string
    display_name: string
    avatar_url?: string
  }>
  watch_party?: {
    id: string
    status: string
    watch_party_participants: Array<{
      user_id: string
      status: string
    }>
  } | null
}

export function useRealtimeMatches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = async () => {
    try {
      setError(null)
      console.log("[v0] Fetching matches from API...")
      const response = await fetch("/api/reel-club/matches")
      console.log("[v0] Matches API response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Matches API response data:", data)
        setMatches(data.matches || [])
      } else {
        const errorText = await response.text()
        console.log("[v0] Matches API error:", errorText)
        setError("Failed to fetch matches")
      }
    } catch (err) {
      console.error("[v0] Error fetching matches:", err)
      setError("Failed to fetch matches")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const supabase = createClient()

    // Initial fetch
    fetchMatches()

    const watchPartiesChannel = supabase
      .channel("watch_parties_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "watch_parties",
        },
        (payload) => {
          console.log("[v0] Watch party changed:", payload)
          // Refetch matches when watch parties change
          fetchMatches()
        },
      )
      .subscribe()

    const participantsChannel = supabase
      .channel("participants_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "watch_party_participants",
        },
        (payload) => {
          console.log("[v0] Participant status changed:", payload)
          // Refetch matches when participant status changes
          fetchMatches()
        },
      )
      .subscribe()

    const progressChannel = supabase
      .channel("progress_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "episode_progress",
        },
        (payload) => {
          console.log("[v0] Episode progress updated:", payload)
          // Refetch matches to update progress data
          fetchMatches()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(watchPartiesChannel)
      supabase.removeChannel(participantsChannel)
      supabase.removeChannel(progressChannel)
    }
  }, [])

  return {
    matches,
    loading,
    error,
    refetch: fetchMatches,
  }
}
