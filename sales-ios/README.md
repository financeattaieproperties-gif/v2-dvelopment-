> Current V2 rebuild instructions: [REBUILD-V2.md](./REBUILD-V2.md). Earlier commands below are historical; use the current guide.

# Attaie Sales CRM — iOS Application (`sales-ios/`)

The Sales Agent workspace (`af.attaieproperties.sales`) supports **two iPhone/iPad installation methods** backed by the exact same `/staff-api/v1/*` backend and Firebase Authentication:

---

## Option 1: Instant iPhone / iPad Installation (Recommended for Day-2 Field Rollout)

No Mac, Xcode, or Apple Developer approval wait required:

1. Open **Safari** on the sales agent's iPhone or iPad.
2. Navigate to **`https://attaieproperties.com/sales/`** (or `https://www.attaieproperties.com/sales/`).
3. Tap the **Share** icon → **Add to Home Screen** → **Add**.
4. Launch **Attaie Sales** from the Home Screen:
   - Opens full-screen without browser bars (`display: standalone`, Alabaster `#F7F8FA` / `#FFFFFF`).
   - Uses Apple `apple-touch-icon.png` icon and iCloud Keychain / Face ID password autofill.
   - Caches loaded leads/dashboard snapshots offline via Workbox Service Worker.
   - Supports one-tap native Phone calling (`tel:`) and camera/photo-library uploads for Buyer 3×4 & Tazkira photos on deal closure.

> **iOS Safari Push Notification Note**: On iOS 16.4+, browser notifications work automatically **only after** the app is added to the Home Screen and launched from the Home Screen icon, then tapped once to allow Notifications.

---

## Option 2: Native `.ipa` / TestFlight / App Store Build (macOS + Xcode Required)

`sales-ios/` shares the compiled offline-first web bundle built by `npm run build:sales-android` into `sales-android/www/`.

### Prerequisites
- macOS with Xcode 15+ installed
- Apple Developer account (for TestFlight / Ad-Hoc / App Store distribution)
- Node.js 20+ and CocoaPods (`sudo gem install cocoapods`)

### Build Steps
1. From the repository root, compile the mobile web bundle:
   ```bash
   npm run build:sales-android
   ```
   *(Already targets `https://attaieproperties.com/staff-api/v1` by default; override with `VITE_STAFF_API_BASE_URL` if needed.)*
2. Generate the native Xcode workspace inside `sales-ios/`:
   ```bash
   cd sales-ios
   npm install
   npx cap add ios
   npx cap sync ios
   npx cap open ios
   ```
3. In **Xcode → Signing & Capabilities**:
   - Select your Apple Developer Team & Bundle Identifier (`af.attaieproperties.sales`).
   - Enable **Push Notifications** and **Background Modes → Remote notifications** (if shipping APNs).
4. In **`App/App/Info.plist`**, add the required iOS privacy usage strings:
   - `NSCameraUsageDescription`: `"Capture buyer 3x4 photos and Tazkira documents during deal closure."`
   - `NSPhotoLibraryUsageDescription`: `"Select buyer photos and Tazkira documents from your photo library."`
   - `NSFaceIDUsageDescription`: `"Unlock Attaie Sales CRM quickly with Face ID."`
5. Select **Product → Archive** in Xcode to export an Ad-Hoc `.ipa` or upload to **TestFlight** for your sales agents.
