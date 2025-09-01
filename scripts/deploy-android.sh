#!/bin/bash

echo "🚀 Deploying Reel Friends to Google Play Store..."

# Check if Android SDK is available
if ! command -v adb &> /dev/null; then
    echo "❌ Android SDK is required for Android deployment"
    exit 1
fi

# Build web app
echo "📦 Building web application..."
npm run build

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync android

# Build release bundle
echo "🏗️ Building release bundle..."
cd android
./gradlew bundleRelease

if [ $? -eq 0 ]; then
    echo "✅ Android App Bundle built successfully!"
    echo "📁 Location: android/app/build/outputs/bundle/release/app-release.aab"
    echo ""
    echo "Next steps:"
    echo "1. Upload app-release.aab to Google Play Console"
    echo "2. Complete store listing information"
    echo "3. Set up content rating and pricing"
    echo "4. Submit for review"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
