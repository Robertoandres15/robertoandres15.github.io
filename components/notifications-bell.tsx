"use client"

import { Bell } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface NotificationsBellProps {
  className?: string
  showLabel?: boolean
}

export function NotificationsBell({ className, showLabel = false }: NotificationsBellProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUnreadCount()

    // Set up polling for real-time updates
    const interval = setInterval(fetchUnreadCount, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/notifications?unread_only=true&limit=1")
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch unread count:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Link href="/notifications" className={cn("relative", className)}>
      <Button
        variant="ghost"
        size={showLabel ? "default" : "icon"}
        className={cn("relative", showLabel ? "flex items-center gap-2" : "h-10 w-10")}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {showLabel && <span>Notifications</span>}

        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold min-w-[20px]"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>
    </Link>
  )
}
