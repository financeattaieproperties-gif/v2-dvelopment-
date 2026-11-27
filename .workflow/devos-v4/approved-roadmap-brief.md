# Attaie V2: approved direction and Product analysis assignment

The owner authorized use of Roheen DevOS V4 with its real Codex adapter and approved the existing roadmap direction. This first invocation is a concise Product analysis only, in a curated local source copy. Review source as needed and write `.workflow/roles/product.md` with actors, journeys, measurable acceptance criteria, exclusions, and unresolved owner decisions. Do not implement, build, install dependencies, call external connectors, publish, deploy, alter original repository files, or change databases. Stop after Product at the scope-approval gate. Do not claim generated scope/design documents have been approved merely because roadmap direction was approved.

## Product direction

Refine the existing UI Variant 1 (Minimal Architectural Split-Rail, Logo Tri-Color) across the public bilingual website, separate Website Admin, all staff panels, Sales Android/iOS and Call Center desktop. Preserve workflows and authentication/data boundaries. Improve task clarity, hierarchy, role-specific navigation, forms, feedback, empty/error/offline states, accessibility and consistent responsive behavior. Product content remains English/Dari with RTL support. Planning records and diagrams are English. No unrelated stack replacement, dark/neon theme, invented integration, or silent changes to authority.

Brand: blue `#0072BC`, green `#14A850`, slate `#818285`, canvas `#F8FAFC`, white surfaces, border `#E2E8F0`, ink `#1E293B`; DM Sans/Tajawal. Desktop uses the existing two-tier split rail; mobile uses appropriate task cards and navigation. Preserve reduced motion and accessible focus.

## Current source to verify

Website Admin `/admin` is separate from internal staff roles and uses website PHP-session authentication. Staff use Firebase Authentication mapped by exact UID to internal CRM records. CEO is the sole global role; other active staff require one active branch. Panels: `/ceo`, `/management`, `/callcenter`, `/sales-leader`, `/sales`, `/finance`, `/marketing` (Marketing Manager, Videographer, Editor), `/engineering` (Architect, Graphic Designer, 3D Designer). Retired roles must not be reintroduced. Manager owns contract preparation/issuance; Finance Manager owns deposit workflows. Preserve website/internal CRM/submission database isolation.

Required visual planning inventory: public website journey, Website Admin publishing, each department workflow, end-to-end inquiry-to-sale swimlane, marketing-to-publication swimlane, engineering revision loop, role/panel architecture, native app structure, shared design foundations, phased redesign/QA/release gates. Use an editable six-slide executive narrative plus detailed departmental appendix when later authorized. No external Canva creation/publication is part of this Product stage.

Sales journey: intake and duplicate review, assigned lead/follow-up, visit, Deal Closed evidence, Manager contract, 100% installment reconciliation, Finance draft/post/receipt and permitted corrections/reversals. Distinguish closed deal, issued contract and paid installment. Marketing: entry, filming scheduled/completed, editing scheduled, ready for post, posted/submitted, Website Admin approval/publication or rejection correction. Engineering uploads versions; CEO reviews or requests revision. Validate actual rules against source and flag uncertainty.

## Boundaries and evidence

V2 testing target is `https://website.attaieproperties.com`, with separate MySQL databases. No V1 access, credentials or changes. New catalogs start empty. Preserve existing V2 data. Owner manually uploads a specifically prepared folder through cPanel and imports SQL through phpMyAdmin; do not require cPanel Terminal. Never equate prepared files with verified deployment.

This sanitized copy excludes secrets, env files, runtime data, uploads, generated bundles, node_modules, git history and most assets. It is suitable for source analysis, not build or integration proof. Native Android debug compilation occurred in the original workspace earlier, but iOS archive/signing, physical device behavior and hosted integrations remain unverified. Do not claim native distribution readiness or QA PASS.

For this assignment, limit broad discovery. Read relevant role/panel contracts and representative workflow components, record the source paths used, and deliver a concise Product handoff. This is a real runtime attempt, never a fixture/simulation claim. If CLI authentication, quota, connectivity or tooling prevents work, return or record BLOCKED with the actual reason. No repeated retries without owner direction. Later scope/design gates remain explicit.
