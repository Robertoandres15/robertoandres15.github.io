#!/bin/bash

echo "Building Reel Friends for iOS..."

# Build the web app
npm run build

# Sync with Capacitor
npx cap sync ios

# Open Xcode for manual build and signing
npx cap open ios

echo "iOS project opened in Xcode. Build and sign manually for App Store submission."
