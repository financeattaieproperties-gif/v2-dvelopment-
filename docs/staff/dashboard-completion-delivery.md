# V2 Staff Dashboards & Production Deployment Guide (`attaieproperties.com`)

Target: `https://attaieproperties.com` (with `--production`) or `https://website.attaieproperties.com` (staging).
Staff Dashboards authenticate via **MySQL `password_hash` / `password_verify()` + PHP sessions** (no Firebase Auth or Google Sign-In dependency, works with VPN off).

## 1. Prepare Locally

1. Install dependencies and run verification checks:
   ```bash
   npm install
   npm run lint
   npm --prefix apps/staff run typecheck
   npm --prefix apps/staff test
   npm test
   ```
2. Audit packaging inputs and build the production release package:
   ```bash
   node scripts/package-dashboard-completion.mjs --audit-source
   node scripts/package-dashboard-completion.mjs --production
   ```
   This creates `releases/manual-production-dashboard-completion-<TIMESTAMP>/` containing:
   - `UPLOAD-WEBSITE-CONTENTS.zip` (`dist/` with website, `/admin/`, all 9 staff panels: `dashboard`, `management`, `callcenter`, `sales`, `ceo`, `sales-leader`, `finance`, `marketing`, `engineering`, plus `staff-api/` and `api/`)
   - `UPLOAD-PRIVATE-OUTSIDE-WEBROOT.zip` (`private/` with `app/src/`, `config.example.php`, `website-db.example.php`, `sessions/`)
   - `database/` (`fresh/`, `upgrade/`, and `04-seed-all-staff-users.sql`)
   - `START-HERE.md`, `BUILD-STATUS.json`, and `manifest.json`

## 2. Database Setup / Upgrade (phpMyAdmin)

Back up all three databases (`Website`, `Internal Office CRM`, `Submissions`) and private files first.
In phpMyAdmin, select the **Internal Office CRM** database (`SELECT DATABASE();`) before importing:

### Option A: Existing `attaieproperties.com` Internal CRM Database (Upgrade)
1. Import `database/upgrade/internal-crm/115-mysql-staff-auth.sql`:
   - Makes `core_users.firebase_uid` nullable and adds `password_hash VARCHAR(255) NULL`.
2. Import `database/04-seed-all-staff-users.sql`:
   - Inserts or updates all 12 staff accounts (CEO, Sales, Call Center, Sales Leader, Marketing Manager, Editor, Videographer, Finance Manager, Architect, Graphic Designer, 3D Visual Designer, and Manager Erfan Malik) with `PASSWORD_BCRYPT` hashes for initial password `123456`.
   - Existing non-empty `password_hash` values are preserved.
3. Optional CLI password assignment for any existing user:
   ```bash
   php staff-service/bin/set-staff-password.php --username Ceo@attaieproperties.com --config /path/to/private/config.php
   ```
   (Or pass `--sql` to output a parameterized `UPDATE` statement for phpMyAdmin.)

### Option B: Fresh Empty Databases
1. Website database: `database/fresh/01-website.sql`
2. Internal Office CRM database: `database/fresh/02-internal-crm.sql`, then `database/04-seed-all-staff-users.sql`
3. Submission database: `database/fresh/03-submissions.sql`

## 3. Configure Private Files (Outside Web Root)

1. Extract `UPLOAD-PRIVATE-OUTSIDE-WEBROOT.zip` outside **all** document roots (e.g., `/home/attaiepropert/attaie-v2-private/`).
2. Update `app/src/` with the extracted PHP source (no `FirebaseAuth.php` required).
3. Ensure `config.php` (copied from `config.example.php`) has:
   - `dsn`, `database_user`, `database_password` for the Internal CRM database
   - `origin => 'https://attaieproperties.com'`
   - `session_directory` pointing to a writable directory outside webroot
   - No `firebase_project_id` or `firebase_api_key` is needed.
4. Confirm `staff-api/paths.php` and `api/db.php` in the public webroot point to your private directory.

## 4. Upload Public Web Root & Verify

1. Extract the **contents** of `UPLOAD-WEBSITE-CONTENTS.zip` into `attaieproperties.com`'s document root (including `.htaccess` and `.user.ini`). Preserve your live `api/db.php` and `staff-api/paths.php` if already configured.
2. Verify with **VPN off**:
   - Sign in with email or username (case-insensitive) at `/ceo/`, `/management/`, `/sales/`, `/callcenter/`, etc.
   - Confirm no Google Sign-In button appears and "Forgot password?" directs staff to contact the CEO/Admin.
   - As CEO, verify creating a new staff account with an initial password and resetting an existing staff member's password in Team Management.
   - Remind all seeded staff members to change their initial password (`123456`) via the CEO after first sign-in.
