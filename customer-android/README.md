# Attaie Properties — Customer Android App

This directory is reserved for the **customer-facing Attaie Properties V2 Android application** (24-screen Kotlin / Jetpack Compose project).

## Project isolation

- This is a **separate Android Studio project**, independent of the existing sibling `sales-android/` project.
- Do not copy, merge, or overwrite Sales Agent application source, Gradle files, package identifiers, or assets.
- The customer app will use its own `settings.gradle.kts`, `build.gradle.kts`, `app/`, manifest, resources, and application ID.
- Backend integration must be reviewed and tested independently. Do not assume the Sales Agent API or authentication roles are interchangeable.

## Status

Folder initialized. The customer app's Kotlin source has **not yet been split, installed, compiled, or tested** in this repository. Do not treat this README as a complete Android Studio project.
