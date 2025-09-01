#!/bin/bash

echo "Building Reel Friends for Android..."

# Build the web app
npm run build

# Sync with Capacitor
npx cap sync android

# Build the Android app
cd android
./gradlew assembleDebug

echo "Android build complete! APK located at: android/app/build/outputs/apk/debug/app-debug.apk"
