# Full-Stack V2 Redesign Implementation Plan
Plan version: 1
Status: APPROVED (2026-11-25)
Target: Attaie V2 testing only (`https://website.attaieproperties.com` & local V2)

---

## User objective and scope
Perform a **full-stack redesign** of the Attaie Properties V2 application across all four layers in **subagent-driven mode**, evolving **UI Variant 1 (Minimal Architectural Split-Rail — Logo Tri-Color Edition)** (`#0072BC` / `#14A850` / `#818285`, `#F8FAFC` canvas, `#FFFFFF` surface, `#1E293B` ink) while fixing architectural monoliths, i18n/RTL gaps, SPA routing, and backend auth/security/schema mismatches:
1. **Public Website (`src/`)**: Align design tokens to Variant 1, fix SPA `<Link>` navigation, complete EN/FA i18n & RTL coverage across landing/secondary pages, and enforce empty-catalog states (removing bundled `SIGNATURE_PROJECTS` fallbacks per 2026-11-12 mandate).
2. **Admin CRM (`admin-panel/`)**: Unify `Overview.tsx` and `Login.tsx` on `V1` tokens, restore Google Sign-In UI in `Login.tsx`, fix `VaultPage.tsx` import, throttle/guard chat polling in `Layout.tsx`, and align `api.ts` contracts.
3. **Staff Dashboards (`apps/staff/`, `shared/`, `packages/staff-contracts/`)**: Decompose the 5,214-line `apps/staff/src/main.tsx` and 3,595-line `styles.css` into modular workspace components (`CallCenterWorkspace`, `SalesWorkspace`, `SalesLeaderWorkspace`, `ManagementWorkspace`, `CeoWorkspace`) and shared `shared/alabaster-dashboard.css` tokens, and wire Firebase Auth in `apps/staff/src/api.ts`.
4. **Backend & Data Layer (`public/api/`, `staff-service/`, `public/api/schema.sql`)**: Wire `Staff\FirebaseAuth` into `staff-service/src/App.php`, close the unverified `X-Staff-*` header trust hole in `public/api/vault.php`, add an additive migration for `project_units.technical_plan_url`, sync `leads.status` with `followup_status`, and document `SUBMISSION_DB_*` in `public/api/db.example.php`.

*(Note: `$fullstack-development` is not an installed skill in this repository; this plan follows the repository's `roheen-development` orchestrator in `FULL` mode with parallel subagent execution after approval.)*

---

## Current codebase evidence (exact paths)
- **Public Website (`src/`)**:
  - `src/styles/globals.css`: Declares `--color-brand-gold: #0145F2` (electric blue), `--color-status-available: #22C55E`, `--color-brand-cream: #F5F7FB` instead of Variant 1 (`#0072BC`, `#14A850`, `#818285`, `#F8FAFC`).
  - `src/components/layout/Navbar.tsx` & `src/components/layout/Footer.tsx`: Use native `<a href="...">` instead of React Router `<Link to="...">`, causing full page reloads.
  - `src/components/sections/LandingPageContent.tsx`, `PopularLocationsSection.tsx`, `ServicesSection.tsx`, `PromoBanner.tsx`, `HotDealsSection.tsx`, `ContactPage.tsx`, `AboutPage.tsx`, `SearchBar.tsx`, `PropertyCard.tsx`, `ProjectCard.tsx`: Missing `useTranslation()` calls; `FilterSidebar.tsx` references missing keys (`clearAll`, `purpose`, `type`, `beds`).
  - `src/pages/ProjectsPage.tsx` & `LandingPageContent.tsx`: Fall back to bundled `SIGNATURE_PROJECTS` when the API returns empty.
- **Admin CRM (`admin-panel/`)**:
  - `admin-panel/src/pages/VaultPage.tsx` (uncommitted): Broken import `../../shared/DigitalVault` (causes `tsc` error `TS2307`; needs `../../../shared/DigitalVault`).
  - `admin-panel/src/pages/Overview.tsx`: Defines local `THEME` (`#0B2545`, `#C5A059`, `#0D6042`) instead of `V1` from `admin-panel/src/components/variant1.tsx`.
  - `admin-panel/src/pages/Login.tsx`: Defines `loginWithGoogle` / `S.googleBtn` but omits the button from JSX; retains `#0145F2` in `saveServer`.
  - `admin-panel/src/components/Layout.tsx`: Polls `/chat-service.php?action=admin_list` every 3.5s unconditionally.
- **Staff Dashboards (`apps/staff/`, `shared/`)**:
  - `apps/staff/src/main.tsx` (5,214 lines): `App()` spans 2,897 lines with `CallCenter`, `Sales`, `SalesLeader`, `Management`, and `CEO` views and 12 forms/modals inlined.
  - `apps/staff/src/styles.css` (3,595 lines) & `apps/staff/src/callcenter-theme.css`: Duplicate tokens while `shared/alabaster-dashboard.css` (247 lines) is never imported.
  - `apps/staff/src/api.ts`: `api.loginWithGoogle()` throws `"Google sign-in is disabled."`; `apps/staff/src/auth/firebase.mjs` is unused.
- **Backend & Schema (`public/api/`, `staff-service/`)**:
  - `staff-service/src/App.php`: Imports `Staff\FirebaseAuth` (line 5) but `login()` (lines 164–187) only checks `core_users.password_hash`, blocking Firebase-provisioned CEO/staff accounts.
  - `public/api/vault.php` (lines 79–101, uncommitted): Accepts `HTTP_X_STAFF_NAME`, `HTTP_X_STAFF_UID`, `HTTP_X_STAFF_ROLE` without verifying a session or Firebase ID token.
  - `public/api/get-project-units.php` & `public/api/admin/project-units.php`: Encode `[TECHNICAL_PLAN: <url>]` inside `project_units.description` due to missing `technical_plan_url` column.
  - `public/api/admin/leads.php`: Updates `followup_status` without updating `leads.status`.
  - `public/api/db.example.php`: Missing `SUBMISSION_DB_HOST`, `SUBMISSION_DB_USER`, `SUBMISSION_DB_PASS`, `SUBMISSION_DB_NAME` required by `public/api/admin/submissions.php` and `public/api/submission-photo.php`.

---

## Roles and explicit permission matrix
Preserves `packages/staff-contracts/role-preference.mjs` (`PANEL_SPECS` & `ROLE_DASHBOARD_LAYOUT_MAP`) and `admin-panel` admin role:
| Role / Surface | Auth Mechanism | Allowed Modules / Scope |
|---|---|---|
| Public Visitor (`src/`) | Unauthenticated | Home, Properties, Projects, Agents, Careers, Contact, About, Inquiry/Visit/Call |
| Admin (`admin-panel/`) | PHP Session + Firebase ID Token (`admin-login.php`) | Overview, Properties, Projects, Tasks, Leads, Chat, Vault, Visits, Agents, Branches, Careers, SEO, Settings |
| Staff (`apps/staff/`: `ceo`, `manager`, `sales_leader`, `sales`, `callcenter`, `finance`, `marketing`, `engineering`) | `attaie_staff_session` + Firebase ID Token (`staff-service/src/App.php`) | Scoped per `ROLE_DASHBOARD_LAYOUT_MAP`; `vault` restricted to `ceo`, `manager`, `sales_leader`, `sales` |

---

## Screens, UX journeys and accessibility
- **Public Website (`src/`)**: Consistent Variant 1 tri-color accents (`#0072BC` primary CTAs, `#14A850` available/verified badges, `#818285` muted metadata, `#F8FAFC` canvas, `#FFFFFF` cards, `#1E293B` ink), instant SPA `<Link>` navigation, full EN/FA translation + `dir="rtl"` support, and clean empty-state UI when catalog is empty.
- **Admin CRM (`admin-panel/`)**: Unified `V1` tokens across `Overview.tsx` and `Login.tsx` (including Google Sign-In button), fixed `/vault` route, resilient chat polling (pause when hidden / exponential backoff on error).
- **Staff Dashboards (`apps/staff/`)**: Same Split-Rail Variant 1 UX with faster, isolated workspace rendering (modular components instead of 5,214-line `main.tsx`), unified `shared/alabaster-dashboard.css` base tokens, and Firebase Google Sign-In support on `Login`.
- **Accessibility**: Preserve `:focus-visible` rings, `prefers-reduced-motion`, `aria-label`s on icon buttons, keyboard navigation, and mobile drawer/bottom-tab responsiveness.

---

## Existing UI components/tokens to reuse
- `shared/alabaster-dashboard.css` (canonical Variant 1 CSS variables & `.alabaster-*` utilities)
- `admin-panel/src/components/variant1.tsx` (`V1`, `V1_STYLES`, `v1BadgeStyle`, `V1Pagination`)
- `shared/DigitalVault.tsx` (shared between `apps/staff` and `admin-panel`)
- `src/components/ui/Button.tsx` (`Button`, `cn()`), `src/components/ui/PropertyCard.tsx`, `src/components/ui/ProjectCard.tsx`
- `apps/staff/src/components/OverviewAnalyticsStrip.tsx`, `SalesMobileCards.tsx`, `FinanceWorkspace.tsx`, `MarketingWorkspace.tsx`, `EngineeringWorkspace.tsx`, `HrContractsWorkspace.tsx`

---

## React components and file ownership
1. **Public Site Agent**:
   - `src/styles/globals.css` (Variant 1 token alignment)
   - `src/components/layout/Navbar.tsx`, `src/components/layout/Footer.tsx` (`<Link>` SPA routing)
   - `src/components/sections/LandingPageContent.tsx`, `PopularLocationsSection.tsx`, `ServicesSection.tsx`, `PromoBanner.tsx`, `HotDealsSection.tsx` (i18n + empty-catalog state)
   - `src/pages/ProjectsPage.tsx`, `ContactPage.tsx`, `AboutPage.tsx`, `src/components/forms/SearchBar.tsx`, `src/components/property/FilterSidebar.tsx`, `src/components/ui/PropertyCard.tsx`, `src/components/ui/ProjectCard.tsx`
   - `src/i18n/locales/en.json`, `src/i18n/locales/fa.json`
2. **Admin CRM Agent**:
   - `admin-panel/src/pages/VaultPage.tsx` (fix `../../../shared/DigitalVault` import)
   - `admin-panel/src/pages/Overview.tsx` (consume `V1` from `variant1.tsx`)
   - `admin-panel/src/pages/Login.tsx` (render Google Sign-In button, replace `#0145F2` with `V1.blue`)
   - `admin-panel/src/components/Layout.tsx` (smart/backoff chat polling)
   - `admin-panel/package.json` (declare `firebase` dependency if needed)
3. **Staff Dashboards Agent**:
   - `apps/staff/src/styles.css` & `apps/staff/src/callcenter-theme.css` (import `../../../shared/alabaster-dashboard.css`, deduplicate tokens)
   - Extract modular workspaces from `apps/staff/src/main.tsx`:
     - `apps/staff/src/components/CallCenterWorkspace.tsx`
     - `apps/staff/src/components/SalesWorkspace.tsx`
     - `apps/staff/src/components/SalesLeaderWorkspace.tsx`
     - `apps/staff/src/components/ManagementWorkspace.tsx`
     - `apps/staff/src/components/CeoWorkspace.tsx`
     - `apps/staff/src/components/StaffFormsAndModals.tsx` (or per-domain modal files)
   - `apps/staff/src/api.ts` & `apps/staff/src/main.tsx` (wire Firebase ID token login)
4. **Backend & DB Agent**:
   - `staff-service/src/App.php` (support Firebase `id_token` in `/staff-api/v1/auth/login` via `Staff\FirebaseAuth`)
   - `public/api/vault.php` (require verified admin session or verified staff session/Firebase token; reject raw unverified `X-Staff-*` headers)
   - `public/api/migrations/012_project_units_technical_plan.sql` (additive `ALTER TABLE project_units ADD COLUMN technical_plan_url VARCHAR(512) NULL`) + rollback SQL
   - `public/api/get-project-units.php`, `public/api/admin/project-units.php` (read/write `technical_plan_url` column with backward-compatible fallback)
   - `public/api/admin/leads.php` (keep `status` synced with `followup_status`)
   - `public/api/db.example.php` (document `SUBMISSION_DB_*` constants)

---

## PHP endpoint contracts and error handling
- `POST /staff-api/v1/auth/login`: Accept either `{ id_token }` (verified via `Staff\FirebaseAuth`, matched to `core_users.firebase_uid` or `email`) OR `{ username, password }` (for non-Firebase local accounts). Return `401` on invalid/unmapped token, `403` if user inactive.
- `GET/POST/DELETE /api/vault.php`: Require valid `require_admin()` PHP session OR verified `attaie_staff_session` / verified Firebase Bearer token; remove raw `HTTP_X_STAFF_*` trust. Return `401`/`403` JSON error envelope on unauthorized access.
- `GET/POST/PUT /api/admin/project-units.php` & `GET /api/get-project-units.php`: Return `technical_plan_url` directly from column (falling back to `[TECHNICAL_PLAN: ...]` regex only if column is NULL).

---

## Database changes, migration and rollback
- **Additive migration** `public/api/migrations/012_project_units_technical_plan.sql`:
  - `ALTER TABLE project_units ADD COLUMN technical_plan_url VARCHAR(512) NULL AFTER floor_plan_url;` (guarded/idempotent in `bootstrap.php` / manual SQL).
  - **Rollback**: `ALTER TABLE project_units DROP COLUMN technical_plan_url;`.
- Update `public/api/schema.sql` to include `technical_plan_url` for fresh V2 installs.
- Preserve all existing V2 data; no destructive drops or V1 DB access.

---

## Firebase authentication and MySQL UID mapping
- Preserve exact `firebase_uid` ↔ `core_users` / `admin_users` mapping.
- `staff-service/src/App.php` verifies Firebase ID tokens server-side via `Staff\FirebaseAuth` (no hardcoded secrets, no client-side role spoofing).

---

## English/Dari/RTL and responsive behavior
- All user-facing strings on the Public Website (`src/`) routed through `t()` with keys in both `src/i18n/locales/en.json` and `src/i18n/locales/fa.json`.
- Verify `html[dir="rtl"]` layout across Navbar, Hero, FilterSidebar, Property/Project cards, Footer, and mobile breakpoints.

---

## Subagent dependency graph and ownership boundaries
1. **Wave 1 (Parallel, independent file ownership)**:
   - **Backend & DB Agent**: `public/api/*`, `staff-service/src/App.php`, `public/api/migrations/012_project_units_technical_plan.sql`
   - **Public Site Agent**: `src/*`
   - **Admin CRM Agent**: `admin-panel/*`
   - **Staff Dashboards Agent**: `apps/staff/*`, `shared/alabaster-dashboard.css`
2. **Wave 2 (Sequential QA & Verification Agent)**:
   - Runs `npm run lint`, `npm run build` (public site), `npm --prefix admin-panel run typecheck` + `npm run build:admin`, `npm run build:staff`, PHP syntax checks (`php -l`), and verifies no broken imports or regressions.

---

## Acceptance tests and commands
- Public site: `npm run lint` and `npm run build` (`tsc --noEmit && vite build`) pass with 0 errors.
- Admin CRM: `npm --prefix admin-panel run typecheck` and `npm run build:admin` pass with 0 errors.
- Staff dashboards: `npm run build:staff` passes with 0 errors.
- Backend PHP: `php -l` passes on all modified PHP files; vault endpoint rejects unauthenticated `X-Staff-*` headers; staff login accepts Firebase `id_token`.

---

## Risks and excluded work
- **Uncommitted Digital Vault changes**: Currently in working tree (`VaultPage.tsx`, `DigitalVault.tsx`, `011_digital_vault.sql`, `vault.php`); we will integrate and fix them rather than discarding them.
- **Excluded**: No deployment to V1 (`attaieproperties.af`) or V1 database; no automated server upload or phpMyAdmin execution (manual V2 staging deliverables only).
- **Orphaned AI chat tables**: Left untouched unless explicitly requested.

---

## Manual V2 staging deliverables
- Prepared `dist/` (public + `/admin` + `/staff` bundles), `public/api/migrations/012_project_units_technical_plan.sql` (and `011_digital_vault.sql`), and clear manual phpMyAdmin + cPanel upload instructions for `https://website.attaieproperties.com`.

Approval requested: Approve this plan version before any implementation.
