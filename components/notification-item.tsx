"use client"

import type React from "react"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Bell, Users, Heart, MessageCircle, Share2, Film, Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface NotificationItemProps {
  notification: {
    id: string
    type: string
    title: string
    message: string
    read: boolean
    created_at: string
    from_user_id?: string
    related_id?: string
    related_type?: string
    data?: Record<string, any>
    from_user?: {
      id: string
      display_name: string
      avatar_url?: string
    }
  }
  onMarkAsRead?: (id: string) => void
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const [isMarking, setIsMarking] = useState(false)

  const getNotificationIcon = () => {
    switch (notification.type) {
      case "friend_request_received":
      case "friend_request_accepted":
        return <Users className="h-4 w-4 text-blue-400" />
      case "mutual_match":
        return <Film className="h-4 w-4 text-purple-400" />
      case "list_like":
        return <Heart className="h-4 w-4 text-red-400" />
      case "list_comment":
        return <MessageCircle className="h-4 w-4 text-green-400" />
      case "list_shared":
        return <Share2 className="h-4 w-4 text-yellow-400" />
      case "recommendation_added_to_wishlist":
        return <Bell className="h-4 w-4 text-orange-400" />
      default:
        return <Bell className="h-4 w-4 text-slate-400" />
    }
  }

  const getNotificationLink = () => {
    switch (notification.type) {
      case "friend_request_received":
      case "friend_request_accepted":
        return "/friends"
      case "mutual_match":
        return "/explore"
      case "list_comment":
      case "list_like":
      case "list_shared":
        return notification.related_id ? `/lists/${notification.related_id}` : "/lists"
      case "recommendation_added_to_wishlist":
        return "/profile"
      default:
        return "/feed"
    }
  }

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (notification.read || isMarking) return

    setIsMarking(true)
    try {
      const response = await fetch(`/api/notifications/${notification.id}/read`, {
        method: "PATCH",
      })

      if (response.ok) {
        onMarkAsRead?.(notification.id)
      }
    } catch (error) {
      console.error("[v0] Failed to mark notification as read:", error)
    } finally {
      setIsMarking(false)
    }
  }

  const NotificationContent = () => (
    <Card
      className={cn(
        "p-4 transition-all hover:bg-slate-800/50 cursor-pointer border-slate-700",
        !notification.read && "bg-slate-800/30 border-purple-500/20",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Notification Icon */}
        <div className="flex-shrink-0 mt-1">{getNotificationIcon()}</div>

        {/* User Avatar (if from another user) */}
        {notification.from_user && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={notification.from_user.avatar_url || "/placeholder.svg"} />
            <AvatarFallback className="bg-slate-700 text-slate-300 text-xs">
              {notification.from_user.display_name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4
                className={cn(
                  "text-sm font-medium mb-1",
                  !notification.read ? "text-white font-semibold" : "text-slate-200",
                )}
              >
                {notification.title || "Notification"}
              </h4>
              <p className={cn("text-sm leading-relaxed", !notification.read ? "text-slate-200" : "text-slate-400")}>
                {notification.message || "You have a new notification"}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </div>

            {/* Mark as Read Button */}
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAsRead}
                disabled={isMarking}
                className="flex-shrink-0 h-8 w-8 p-0 hover:bg-slate-700"
                aria-label="Mark as read"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Unread Indicator */}
        {!notification.read && <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2" />}
      </div>
    </Card>
  )

  const link = getNotificationLink()

  return (
    <Link href={link} className="block">
      <NotificationContent />
    </Link>
  )
}
