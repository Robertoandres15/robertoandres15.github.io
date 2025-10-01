# Mobile Deployment Guide for Reel Friends

## Quick Start

1. **Setup mobile platforms** (first time only):
   \`\`\`bash
   npm run mobile:setup
   \`\`\`

2. **Build and open in IDE**:
   \`\`\`bash
   npm run mobile:android  # Opens Android Studio
   npm run mobile:ios      # Opens Xcode (macOS only)
   \`\`\`

3. **Run on device**:
   \`\`\`bash
   npm run mobile:run:android  # Run on Android device
   npm run mobile:run:ios      # Run on iOS device
   \`\`\`

## Prerequisites

### Android Development
- **Android Studio** with Android SDK
- **Java Development Kit (JDK) 17+**
- Android device or emulator

### iOS Development (macOS only)
- **Xcode 14+**
- **iOS Simulator** or physical iOS device
- Apple Developer account (for device testing)

## Development Workflow

### 1. Make Changes
Edit your Next.js app as usual. All your existing code works in the mobile app.

### 2. Build and Test
\`\`\`bash
npm run mobile:build    # Build and sync
npm run mobile:android  # Test on Android
npm run mobile:ios      # Test on iOS
\`\`\`

### 3. Native Features
Your app already includes:
- ✅ Status bar configuration
- ✅ Keyboard handling
- ✅ Haptic feedback
- ✅ App state management
- ✅ Safe area support

## App Store Deployment

### Android (Google Play Store)

1. **Build release APK**:
   \`\`\`bash
   cd android
   ./gradlew assembleRelease
   \`\`\`

2. **Sign the APK** (configure keystore in Android Studio)

3. **Upload to Google Play Console**

### iOS (Apple App Store)

1. **Archive in Xcode**:
   - Product → Archive
   - Upload to App Store Connect

2. **Configure app metadata** in App Store Connect

3. **Submit for review**

## Troubleshooting

### Common Issues

**Build fails**: Ensure Next.js builds successfully first:
\`\`\`bash
npm run build
\`\`\`

**Android Studio won't open**: Check Android SDK path in Android Studio settings

**iOS build fails**: Ensure Xcode command line tools are installed:
\`\`\`bash
xcode-select --install
\`\`\`

### Environment Variables
Your Supabase and other environment variables work automatically in the mobile app. No additional configuration needed.

### Native Plugins
Current plugins installed:
- `@capacitor/core` - Core functionality
- `@capacitor/status-bar` - Status bar control
- `@capacitor/keyboard` - Keyboard handling
- `@capacitor/haptics` - Haptic feedback
- `@capacitor/app` - App lifecycle
- `@capacitor/camera` - Camera access (ready to use)

## Performance Tips

1. **Images**: Already optimized with `unoptimized: true`
2. **Static export**: Configured for optimal mobile performance
3. **PWA features**: Your app works offline and can be installed
4. **Native performance**: WebView with native plugin access

## Support

- **Capacitor docs**: https://capacitorjs.com/docs
- **Next.js static export**: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
- **Supabase mobile**: https://supabase.com/docs/guides/getting-started/tutorials/with-ionic-react
