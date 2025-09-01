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

  useEffect(() => {
    const checkIfInstalled = () => {
      // Check if app is already installed
      if (window.matchMedia("(display-mode: standalone)").matches) {
        return true
      }
      // Check for iOS standalone mode
      if (window.navigator.standalone === true) {
        return true
      }
      // Check for Android TWA
      if (document.referrer.includes("android-app://")) {
        return true
      }
      return false
    }

    if (checkIfInstalled()) {
      setIsInstalled(true)
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Check if prompt was recently dismissed
      const dismissed = localStorage.getItem("pwa-prompt-dismissed")
      if (dismissed) {
        const dismissedTime = Number.parseInt(dismissed)
        const dayInMs = 24 * 60 * 60 * 1000
        if (Date.now() - dismissedTime < dayInMs) {
          return
        }
      }

      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    const detectMobile = () => {
      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
      const isAndroid = /Android/.test(navigator.userAgent)
      const isInStandaloneMode = window.navigator.standalone

      return { isIOS, isAndroid, isInStandaloneMode }
    }

    const { isIOS, isInStandaloneMode } = detectMobile()

    if (isIOS && !isInStandaloneMode) {
      // Check if prompt was recently dismissed
      const dismissed = localStorage.getItem("pwa-prompt-dismissed")
      if (dismissed) {
        const dismissedTime = Number.parseInt(dismissed)
        const dayInMs = 24 * 60 * 60 * 1000
        if (Date.now() - dismissedTime < dayInMs) {
          return
        }
      }

      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        setDeferredPrompt(null)
        setShowPrompt(false)
      }
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString())
  }

  if (isInstalled || !showPrompt) return null

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)

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
