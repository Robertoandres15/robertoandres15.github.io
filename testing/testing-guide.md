# Native App Testing Guide

## Overview
This guide covers testing procedures for the Reel Friends native mobile app across iOS and Android platforms.

## Pre-Testing Setup

### Development Environment
\`\`\`bash
# Install dependencies
npm install

# Build web app
npm run build

# Sync with native platforms
npx cap sync
\`\`\`

### Device Setup
1. **iOS**: Xcode with iOS Simulator or physical device
2. **Android**: Android Studio with emulator or physical device
3. **Network**: Test on both WiFi and cellular connections

## Automated Testing

### Run Basic Tests
\`\`\`typescript
import { appTester } from '@/lib/testing-utils'

// Run all basic tests
const results = await appTester.runBasicTests()
console.log(appTester.generateReport())
\`\`\`

### Performance Testing
\`\`\`typescript
import { performanceMonitor } from '@/lib/performance'

// Measure app launch time
performanceMonitor.startMeasurement('app-launch')
// ... app initialization
performanceMonitor.endMeasurement('app-launch')
\`\`\`

## Manual Testing Checklist

### Core Functionality
- [ ] User registration and login
- [ ] Profile creation and editing
- [ ] Friend connections and invites
- [ ] Movie search and discovery
- [ ] Wishlist creation and management
- [ ] Social feed interactions
- [ ] Settings and preferences

### Mobile-Specific Features
- [ ] Camera integration for profile photos
- [ ] Haptic feedback on interactions
- [ ] Status bar styling
- [ ] Keyboard handling
- [ ] Native navigation
- [ ] App state management (background/foreground)

### Platform-Specific Testing

#### iOS Testing
- [ ] App Store guidelines compliance
- [ ] Human Interface Guidelines adherence
- [ ] Privacy manifest accuracy
- [ ] TestFlight distribution
- [ ] Various iPhone/iPad sizes
- [ ] iOS version compatibility (14.0+)

#### Android Testing
- [ ] Material Design compliance
- [ ] Google Play policies adherence
- [ ] Various screen sizes and densities
- [ ] Android version compatibility (API 24+)
- [ ] Back button behavior
- [ ] Hardware button handling

### Performance Testing
- [ ] App launch time < 3 seconds
- [ ] Page transitions < 500ms
- [ ] API responses < 2 seconds
- [ ] Image loading < 1 second
- [ ] Memory usage monitoring
- [ ] Battery usage optimization

### Network Testing
- [ ] Offline functionality
- [ ] Poor network conditions
- [ ] Network switching (WiFi to cellular)
- [ ] API error handling
- [ ] Retry mechanisms

### Security Testing
- [ ] Data encryption in transit
- [ ] Secure storage of credentials
- [ ] API authentication
- [ ] Permission handling
- [ ] Privacy policy compliance

## Device Testing Matrix

### iOS Devices
| Device | iOS Version | Screen Size | Status |
|--------|-------------|-------------|---------|
| iPhone 12 | 15.0+ | 6.1" | ⏳ |
| iPhone 13 | 15.0+ | 6.1" | ⏳ |
| iPhone 14 | 16.0+ | 6.1" | ⏳ |
| iPad Air | 15.0+ | 10.9" | ⏳ |
| iPad Pro | 15.0+ | 12.9" | ⏳ |

### Android Devices
| Device | Android Version | Screen Size | Status |
|--------|-----------------|-------------|---------|
| Pixel 6 | 12+ | 6.4" | ⏳ |
| Galaxy S21 | 11+ | 6.2" | ⏳ |
| OnePlus 9 | 11+ | 6.55" | ⏳ |
| Tablet | 10+ | 10.1" | ⏳ |

## Bug Reporting

### Bug Report Template
\`\`\`
**Title**: Brief description of the issue

**Environment**:
- Platform: iOS/Android
- Device: [Device model]
- OS Version: [Version number]
- App Version: [Version number]

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Result**: What should happen

**Actual Result**: What actually happens

**Screenshots/Videos**: [Attach if applicable]

**Additional Notes**: Any other relevant information
\`\`\`

## Performance Monitoring

### Key Metrics
- App launch time
- Memory usage
- CPU usage
- Network requests
- Crash rate
- User engagement

### Monitoring Tools
- Built-in performance monitor
- Native platform analytics
- Crash reporting services
- User feedback systems

## Release Testing

### Pre-Release Checklist
- [ ] All automated tests pass
- [ ] Manual testing complete
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] App store compliance verified
- [ ] Beta testing feedback addressed

### Post-Release Monitoring
- [ ] Crash reports monitoring
- [ ] Performance metrics tracking
- [ ] User feedback collection
- [ ] App store reviews monitoring
- [ ] Usage analytics review
