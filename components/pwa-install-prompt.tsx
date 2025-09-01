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
    console.log("[v0] PWA Install Prompt component mounted on client")

    const checkIfInstalled = () => {
      // Check if app is already installed
      if (window.matchMedia("(display-mode: standalone)").matches) {
        console.log("[v0] App detected as installed via display-mode")
        return true
      }
      // Check for iOS standalone mode
      if (window.navigator.standalone === true) {
        console.log("[v0] App detected as installed via iOS standalone")
        return true
      }
      // Check for Android TWA
      if (document.referrer.includes("android-app://")) {
        console.log("[v0] App detected as installed via Android TWA")
        return true
      }
      console.log("[v0] App not detected as installed")
      return false
    }

    if (checkIfInstalled()) {
      setIsInstalled(true)
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("[v0] beforeinstallprompt event fired")
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Check if prompt was recently dismissed
      const dismissed = localStorage.getItem("pwa-prompt-dismissed")
      if (dismissed) {
        const dismissedTime = Number.parseInt(dismissed)
        const dayInMs = 24 * 60 * 60 * 1000
        const timeSinceDismissed = Date.now() - dismissedTime
        console.log("[v0] Prompt was dismissed", timeSinceDismissed / 1000 / 60, "minutes ago")
        if (timeSinceDismissed < dayInMs) {
          console.log("[v0] Prompt dismissed recently, not showing")
          return
        }
      }

      console.log("[v0] Showing prompt via beforeinstallprompt")
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    const detectMobile = () => {
      const userAgent = navigator.userAgent
      const platform = navigator.platform

      // Enhanced iOS detection
      const isIOS =
        /iPad|iPhone|iPod/.test(userAgent) ||
        (platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
        /iPhone|iPad|iPod|iOS/.test(userAgent) ||
        (userAgent.includes("Safari") && userAgent.includes("Mobile"))

      const isAndroid = /Android/.test(userAgent)
      const isInStandaloneMode = window.navigator.standalone
      const isMobile = isIOS || isAndroid || /Mobile|Tablet/.test(userAgent)

      console.log("[v0] Enhanced mobile detection:", {
        isIOS,
        isAndroid,
        isMobile,
        isInStandaloneMode,
        userAgent,
        platform,
        maxTouchPoints: navigator.maxTouchPoints,
      })

      return { isIOS, isAndroid, isMobile, isInStandaloneMode }
    }

    const { isIOS, isMobile, isInStandaloneMode } = detectMobile()

    if ((isIOS || isMobile) && !isInStandaloneMode) {
      // Check if prompt was recently dismissed
      const dismissed = localStorage.getItem("pwa-prompt-dismissed")
      if (dismissed) {
        const dismissedTime = Number.parseInt(dismissed)
        const dayInMs = 24 * 60 * 60 * 1000
        const timeSinceDismissed = Date.now() - dismissedTime
        console.log("[v0] Mobile prompt was dismissed", timeSinceDismissed / 1000 / 60, "minutes ago")
        if (timeSinceDismissed < dayInMs) {
          console.log("[v0] Mobile prompt dismissed recently, not showing")
          return
        }
      }

      console.log("[v0] Mobile device detected, showing prompt after 500ms")
      setTimeout(() => {
        console.log("[v0] Showing mobile prompt now")
        setShowPrompt(true)
      }, 500)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    console.log("[v0] Install button clicked")
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log("[v0] User choice:", outcome)

      if (outcome === "accepted") {
        setDeferredPrompt(null)
        setShowPrompt(false)
      }
    }
  }

  const handleDismiss = () => {
    console.log("[v0] Prompt dismissed by user")
    setShowPrompt(false)
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString())
  }

  console.log("[v0] PWA Prompt render state:", {
    isInstalled,
    showPrompt,
    hasDeferredPrompt: !!deferredPrompt,
    isClient,
  })

  if (!isClient || isInstalled || !showPrompt) return null

  const isIOS =
    typeof window !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
      /iPhone|iPad|iPod|iOS/.test(navigator.userAgent))

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-slate-900 border border-purple-500/20 rounded-lg p-4 shadow-lg animate-in slide-in-from-bottom-2">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Download className="h-6 w-6 text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm">Install Reel Friends</h3>
          <p className="text-slate-300 text-xs mt-1">
            {isIOS
              ? "Tap the Share button (⬆️) and select 'Add to Home Screen'"
              : "Install our app for the best experience - works offline too!"}
          </p>
          {!isIOS && deferredPrompt && (
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
