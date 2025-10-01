const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("🚀 Building Reel Friends mobile app...")

try {
  // Build Next.js app for static export
  console.log("📦 Building Next.js app...")
  execSync("npm run build", { stdio: "inherit" })

  // Sync with Capacitor
  console.log("🔄 Syncing with Capacitor...")
  execSync("npx cap sync", { stdio: "inherit" })

  console.log("✅ Mobile app build complete!")
  console.log("")
  console.log("Next steps:")
  console.log("- Android: npx cap open android")
  console.log("- iOS: npx cap open ios")
  console.log("")
  console.log("Or run directly:")
  console.log("- Android: npx cap run android")
  console.log("- iOS: npx cap run ios")
} catch (error) {
  console.error("❌ Build failed:", error.message)
  process.exit(1)
}
