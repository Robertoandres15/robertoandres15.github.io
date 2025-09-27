const { execSync } = require("child_process")
const fs = require("fs")

console.log("🔧 Setting up mobile development environment...")

try {
  // Check if platforms are already added
  const androidExists = fs.existsSync("android")
  const iosExists = fs.existsSync("ios")

  if (!androidExists) {
    console.log("📱 Adding Android platform...")
    execSync("npx cap add android", { stdio: "inherit" })
  } else {
    console.log("✅ Android platform already exists")
  }

  if (!iosExists) {
    console.log("🍎 Adding iOS platform...")
    execSync("npx cap add ios", { stdio: "inherit" })
  } else {
    console.log("✅ iOS platform already exists")
  }

  // Initial sync
  console.log("🔄 Initial sync...")
  execSync("npx cap sync", { stdio: "inherit" })

  console.log("")
  console.log("✅ Mobile setup complete!")
  console.log("")
  console.log("Development commands:")
  console.log("- npm run build:mobile  # Build and sync")
  console.log("- npx cap open android  # Open Android Studio")
  console.log("- npx cap open ios      # Open Xcode")
  console.log("- npx cap run android   # Run on Android device")
  console.log("- npx cap run ios       # Run on iOS device")
} catch (error) {
  console.error("❌ Setup failed:", error.message)
  console.log("")
  console.log("Make sure you have:")
  console.log("- Android Studio installed (for Android)")
  console.log("- Xcode installed (for iOS, macOS only)")
  process.exit(1)
}
