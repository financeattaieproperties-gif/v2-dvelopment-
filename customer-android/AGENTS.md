# Instructions for future work — Customer Android V2

## Scope and boundaries
- Work ONLY inside `customer-android/` for the customer-facing 24-screen Android app unless explicitly asked otherwise.
- Do not merge or modify `sales-android/`, `apps/staff/`, or website source as part of customer-app refactoring.
- Treat `customer-android/` as an independent Android Studio root with its own package, Gradle files, resources, and release process.
- Preserve all 24 screen routes and the existing app state/ViewModel contract.

## Current implementation
- The full uploaded 24-screen Kotlin source is at `app/src/main/java/com/attaieproperties/v2/MainActivity.kt`.
- The source is intentionally kept together first to preserve its original private top-level functions. Refactor into separate files only after establishing compilation, changing visibility and imports as needed.
- `MainActivity` uses `UnconfiguredAttaieRepository()`, which intentionally fails closed. Do not claim real login, listings, inquiry submission, or uploads work until an authenticated production backend implementation is added and tested.
- Official logo image must be supplied separately at `app/src/main/res/drawable/attaie_logo.png`; change `logoResId = null` to the drawable only once that asset exists.

## Next steps
1. Run Android Studio Gradle sync and `assembleDebug` (Java 17, SDK 35), fixing compiler errors with minimal changes.
2. Add Gradle wrapper if missing, using a compatible local Gradle installation. Do not invent wrapper JAR bytes.
3. Refactor into `screens/`, `navigation/`, `data/`, `viewmodel/`, and `ui/theme/` while maintaining all routes and behavior.
4. Implement backend adapter with secure authentication and server-side permission checks. Never use permissive demo login for production.
5. Add real logo, launcher icons, locale resources, unit/UI tests, and release signing via private credentials.
6. Test 24 routes, RTL/LTR, login/verification, listings, agencies, inquiries, errors, and physical-device behavior.

## Safety and Git
- Do not commit API secrets, service-account keys, signing keys, or customer personal data.
- Work on a feature branch and review changes before merging into main.
- Report build/test status accurately; scaffold presence does not prove a successful build.
