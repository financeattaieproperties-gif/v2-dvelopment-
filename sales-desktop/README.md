> Current V2 rebuild instructions: [REBUILD-V2.md](./REBUILD-V2.md). Earlier commands below are historical; use the current guide.

# Attaie Sales Agent — Windows Desktop App (`.exe`)

Installable Windows PC application for **Sales Agents** (`Attaie Sales Agent`).

## Key Capabilities

- **Instant Local Workspace Bundle (`www/`)**: Bundles the compiled Sales Agent CRM (`/sales/leads`, Follow-ups, Customers, Pre-Sale Projects, Tasks, Offline Outbox) inside the `.exe` for immediate launch and offline resilience.
- **Live Backend Connection (`/staff-api/v1`)**: Connects directly to the V2 PHP/MySQL backend (`https://attaieproperties.com/staff-api/v1` by default, with automatic fallback detection for `https://website.attaieproperties.com/staff-api/v1`).
- **Persistent Session & CSRF Protection**: Maintains authenticated staff sessions (`attaie_staff_session`) and CSRF tokens across app restarts.
- **Built-in Server Switcher (`Ctrl+Shift+S` or Sign-In Pill)**: Switch between `https://attaieproperties.com`, `https://website.attaieproperties.com`, `https://www.attaieproperties.com`, or local dev (`http://127.0.0.1:8891`) and test the connection live.

## Build the Windows `.exe` Installers

```bash
node scripts/build-public-staff.mjs
node scripts/build-desktop-apps.mjs
cd sales-desktop
npm run pack:win
```

Output installers appear inside `sales-desktop/release/`:
- **`Attaie Sales Agent Setup 2.0.0.exe`** — Standard Windows NSIS Installer (creates Desktop & Start Menu shortcuts)
- **`Attaie Sales Agent 2.0.0.exe`** — Single-file Portable `.exe` (no installation needed)
