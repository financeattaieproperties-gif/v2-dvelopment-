# Rebuild Android Sales for V2 testing

Target: `https://website.attaieproperties.com/staff-api/v1`. Version: 2.0.1, version code 2.

From repository root, run `npm run build:sales-android`. This compiles current staff source with preview disabled, copies the Firebase public web identifier from the checked-in public configuration (or `VITE_STAFF_FIREBASE_API_KEY`), and refreshes both `www/` and `app/src/main/assets/www/`. It never loads `.env.local` or reuses the website build.

Open `sales-android/` in Android Studio, select Java 17 or Android Studio's bundled JBR, install SDK 35, and sync Gradle. Then build the debug variant, or run from this directory:

```powershell
.\gradlew.bat assembleDebug
```

The installable testing APK is `app/build/outputs/apk/debug/AttaieSalesCRM-debug.apk`. Its application ID has `.debug` suffix. It can coexist with a distribution release. The testing build uses separate server preferences so an older production endpoint is not inherited.

Release builds no longer sign with the debug key. Use Android Studio's signed bundle/APK wizard or supply these process environment variables privately: `ATTAIE_SIGNING_STORE_FILE`, `ATTAIE_SIGNING_STORE_PASSWORD`, `ATTAIE_SIGNING_KEY_ALIAS`, and `ATTAIE_SIGNING_KEY_PASSWORD`. Never commit the keystore or its passwords. Without these, the release output is unsigned. Use the existing distribution keystore when replacing a previously installed release.

Gradle defaults to V2 testing. A future authorized endpoint change can use `-PstaffApiBaseUrl=https://YOUR_HOST/staff-api/v1`; rebuild the web assets for the same endpoint before distributing. This delivery's web builder deliberately fixes the endpoint to V2 testing.

Before distributing, test on a physical device: Firebase email/password sign-in, session expiry, branch/role restrictions, leads, offline snapshots, camera/gallery upload, calls, and biometric unlock. A successful APK build does not prove hosted API or device behavior.
