#!/bin/bash

echo "🚀 Deploying Reel Friends to iOS App Store..."

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ iOS deployment requires macOS"
    exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode is required for iOS deployment"
    exit 1
fi

# Build web app
echo "📦 Building web application..."
npm run build

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync ios

# Open Xcode for manual build and upload
echo "🍎 Opening Xcode for manual build and upload..."
echo "Next steps in Xcode:"
echo "1. Select your development team"
echo "2. Archive the project (Product > Archive)"
echo "3. Upload to App Store Connect"
echo "4. Complete metadata in App Store Connect"
echo "5. Submit for review"

npx cap open ios
