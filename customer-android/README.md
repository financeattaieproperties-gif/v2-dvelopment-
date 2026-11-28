# Attaie Properties V2 — Customer Android app

Independent native Kotlin + Jetpack Compose Android Studio project, alongside but **not merged into** `sales-android/`.

## Open
Open the `customer-android/` folder as a project in Android Studio. Use JDK 17 and Android SDK 35. Sync Gradle, then run `assembleDebug` from Android Studio or a locally installed Gradle. The Gradle wrapper files have not yet been added.

## Current status
- All 24 original screen functions and navigation are preserved in `app/src/main/java/com/attaieproperties/v2/MainActivity.kt`.
- Build and functional tests **have not been run**; fixes may be required.
- Backend remains unconfigured and deliberately does not authenticate real users.
- Official logo asset is not yet present; the app passes a null logo resource ID.
- No files in `sales-android/` were changed.

Read `AGENTS.md` before continuing development.
