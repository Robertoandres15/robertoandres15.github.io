"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { enablePushNotifications, disablePushNotifications, isPushNotificationEnabled } from "@/lib/push-notifications"

export function PushNotificationSetup() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const enabled = await isPushNotificationEnabled()
      setIsEnabled(enabled)
    } catch (error) {
      console.error("[v0] Failed to check push notification status:", error)
      setError("Failed to check notification status")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = async () => {
    setIsToggling(true)
    setError(null)
    setSuccess(null)

    try {
      if (isEnabled) {
        await disablePushNotifications()
        setIsEnabled(false)
        setSuccess("Push notifications disabled")
      } else {
        const enabled = await enablePushNotifications()
        setIsEnabled(enabled)
        if (enabled) {
          setSuccess("Push notifications enabled successfully!")
        } else {
          setError("Failed to enable push notifications. Please check your browser settings.")
        }
      }
    } catch (error) {
      console.error("[v0] Failed to toggle push notifications:", error)
      setError("Failed to update notification settings")
    } finally {
      setIsToggling(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEnabled ? <Bell className="h-5 w-5 text-green-400" /> : <BellOff className="h-5 w-5 text-slate-400" />}
          Push Notifications
        </CardTitle>
        <CardDescription>Get instant notifications for friend requests, matches, and more</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 bg-green-500/10">
            <Check className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{isEnabled ? "Notifications Enabled" : "Notifications Disabled"}</p>
            <p className="text-sm text-slate-400">
              {isEnabled
                ? "You'll receive push notifications for important updates"
                : "Enable to get notified about friend requests and matches"}
            </p>
          </div>

          <Button
            onClick={handleToggle}
            disabled={isToggling}
            variant={isEnabled ? "destructive" : "default"}
            className={isEnabled ? "" : "bg-purple-600 hover:bg-purple-700"}
          >
            {isToggling ? "Updating..." : isEnabled ? "Disable" : "Enable"}
          </Button>
        </div>

        {!isEnabled && (
          <div className="text-sm text-slate-500 space-y-1">
            <p>Push notifications help you stay connected by alerting you when:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Someone sends you a friend request</li>
              <li>You have a mutual movie match</li>
              <li>Someone likes or comments on your lists</li>
              <li>You receive new recommendations</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
