# App Store Deployment Guide

## Prerequisites

### Apple App Store
1. **Apple Developer Account** ($99/year)
2. **Xcode** (latest version)
3. **macOS** for iOS builds
4. **App Store Connect** access

### Google Play Store
1. **Google Play Console** account ($25 one-time fee)
2. **Android Studio** or command line tools
3. **Signing key** for app signing

## iOS Deployment Steps

### 1. Configure Signing
\`\`\`bash
# Open iOS project in Xcode
npx cap open ios

# In Xcode:
# 1. Select your team in Signing & Capabilities
# 2. Ensure Bundle Identifier matches: com.reelfriends.app
# 3. Configure provisioning profiles
\`\`\`

### 2. Build for Release
\`\`\`bash
# Build web app
npm run build

# Sync with Capacitor
npx cap sync ios

# In Xcode:
# 1. Select "Any iOS Device" or connected device
# 2. Product > Archive
# 3. Upload to App Store Connect
\`\`\`

### 3. App Store Connect Setup
1. Create new app in App Store Connect
2. Upload app metadata and screenshots
3. Set pricing and availability
4. Submit for review

## Android Deployment Steps

### 1. Generate Signing Key
\`\`\`bash
# Generate upload key
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload

# Add to android/gradle.properties:
MYAPP_UPLOAD_STORE_FILE=upload-keystore.jks
MYAPP_UPLOAD_KEY_ALIAS=upload
MYAPP_UPLOAD_STORE_PASSWORD=***
MYAPP_UPLOAD_KEY_PASSWORD=***
\`\`\`

### 2. Build Release APK/AAB
\`\`\`bash
# Build web app
npm run build

# Sync with Capacitor
npx cap sync android

# Build release
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
\`\`\`

### 3. Google Play Console Setup
1. Create new app in Google Play Console
2. Upload app bundle (AAB file)
3. Complete store listing
4. Set up content rating and pricing
5. Submit for review

## Required Assets

### App Icons
- iOS: 1024x1024px (App Store)
- Android: 512x512px (Play Store)

### Screenshots
- iOS: Various device sizes (iPhone, iPad)
- Android: Phone and tablet screenshots

### Privacy Policy
- Required for both stores
- Must be accessible via HTTPS
- Include data collection practices

## Compliance Requirements

### iOS App Store
- Follow Human Interface Guidelines
- No private API usage
- Proper permission descriptions
- Age-appropriate content rating

### Google Play Store
- Follow Material Design guidelines
- Target latest Android API level
- Proper permission usage
- Content policy compliance

## Testing Before Submission

1. **TestFlight** (iOS) - Beta testing
2. **Internal Testing** (Android) - Google Play Console
3. Test on multiple devices and OS versions
4. Verify all features work offline/online
5. Test payment flows (if applicable)
