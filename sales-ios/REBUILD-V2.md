# Rebuild iOS Sales for V2 testing

Target: `https://website.attaieproperties.com/staff-api/v1`. Wrapper version: 2.0.1.

The wrapper uses current Sales web assets from `../sales-android/www/`. There is no generated `ios/` project in this checkout. Native archive/signing requires macOS, Xcode, CocoaPods, and your Apple Developer team.

On the Mac, install root dependencies, then:

```bash
cd sales-ios
npm install
npm run build:web
npm run add:ios
npm run sync:ios
npm run open:ios
```

Run `add:ios` only once. Future rebuilds use `sync:ios` and `open:ios`; the sync script automatically refreshes the web bundle first. Builds disable sample preview and use the checked-in public Firebase identifier or `VITE_STAFF_FIREBASE_API_KEY`, without reading `.env.local`.

In Xcode select your signing team, retain bundle identifier `af.attaieproperties.sales`, set build/version higher than your previous distribution, and add privacy descriptions to `App/App/Info.plist` for camera (`NSCameraUsageDescription`), photo library (`NSPhotoLibraryUsageDescription`), and Face ID (`NSFaceIDUsageDescription`) if used. Add push capabilities only if APNs integration is configured. Archive and export through Xcode for TestFlight or your chosen distribution method.

The iOS wrapper has not been compiled, signed, or device-tested on this Windows machine. Verify Firebase sign-in and PHP session cookies on a physical iPhone before distribution; WKWebView cookie behavior requires platform testing. Android's native biometric and battery bridges are not provided by this iOS wrapper. No IPA is included.
