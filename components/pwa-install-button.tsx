"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Smartphone, Monitor } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    setIsClient(true)
    console.log("[v0] PWA Install Button - Starting initialization")

    // Check if app is already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    const isInStandaloneMode = (window.navigator as any).standalone === true
    const appInstalled = isStandalone || isInStandaloneMode

    if (appInstalled) {
      console.log("[v0] PWA Install Button - App already installed")
      setIsInstalled(true)
      return
    }

    // Device detection
    const userAgent = navigator.userAgent
    const platform = navigator.platform
    const maxTouchPoints = navigator.maxTouchPoints || 0

    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1)
    const isDesktopDevice = !isIOSDevice && !/Android|Mobile/.test(userAgent)

    setIsIOS(isIOSDevice)
    setIsDesktop(isDesktopDevice)

    console.log("[v0] PWA Install Button - Device detection:", {
      userAgent,
      platform,
      maxTouchPoints,
      isIOSDevice,
      isDesktopDevice,
      isAppInstalled: appInstalled,
    })

    // Check service worker registration
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        console.log("[v0] PWA Install Button - Service worker registrations:", registrations.length)
      })
    }

    // Always show install button - we'll handle different scenarios in the click handler
    setCanInstall(true)

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("[v0] PWA Install Button - beforeinstallprompt event received")
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Check if beforeinstallprompt fired after a delay
    setTimeout(() => {
      if (!deferredPrompt) {
        console.log("[v0] PWA Install Button - beforeinstallprompt event did not fire")
      }
    }, 2000)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    console.log("[v0] PWA Install Button - Install button clicked")
    console.log("[v0] PWA Install Button - Has deferred prompt:", !!deferredPrompt)

    if (isIOS) {
      // For iOS, show instructions
      alert(
        "To install this app on your iPhone/iPad:\n\n1. Tap the Share button (⬆️) in Safari\n2. Scroll down and tap 'Add to Home Screen'\n3. Tap 'Add' to confirm\n\nThe app will appear on your home screen like a native app!",
      )
      return
    }

    if (deferredPrompt) {
      try {
        console.log("[v0] PWA Install Button - Prompting for install")
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        console.log("[v0] PWA Install Button - User choice:", outcome)

        if (outcome === "accepted") {
          setDeferredPrompt(null)
          setCanInstall(false)
        }
      } catch (error) {
        console.error("[v0] PWA Install Button - Error during install:", error)
      }
    } else {
      // Fallback instructions for different browsers
      if (isDesktop) {
        alert(
          "To install this app on your computer:\n\n" +
            "Chrome/Edge:\n" +
            "1. Click the three dots menu (⋮)\n" +
            "2. Look for 'Install Reel Friends' or 'Apps'\n" +
            "3. Click 'Install'\n\n" +
            "Firefox:\n" +
            "1. Look for the install icon in the address bar\n" +
            "2. Click it and follow the prompts\n\n" +
            "Safari:\n" +
            "1. Go to File menu\n" +
            "2. Select 'Add to Dock'\n\n" +
            "If you don't see these options, try refreshing the page or check if your browser supports PWA installation.",
        )
      } else {
        // Mobile fallback
        alert(
          "To install this app:\n\n1. Open your browser menu\n2. Look for 'Install App' or 'Add to Home Screen'\n3. Follow the prompts to install\n\nIf you don't see this option, try using Chrome or Safari.",
        )
      }
    }
  }

  // Don't render on server or if conditions not met
  if (!isClient || isInstalled || !canInstall) return null

  const getIcon = () => {
    if (isIOS) return <Smartphone className="mr-2 h-5 w-5" />
    if (isDesktop) return <Monitor className="mr-2 h-5 w-5" />
    return <Download className="mr-2 h-5 w-5" />
  }

  const getButtonText = () => {
    if (isIOS) return "Install App"
    if (isDesktop) return "Install App"
    return "Install App"
  }

  return (
    <Button
      onClick={handleInstallClick}
      variant="outline"
      size="lg"
      className="bg-slate-800/80 border-slate-600 text-slate-200 hover:bg-slate-700/80 hover:border-slate-500 text-lg px-8 py-6 backdrop-blur-sm font-semibold shadow-lg"
    >
      {getIcon()}
      {getButtonText()}
    </Button>
  )
}
