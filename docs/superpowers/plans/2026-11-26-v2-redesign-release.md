# Attaie V2 Redesign and Release Implementation Plan

> For agentic workers: execute the owner-approved roadmap in independent, reviewed slices. Preserve other workers' edits and record evidence before marking a task complete.

**Goal:** Refine Variant 1 across the website, Website Admin, eight staff panels and native wrappers, preserving department responsibilities and preparing a verified V2 testing release.

**Architecture:** Keep React/Vite clients, PHP APIs, Firebase staff authentication, separate Website Admin authentication, and separate website/internal/submission databases. Share staff source across wrappers; maintain private configuration outside all web roots.

**Spec:** Owner-approved roadmap in this conversation, 2026-11-26. English diagrams; English/Dari product, RTL; blue/green/slate Variant 1. Preserve and repair business responsibilities.

## Global constraints

- Target https://website.attaieproperties.com only. No V1 changes, uploads or database operations.
- Preserve existing data, account mappings, financial history and files. Fresh SQL is for empty databases only.
- No fabricated inventory, historical charts, customer identities, or deployment claims.
- Keep passwords, keys, SQL and private setup outside public upload files.
- No push, merge to shared branches, or external publication in this scope.

## Review focus

Authentication/branch boundaries; duplicate customer/property claims; monetary reconciliation and reversals; outage/offline delivery states; bilingual accessibility and truthful metadata.

## Tasks and acceptance

- [x] Refresh GitHub and identify baseline. HEAD e1b2524 contains remote a6114b1; 1 ahead, 0 behind on refresh. Preserve dirty changes.
- [ ] Validate DevOS runtime, adapter CLI and real specialist invocation; record actual gates and limitations.
- [ ] Save diagram sources and render English architecture, business flows, department sheets, panel maps and release roadmap. Verify SVG geometry and browser layout.
- [ ] Generate editable Canva 18-page presentation and overview image. Inspect returned pages; record missing content rather than assuming generation fidelity.
- [ ] Restore Firebase login/provisioning contract. Node and isolated PHP regression tests must prove credentials go only to Google, UID matching, disabled/unmapped denial, branch restrictions, and CSRF session behavior.
- [ ] Resolve frontend/backend submission access matrix. CEO view, Editor submit/read, Website Admin review/publish; no implicit cross-database staff access.
- [ ] Remove sample catalog fallback and fabricated detail/media claims. Empty, error and missing states must be distinct and translated; no fake property may receive inquiries.
- [ ] Replace generated historical KPI values with real dated aggregation or unavailable states. Test empty inputs, late completion and distinct inventory/pipeline populations.
- [ ] Verify shared responsive components and screen-by-screen workflows: Call Center/Sales/Leader, Management/Finance, Marketing/Admin, Engineering/CEO. Preserve branch/team/assignment restrictions.
- [ ] Consolidate environment-aware metadata and explicit language links. Verify PHP/client parity, sitemap eligibility and staging noindex.
- [ ] Prepare staging-safe packaging: explicit target, private config, no duplicate constants, complete migrations and reviewed backfill, CEO bootstrap, active branch provisioning.
- [ ] Rehearse schemas and upgrades on disposable local databases matching host engine. Preserve records and UID/file references; report incompatible SQL.
- [ ] Rebuild Android/iOS web assets and desktop bundles from frozen source. Verify testing endpoints, preview exclusion and safe signing. Android/device testing, desktop installed flows and iOS macOS archive remain separate gates.
- [ ] Run all TypeScript checks, public/staff regressions, PHP lint and domain/auth suites, browser EN/FA/RTL checks at 375/768/1024/1440, financial/concurrency checks and independent QA.
- [ ] Freeze candidate digest; prepare public/private archives, SQL, manifest, manual cPanel/phpMyAdmin guide, backup/rollback and hosted smoke checklist. Do not report deployed until hosted checks pass.

## Work ownership

Root owns plan, local diagrams, Canva, integration and evidence. Backend worker owns packaging and release guide. Frontend/auth worker owns truthful inventory and scoped permission/test repairs. Runtime worker owns DevOS invocation/evidence. Other changes require coordination to avoid overlapping writes.

## Release decision

DEV_READY requires executed scoped tests and exact candidate evidence. Full release readiness also requires independent QA, migration rehearsal and native/host checks. A prepared ZIP or debug APK is not proof of installation.
