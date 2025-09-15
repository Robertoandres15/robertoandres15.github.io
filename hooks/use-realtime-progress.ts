"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface Progress {
  user_id: string
  display_name: string
  username: string
  avatar_url?: string
  current_season: number
  current_episode: number
  last_updated: string
}

export function useRealtimeProgress(watchPartyId: string | null) {
  const [progress, setProgress] = useState<Progress[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProgress = async () => {
    if (!watchPartyId) {
      setProgress([])
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/reel-club/progress?watch_party_id=${watchPartyId}`)
      if (response.ok) {
        const data = await response.json()
        setProgress(data.progress || [])
      }
    } catch (error) {
      console.error("Error fetching progress:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!watchPartyId) {
      setProgress([])
      setLoading(false)
      return
    }

    const supabase = createClient()

    // Initial fetch
    fetchProgress()

    const progressChannel = supabase
      .channel(`progress_${watchPartyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "episode_progress",
          filter: `watch_party_id=eq.${watchPartyId}`,
        },
        (payload) => {
          console.log("[v0] Progress updated for watch party:", payload)
          // Refetch progress when any participant updates their progress
          fetchProgress()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(progressChannel)
    }
  }, [watchPartyId])

  return {
    progress,
    loading,
    refetch: fetchProgress,
  }
}
