export const isMobile = () => {
  try {
    // Check if we're in a browser environment first
    if (typeof window === "undefined") return false

    // Dynamic import check for Capacitor
    return window.Capacitor?.isNativePlatform?.() || false
  } catch (error) {
    return false
  }
}

export const initializeMobileFeatures = async () => {
  if (!isMobile()) return

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar")
    const { App } = await import("@capacitor/app")
    const { Keyboard } = await import("@capacitor/keyboard")

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

export const triggerHaptic = async (style: "LIGHT" | "MEDIUM" | "HEAVY" = "MEDIUM") => {
  if (!isMobile()) return

  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics")
    const hapticStyle =
      style === "LIGHT" ? ImpactStyle.Light : style === "HEAVY" ? ImpactStyle.Heavy : ImpactStyle.Medium
    await Haptics.impact({ style: hapticStyle })
  } catch (error) {
    console.error("[v0] Error triggering haptic:", error)
  }
}

export const setStatusBarStyle = async (isDark: boolean) => {
  if (!isMobile()) return

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar")
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
    const { Keyboard } = await import("@capacitor/keyboard")
    await Keyboard.hide()
  } catch (error) {
    console.error("[v0] Error hiding keyboard:", error)
  }
}
