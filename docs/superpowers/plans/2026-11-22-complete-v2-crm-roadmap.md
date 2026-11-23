> Recovered unchanged from the prior planning session on 2026-11-22. Inspection results below are historical, not current verification. Saving this roadmap does not record design approval or implementation completion.

# Attaie Properties V2 — Complete CRM, Departments, and Reliability Plan

## 1. Goal, architecture, and verified starting point

Extend the existing system into a complete **sales and pre-sales CRM**, covering customer acquisition through contracts, collections, commissions, and handover.

Keep the current architecture: React public website, separate Admin CRM, shared staff application, PHP/MySQL backend, Firebase staff authentication, and existing mobile/Electron wrappers. Deliver in phases, each with working frontend, backend, permissions, translations, and tests.

**Verified during initial inspection:**

- Public website, staff, and Admin TypeScript checks passed.
- The default test command ran 27 tests: 26 passed and one failed.
- That failure expects broader submission access than the current role policy and SQL grants permit.
- Additional tests exposed populated preview catalogs and a stale expectation that the five removed projects must exist.
- Staff authentication currently uses PHP password hashes and generated `local_...` UIDs, contradicting the confirmed Firebase requirement.
- The staff build script explicitly enables preview functionality.
- PHP execution was blocked by the sandbox; PHP syntax, live endpoints, and database workflows remain unverified.
- Substantial uncommitted changes already exist and must be preserved.

**Boundaries:** V2 only. Test externally at `website.attaieproperties.com`. Preserve existing V2 records. Keep website, CRM, and submissions databases isolated. Prepare manual upload files and SQL; no automatic installer or cPanel Terminal requirement. Production deployment requires separate authorization.

## 2. Departments, users, and responsibilities

Retain the existing six departments and 12 staff roles. Add three focused departments and five roles, producing **nine departments and 17 staff roles**.

| Department | Roles | Planned responsibilities |
|---|---|---|
| Executive & Branch Management | Existing CEO, Manager | Strategy, branch oversight, inventory ownership, approvals, staffing, performance |
| Call Center | Existing Call Center Agent | Inquiry intake, qualification, duplicate review requests, contact attempts, appointments, handoffs |
| Sales | Existing Sales Leader, Sales Agent | Customer relationships, requirements, matching, visits, negotiations, offers, reservations |
| Marketing & Production | Existing Marketing Manager, Videographer, Editor | Campaigns, production schedules, approved media, publishing submissions, attribution |
| Finance | Existing Finance Manager; **new Collections Officer** | Installments, receipts, overdue balances, refunds, commission calculations and payouts |
| Engineering & Design | Existing Architect, Graphic Designer, 3D Visual Designer | Technical documents, floor plans, renders, deliverable versions, review and approval |
| **Contracts & Legal** | **New Contracts Officer** | Transaction checklists, contract preparation, document review, issuance and amendment workflow |
| **Customer Care & Handover** | **New Customer Care Lead, Customer Care Agent** | Post-contract communication, handover appointments, clearance checklists, complaints, referrals |
| **IT Support** | **New IT Support Officer** | Application diagnostics, failed jobs, device/version status, technical support tickets |

**Permission rules**

- CEO remains the only global staff role. Every other staff account belongs to one active branch.
- Sales agents access owned or explicitly shared customers; sales leaders access their assigned teams.
- New roles receive explicit action permissions. Department membership alone grants no record access.
- Collections Officers prepare collection actions and payment drafts; they cannot post, reverse, or approve payments.
- Contracts Officers access transaction documents, not unrestricted finance or unrelated customer records.
- Customer Care accesses assigned transactions and approved customer-facing documents.
- IT Support sees technical diagnostics without customer documents, financial details, passwords, or secret configuration.
- Website Admin remains separate from staff identity and cannot administer the CRM database.
- Submission access remains Editor/CEO/Website Admin according to existing boundaries.
- Do not reactivate retired roles, including Finance Assistant or HR Manager.

**User lifecycle**

Use Firebase identities with exact UID mapping in MySQL. Initially, the owner creates Firebase accounts through Firebase Console; CEO provisions the matching CRM account with UID, role, department, branch, and team.

Support active, suspended, and deactivated states; audited reassignment; session invalidation; and a reassignment checklist for outstanding work. Never match identities automatically by email or generate substitute UIDs. An unmapped Firebase account receives no CRM access.

## 3. Implementation phases and release gates

### Phase 0 — Establish the complete audit baseline

Create a traceable inventory of every feature and connection:

- Public pages, Admin pages, staff panels, mobile/desktop entry points, shared packages, PHP scripts, schemas, migrations, workers, and packaging scripts.
- For each API: client caller, method, request/response, authentication, permission, branch/owner scope, database tables, failure behavior, and test coverage.
- Include website inquiries, visits, careers/applications, agents/branches, maps, SEO/sitemaps, website chat, AI chat, visual configuration, and Google Workspace integrations.
- Separate real-backend tests from preview/mock tests. Identify tests excluded by the default test configuration.
- Record each feature as **verified working, reproduced failure, static concern, or unverified**. Historical checkboxes do not count as current verification.

**Gate:** Every application surface and endpoint has an owner, connection map, and verification status.

### Phase 1 — Repair authentication, contracts, and deployment risks

- Restore Firebase sign-in and server token verification. Check signature, issuer, audience, expiry, and exact UID mapping using the existing Firebase verifier after testing it against official requirements. [Firebase token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens).
- Remove staff password submission and local-UID generation from active provisioning/login paths. Keep website-admin authentication separate.
- Produce an account migration report. Existing local accounts stay blocked until explicitly linked; preserve their business history.
- Reconcile fresh-install SQL, upgrade migrations, PHP queries, shared DTOs, frontend clients, and permission grants.
- Fix stale permission tests to assert the approved restrictive policy; do not widen permissions to make tests pass.
- Restore empty preview project/unit catalogs and fictional identities. Replace the obsolete five-project test with an empty-catalog regression test.
- Disable preview/mock behavior in uploadable builds. Consolidate duplicate staff build configuration into one authoritative configuration.
- Verify all desktop/mobile API targets explicitly point to V2 staging during testing.
- Check PHP validation, transactions, CSRF, CORS, uploads, TLS, rate limiting, callback handling, and error responses.
- Remove authenticated API responses from shared service-worker caches. Keep minimal offline lead data isolated by user; clear it on logout/account switch. Identity documents and financial actions remain online-only.

**Gate:** Firebase login, provisioning, account switching, deactivation, role isolation, and clean staging builds pass integration tests.

### Phase 2 — Deliver department and user administration

Extend the shared staff application rather than creating separate applications for each new department.

Add department rosters, staff search, branch/team assignment, role-specific navigation, workload summaries, provisioning status, suspension, and audited reassignment.

Introduce explicit permission grants for the five new roles across SQL, PHP authorization, shared contracts, navigation, and tests. UI hiding supplements server authorization.

Contracts & Legal takes ownership of the contract workflow using existing contract records. Preserve historical issuers and snapshots. Managers retain preparation/review responsibilities; new issuance follows the approved workflow rather than silently retaining unrestricted legacy grants.

**Gate:** Every role passes allowed/denied tests across own branch, other branch, own records, assigned records, and unrelated records.

### Phase 3 — Complete customer intake, routing, and sales productivity

Build a **Customer 360** record with multiple inquiries and transactions:

- Contact details, normalized phones, preferred language, requirements, source/campaign, consent preferences, ownership, relationships, timeline, documents, and next action.
- Duplicate suggestions require review when ambiguous; a shared phone number does not automatically merge people.
- Website inquiries, chat handoffs, visit requests, and manual intake reach a visible assignment queue through an audited, retryable bridge.
- Retain one primary lead owner and explicit collaboration/referral history.
- Route eligible leads by branch, project, language, availability, and round robin. Route unmatched cases to a manager queue.
- Provide saved views for unassigned, untouched, overdue, upcoming visits, stale opportunities, and missing next actions.
- Add a shared visit calendar, assigned agent, confirmation, outcome, no-show reason, and follow-up task.

Follow Up Boss documents centralized customer timelines and routing; its action plans combine tasks and follow-up sequences. These are workflow references for the proposed implementation. [Customer timeline](https://help.followupboss.com/hc/en-us/articles/9538400649495-Lead-Profile-Overview), [routing](https://docs.followupboss.com/reference/groups-post), [action plans](https://help.followupboss.com/hc/en-us/articles/1500008539982-Action-Plans-Overview).

**Defaults:** Preserve the existing 24-hour follow-up rule. Add configurable 15-minute assignment acceptance and 30-minute first-human-attempt targets during branch working hours. Branch hours must be configured before timed routing is enabled. Track acceptance, first attempt, and successful contact separately.

**Gate:** A real website inquiry reaches the correct staff queue once, survives retries, and completes intake, handoff, visit, and follow-up.

### Phase 4 — Complete inventory, matching, offers, and reservations

Keep internal inventory authoritative for availability, pricing approvals, reservations, and contracts. Website listings are separately approved publication records with stable links to internal inventory.

Add:

- Explainable buyer/property matching by budget/currency, location, type, size, rooms, completion stage, and payment preference.
- Reverse matching when inventory changes, shortlists, and rejection reasons.
- Offer versions, counteroffers, conditions, expiry, supporting documents, and approval history.
- Reservation requests, expiry, cancellation reasons, deposit linkage, and unit release history.
- Atomic server enforcement of one active reservation per unit, including simultaneous requests.
- Availability revalidation during reservation and contract issuance; website publication delays cannot permit double booking.
- Archival and tombstone rules instead of deleting inventory referenced by transactions.

Propertybase documents both inquiry-to-listing matching and reverse matching, plus offers and counteroffers. Timed reservation locking is our proposed safeguard. [Matching](https://help.propertybase.com/hc/en-us/articles/360000362232-How-to-Use-Matching), [offers](https://help.propertybase.com/hc/en-us/articles/115002223592-Getting-Started-Series-Managing-Offers).

**Gate:** Concurrent reservation attempts produce one winner; stale offers and unavailable units cannot progress.

### Phase 5 — Complete contracts, sales finance, and commissions

Use the existing contract and installment model, extending it without duplicating historical contracts.

- Add transaction checklists, buyer/seller details, approved templates, document versions, issuance, amendments, cancellation, and verification.
- Contracts Officers prepare; Managers review; issuance requires recorded approval. CEO gives final approval for discounts, financial amendments, refunds, and commission payouts.
- Bind approvals to the exact record version and amount. Changes invalidate earlier approval.
- Support partial payments and one receipt allocated across multiple installments of the same contract and currency.
- Reject overpayments and currency mismatches initially. Do not introduce automatic currency conversion or unapplied credit balances.
- Posted money movements are immutable. Corrections, refunds, and reversals create linked records and update balances transactionally.
- Add aging buckets, collection queues, promises to pay, collection notes, and approved receipt PDFs.
- Add versioned commission rules and splits. No default commission percentage is invented: CEO configures and activates a rule.
- Recognize earned commission against posted eligible collections; track calculated, approved, earned, and paid amounts separately. Reversals create corresponding commission adjustments.
- Export accounting-ready records; exclude payroll and full general-ledger accounting.

Brokerage back-office systems distinguish commissions and financial operations from lead management. [Lone Wolf Back Office](https://www.lwolf.com/operate/back-office).

**Gate:** Installments, allocations, receipts, refunds, commission adjustments, and outstanding balances reconcile without duplicate postings.

### Phase 6 — Complete marketing, engineering, publishing, and jobs

- Extend existing production stages with assignments, deadlines, asset versions, review comments, campaign/source attribution, and publication outcomes.
- Preserve Editor submission and Website Admin publication authority.
- Link approved engineering assets to internal inventory and approved website copies.
- Add failed-job inspection, retry actions, reconciliation reports, and publication-lag visibility.
- Implement a private PHP worker run every minute through a documented cPanel Cron Job.
- Use stable event IDs, idempotent consumers, overlapping-worker protection, expiring claims, bounded batches, retries, and a failed-job queue.
- Cross-database delivery is eventually consistent: acknowledge only after durable processing, and recover safely when one database commits before another fails.

Begin with internal reminders, manual call/WhatsApp links, and activity logging. Provide disabled-by-default adapters for future email, WhatsApp Business, and telephony integrations. Provider setup and external sending are separate activation steps.

**Gate:** Retried publication and inquiry events create no duplicate records or attachments.

### Phase 7 — Add customer care, handover, and the later customer portal

- Create assigned handover queues with contract status, finance clearance, document checklist, readiness, appointment, customer acknowledgement, and exceptions.
- Add service requests, complaints, escalation, resolution notes, feedback, and referral follow-up.
- Require finance clearance before handover unless CEO records an explicit exception.
- Add a later buyer/seller portal showing only approved documents, relevant schedules, posted receipts, handover updates, and support requests.
- Use separate customer principals and sessions; never add customers to the staff role registry.
- Verify ownership on every request and download. Sellers see only records linked to their approved ownership relationship.
- Exclude ongoing rental management, facilities, and maintenance operations.

Cross-team handover and post-sale relationship workflows have established CRM precedents. [Zoho real-estate workflow](https://help.zoho.com/portal/en/kb/crm/using-crm-for-everyone/use-cases/articles/crm-for-everyone-for-real-estate).

**Gate:** Customer accounts cannot access another customer, staff endpoint, internal note, or unapproved document.

### Phase 8 — Reporting, usability, and final release verification

Provide scoped dashboards for:

- Source/campaign performance, unassigned leads, response times, overdue work, visits, offers, contracts, and conversion.
- Project/unit sell-through, reservations, expiry, collections aging, refunds, and earned versus paid commission.
- Department workload, production turnaround, engineering revisions, handover completion, and failed integrations.

Calculate totals on the server across the full filtered dataset. Define denominators and distinguish inquiry, person, deal, contract value, and collected revenue. First-human-response excludes automated messages; track intake-team response separately from owner response. [Response-time reporting reference](https://help.followupboss.com/hc/en-us/articles/9229981219351-Speed-to-lead-lead-source-report).

Preserve UI Variant 1, EN/FA, RTL, keyboard access, clear loading/empty/error states, searchable paginated tables, and mobile layouts. Use Motion for state feedback with reduced-motion support.

21st.dev was consulted for table interaction references; retain existing components and brand foundations. Motion/Motion Site MCPs remain unavailable; use bundled guidance until connected. Do not claim a MotionScore audit.

**Gate:** Integrated staging acceptance passes across public website, Admin, all staff roles, Android, iOS, and Electron.

## 4. API, schema, and compatibility rules

- Preserve existing public PHP URLs and Admin response formats unless a specific defect requires a coordinated migration.
- Extend staff resources for customers, activities, visits, offers, reservations, approvals, collections, commissions, handovers, jobs, and reports.
- Keep staff success/error envelopes consistent. Use CSRF, idempotency keys, and version checks for state-changing operations; stale updates return `409`.
- Add bounded pagination and explicit server aggregates. Existing silent row limits must not masquerade as complete datasets.
- Add tables and indexes through versioned migrations. Import existing single-installment payments into allocation records without changing balances.
- Preserve database boundaries through narrow worker credentials and event bridges. Public/Admin services receive no direct CRM write access.
- Keep identity documents private with purpose-specific access checks and authorized downloads.
- Extract authentication, authorization, inventory, transactions, finance, publishing, and jobs into testable PHP modules while retaining compatible routes.
- Support mixed client versions during rollout. Required upgrades receive a clear update response rather than silently malformed data.
- Audit AI chat against published inventory and approved facts. It may suggest and hand off; it cannot approve deals, change availability, or access private CRM data.

## 5. Validation, delivery, and acceptance

Each phase includes regression tests, API tests against fictional local databases, browser tests against the real PHP backend, and a review of permissions and deployment boundaries.

Required scenarios include:

- Firebase expiry, invalid tokens, unmapped identities, failed account switching, deactivation, and privilege changes.
- Every role × branch × ownership boundary, including exports and attachments.
- Duplicate inquiries, repeated requests, concurrent reservations, stale approvals, partial payments, and reversals.
- Worker interruption, overlapping cron runs, database outages, retry exhaustion, and recovery.
- Offline account switching, rejected replayed actions, cache cleanup, and reconnection.
- EN/FA and RTL at mobile, tablet, and desktop sizes; keyboard and reduced-motion behavior.
- Existing website search, forms, visits, careers, maps, chat/AI handoff, SEO, visual configuration, and Workspace integrations.
- Backup restoration, fresh installation, and upgrade from a populated V2 fixture.

Build into isolated validation outputs first. Prepare the specifically designated manual-staging upload folder only after checks pass.

Deliver:

1. Feature/endpoint coverage matrix and prioritized defect register.
2. Department, role, and approval matrix.
3. Versioned implementation tasks with phase dependencies and acceptance tests.
4. Additive SQL, migration preconditions, and forward-repair instructions.
5. Upload package, private setup checklist, cron instructions, rollback package, and test evidence.

A phase passes only when its complete workflow works against the real backend. Final acceptance requires owner-confirmed import and hosting checks. “No known blocking defects in tested scenarios” is the completion standard; an absolute zero-defect guarantee is not evidence-based.
