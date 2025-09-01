"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    console.log("[v0] PWA Install Prompt - Starting initialization")

    // Check if app is already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    const isInStandaloneMode = (window.navigator as any).standalone === true
    const appInstalled = isStandalone || isInStandaloneMode

    console.log("[v0] PWA Install Prompt - App installed check:", {
      isStandalone,
      isInStandaloneMode,
      isAppInstalled: appInstalled,
    })

    if (appInstalled) {
      setIsInstalled(true)
      return
    }

    // Device detection
    const userAgent = navigator.userAgent
    const platform = navigator.platform
    const maxTouchPoints = navigator.maxTouchPoints || 0
    const touchSupport = "ontouchstart" in window || maxTouchPoints > 0
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height
    const isMobileScreen = screenWidth <= 768 || screenHeight <= 768

    const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1)
    const isAndroid = /Android/.test(userAgent)
    const isMobile = isIOS || isAndroid || touchSupport || isMobileScreen

    console.log("[v0] PWA Install Prompt - Device detection:", {
      userAgent,
      platform,
      maxTouchPoints,
      touchSupport,
      screenWidth,
      screenHeight,
      isMobileScreen,
      isIOS,
      isAndroid,
      isMobile,
    })

    // Check if dismissed recently
    const dismissed = localStorage.getItem("pwa-prompt-dismissed")
    if (dismissed) {
      const dismissedTime = Number.parseInt(dismissed)
      const dayInMs = 24 * 60 * 60 * 1000
      if (Date.now() - dismissedTime < dayInMs) {
        console.log("[v0] PWA Install Prompt - Recently dismissed, not showing")
        return
      }
    }

    console.log("[v0] PWA Install Prompt - Device detected, showing prompt after 1000ms")

    const timer = setTimeout(() => {
      console.log("[v0] PWA Install Prompt - Showing PWA prompt now")
      setShowPrompt(true)
    }, 1000)

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("[v0] PWA Install Prompt - beforeinstallprompt event received")
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      clearTimeout(timer)
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    console.log("[v0] PWA Install Prompt - Install button clicked")
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log("[v0] PWA Install Prompt - User choice:", outcome)

      if (outcome === "accepted") {
        setDeferredPrompt(null)
        setShowPrompt(false)
      }
    }
  }

  const handleDismiss = () => {
    console.log("[v0] PWA Install Prompt - Dismissed by user")
    setShowPrompt(false)
    // Hide for 24 hours
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString())
  }

  // Don't render on server or if conditions not met
  if (!isClient || isInstalled || !showPrompt) return null

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 bg-slate-900 border border-purple-500/20 rounded-lg p-4 shadow-lg"
      style={{
        position: "fixed",
        bottom: "16px",
        left: "16px",
        right: "16px",
        zIndex: 9999,
        backgroundColor: "#0f172a",
        border: "1px solid rgba(168, 85, 247, 0.2)",
        borderRadius: "8px",
        padding: "16px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Download className="h-6 w-6 text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm">Install Reel Friends</h3>
          <p className="text-slate-300 text-xs mt-1">
            {isIOS ? "Tap the share button and select 'Add to Home Screen'" : "Install our app for the best experience"}
          </p>
          {!isIOS && (
            <Button
              onClick={handleInstallClick}
              className="mt-2 bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1 h-auto"
            >
              Install App
            </Button>
          )}
        </div>
        <button onClick={handleDismiss} className="flex-shrink-0 text-slate-400 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
