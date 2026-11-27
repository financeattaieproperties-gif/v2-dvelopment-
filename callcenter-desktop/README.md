> Current V2 rebuild instructions: [REBUILD-V2.md](./REBUILD-V2.md). Earlier commands below are historical; use the current guide.

# Attaie Call Center — Windows Desktop App (`.exe`)

Installable Windows PC application for **Call Center Agents** (`Attaie Call Center`).

## Key Capabilities

- **Instant Local Workspace Bundle (`www/`)**: Bundles the compiled Call Center Workspace (`/callcenter/`, 24h Follow-ups, Call Drafts, Lead Intake, Customers, Pre-Sale Projects) inside the `.exe` for immediate launch.
- **Live Backend Connection (`/staff-api/v1`)**: Connects directly to the V2 PHP/MySQL backend (`https://attaieproperties.com/staff-api/v1` by default, with automatic fallback detection for `https://website.attaieproperties.com/staff-api/v1`).
- **Persistent Session & CSRF Protection**: Maintains authenticated staff sessions (`attaie_staff_session`) and CSRF tokens across app restarts.
- **Built-in Server Switcher (`Ctrl+Shift+S` or Sign-In Pill)**: Switch between `https://attaieproperties.com`, `https://website.attaieproperties.com`, `https://www.attaieproperties.com`, or local dev (`http://127.0.0.1:8891`) and test the connection live.

## Build the Windows `.exe` Installers

```bash
node scripts/build-public-staff.mjs
node scripts/build-desktop-apps.mjs
cd callcenter-desktop
npm run pack:win
```

Output installers appear inside `callcenter-desktop/release/`:
- **`Attaie Call Center Setup 2.0.0.exe`** — Standard Windows NSIS Installer (creates Desktop & Start Menu shortcuts)
- **`Attaie Call Center 2.0.0.exe`** — Single-file Portable `.exe` (no installation needed)
