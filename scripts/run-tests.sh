#!/bin/bash

echo "🧪 Running Reel Friends Native App Tests..."

# Check if we have the required dependencies
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the web app
echo "🏗️ Building web application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Web build failed"
    exit 1
fi

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync

if [ $? -ne 0 ]; then
    echo "❌ Capacitor sync failed"
    exit 1
fi

# Run iOS tests if on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Running iOS tests..."
    
    # Check if iOS simulator is available
    if command -v xcrun &> /dev/null; then
        echo "📱 iOS Simulator available"
        # You can add specific iOS testing commands here
    else
        echo "⚠️ iOS Simulator not available, skipping iOS tests"
    fi
fi

# Run Android tests if Android SDK is available
if command -v adb &> /dev/null; then
    echo "🤖 Running Android tests..."
    
    # Check for connected devices or emulators
    DEVICES=$(adb devices | grep -v "List of devices" | grep -v "^$" | wc -l)
    if [ $DEVICES -gt 0 ]; then
        echo "📱 Android device/emulator detected"
        # You can add specific Android testing commands here
    else
        echo "⚠️ No Android devices detected, skipping device tests"
    fi
else
    echo "⚠️ Android SDK not available, skipping Android tests"
fi

echo "✅ Test setup complete!"
echo ""
echo "Next steps:"
echo "1. Open iOS project: npx cap open ios"
echo "2. Open Android project: npx cap open android"
echo "3. Run manual tests according to testing-guide.md"
echo "4. Monitor performance and error tracking"
