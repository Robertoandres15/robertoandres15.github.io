import { Capacitor } from "@capacitor/core"
import { StatusBar, Style } from "@capacitor/status-bar"
import { Haptics, ImpactStyle } from "@capacitor/haptics"
import { App } from "@capacitor/app"
import { Keyboard } from "@capacitor/keyboard"

export const isMobile = () => Capacitor.isNativePlatform()

export const initializeMobileFeatures = async () => {
  if (!isMobile()) return

  try {
    // Configure status bar
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: "#1e293b" })

    // Handle app state changes
    App.addListener("appStateChange", ({ isActive }) => {
      console.log("[v0] App state changed. Active:", isActive)
    })

    // Handle keyboard events
    Keyboard.addListener("keyboardWillShow", () => {
      document.body.classList.add("keyboard-open")
    })

    Keyboard.addListener("keyboardWillHide", () => {
      document.body.classList.remove("keyboard-open")
    })
  } catch (error) {
    console.error("[v0] Error initializing mobile features:", error)
  }
}

export const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Medium) => {
  if (!isMobile()) return

  try {
    await Haptics.impact({ style })
  } catch (error) {
    console.error("[v0] Error triggering haptic:", error)
  }
}

export const setStatusBarStyle = async (isDark: boolean) => {
  if (!isMobile()) return

  try {
    await StatusBar.setStyle({
      style: isDark ? Style.Dark : Style.Light,
    })
  } catch (error) {
    console.error("[v0] Error setting status bar style:", error)
  }
}

export const hideKeyboard = async () => {
  if (!isMobile()) return

  try {
    await Keyboard.hide()
  } catch (error) {
    console.error("[v0] Error hiding keyboard:", error)
  }
}
