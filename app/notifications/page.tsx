"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCheck, Settings, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { NotificationItem } from "@/components/notification-item"
import { enablePushNotifications, disablePushNotifications, isPushNotificationEnabled } from "@/lib/push-notifications"
import Link from "next/link"
import { MobileNavigation } from "@/components/mobile-navigation"

interface Notification {
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [isEnablingPush, setIsEnablingPush] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchNotifications()
    checkPushStatus()
    checkPermissionStatus()
  }, [])

  const fetchNotifications = async (pageNum = 1) => {
    try {
      const response = await fetch(`/api/notifications?page=${pageNum}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        if (pageNum === 1) {
          setNotifications(data.notifications)
        } else {
          setNotifications((prev) => [...prev, ...data.notifications])
        }
        setHasMore(data.hasMore)
        setPage(pageNum)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkPushStatus = async () => {
    try {
      const enabled = await isPushNotificationEnabled()
      setPushEnabled(enabled)
    } catch (error) {
      console.error("[v0] Failed to check push status:", error)
    }
  }

  const checkPermissionStatus = () => {
    if ("Notification" in window) {
      setPermissionDenied(Notification.permission === "denied")
    }
  }

  const handleEnablePush = async () => {
    setIsEnablingPush(true)
    try {
      const success = await enablePushNotifications()
      setPushEnabled(success)
      checkPermissionStatus()
    } catch (error) {
      console.error("Failed to enable push notifications:", error)
    } finally {
      setIsEnablingPush(false)
    }
  }

  const handleDisablePush = async () => {
    setIsEnablingPush(true)
    try {
      await disablePushNotifications()
      setPushEnabled(false)
    } catch (error) {
      console.error("Failed to disable push notifications:", error)
    } finally {
      setIsEnablingPush(false)
    }
  }

  const handleTogglePush = async () => {
    if (pushEnabled) {
      await handleDisablePush()
    } else {
      await handleEnablePush()
    }
  }

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true)
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
      }
    } catch (error) {
      console.error("[v0] Failed to mark all as read:", error)
    } finally {
      setIsMarkingAllRead(false)
    }
  }

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === notificationId ? { ...notification, read: true } : notification)),
    )
  }

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchNotifications(page + 1)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-purple-400" />
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">{unreadCount}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllRead}
                className="text-xs bg-transparent"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark All Read
              </Button>
            )}

            <Link href="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Push Notifications Setup */}
        <Card className="mb-6 bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Bell className="h-5 w-5 text-purple-400" />
              {pushEnabled ? "Push Notifications Enabled" : "Enable Push Notifications"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 mb-4 text-base">
              {pushEnabled
                ? "You're receiving push notifications for friend requests, matches, and more."
                : "Get notified instantly when you receive friend requests, matches, and more."}
            </p>

            {permissionDenied && !pushEnabled && (
              <Alert className="mb-4 bg-red-950 border-red-800">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200">
                  Notifications are blocked in your browser. To enable them, click the lock icon in your browser's
                  address bar and allow notifications for this site.
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleTogglePush}
              disabled={isEnablingPush}
              className={pushEnabled ? "bg-slate-700 hover:bg-slate-600" : "bg-purple-600 hover:bg-purple-700"}
            >
              {isEnablingPush ? "Processing..." : pushEnabled ? "Disable Notifications" : "Enable Notifications"}
            </Button>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading && page === 1 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </Card>
            ))
          ) : notifications.length === 0 ? (
            <Card className="p-8 text-center bg-slate-900 border-slate-700">
              <Bell className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No notifications yet</h3>
              <p className="text-slate-500">
                When you get friend requests, matches, or other updates, they'll appear here.
              </p>
            </Card>
          ) : (
            <>
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} onMarkAsRead={handleMarkAsRead} />
              ))}

              {hasMore && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                    {isLoading ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  )
}
