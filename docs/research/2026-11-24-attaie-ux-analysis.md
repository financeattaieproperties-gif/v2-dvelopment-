# Attaie Properties: website and CRM recommendations

Date: 2026-11-24. Status: research and proposals, not an approved redesign or implementation plan.

## Recommendation

Keep the existing V2 stack and recognizable brand. Develop the website around helping buyers choose and inquire; develop the CRM around helping staff take the next correct action. Connect those experiences through a reliable inquiry-to-contract record trail. Prioritize truthful inventory, honest charts, complete Dari, and reliable handoffs before adding visual effects or more dashboard screens.

This extends the existing CRM roadmap rather than replacing it. Customer timelines, routing, matching, reservations, finance, and permissions are already contemplated in `docs/superpowers/plans/2026-11-22-complete-v2-crm-roadmap.md`. Their presence in a plan does not establish implementation or approval.

## Scope and evidence

- Inspected current public React components, admin overview, staff overview and mobile cards, staff API/auth paths, existing design rules, and the CRM roadmap.
- Ran local Edge inspections at 1440×1000 English, 375×812 English, and 375×812 Dari. All `/api/` requests were intercepted with empty arrays; outbound requests were blocked. No customer records, login, or live database was used. This intentionally tests empty-data behavior and localization, not backend correctness.
- Captured screenshots after scrolling to trigger in-view content. All three cases had no page JavaScript exceptions and no page-level horizontal overflow. This is a limited smoke check, not full responsive or accessibility certification.
- Calculated color-pair contrast and reproduced source formulas with empty input. These are deterministic diagnostics, not observed business performance.
- External primary-source findings and caveats are in [UX evidence](2026-11-24-ux-evidence.md). There is no supplied production funnel, revenue, device/language breakdown, field performance dataset, or staff time study. No percentage sales uplift is claimed.

## What the current build gets right

1. Search supports location, type, bedrooms, and budget. Listing pages offer filters and grid/map views. Improve this foundation rather than replace it with a new navigation concept.
2. Property cards already expose price, location, rooms, size, floor, availability, references, and photos. The recommendation is better hierarchy and truthful behavior, not more badges.
3. Route-level lazy loading, loading skeletons, self-hosted fonts, and reduced-motion configuration are useful foundations.
4. Public inquiries use an IndexedDB outbox with pending/confirmed delivery states. Preserve the distinction between saved locally and accepted by the server.
5. The CRM already has split-rail navigation, role workspaces, mobile lead cards, follow-up deadlines, department workflows, finance and contract surfaces. The current operational breadth is valuable.
6. Shared contracts and separate public/admin/staff surfaces provide an existing route to consistent behavior. Reuse them.

## Verified problems and their business implications

| Finding | Owning source | Evidence | Implication and proposal |
|---|---|---|---|
| Executive chart generates a trend without records | `apps/staff/src/components/OverviewAnalyticsStrip.tsx:204` | Empty leads produce pipeline `[2,2,2,3,4,5]`, closed `[1,1,1,1,2,2]`; month labels are fixed | Replace index-derived values with dated events; empty records must produce zero or a clearly defined unavailable state |
| Call-center weekly intake is not a dated weekly count | Same file, line 60 | Uses array position modulo six and a minimum of one | Aggregate actual creation/handoff timestamps in branch timezone |
| KPI sparklines imply unobserved history | `apps/staff/src/main.tsx:1886`; `admin-panel/src/pages/Overview.tsx:397` | Staff points are offsets around the current value; admin property/project arrays include fixed history | Render only actual comparable period observations; omit sparkline when history is unavailable |
| Project contracting is a fixed assumption | `admin-panel/src/pages/Overview.tsx:933` | Sold count is `round(totalUnits * 0.72)`, default total 40 | Compute contracted units from authoritative inventory/contracts; unknown is not 72% |
| Project card can say 8% open when none are available | `src/components/ui/ProjectCard.tsx:36` | Availability percentage has a minimum of eight, and that percentage is displayed as text | Keep numerical percentage truthful, including zero; any visibility treatment belongs only to decoration |
| Staff SLA chart accepts every completed follow-up as on-time | `apps/staff/src/components/OverviewAnalyticsStrip.tsx:107` | `Boolean(completedAt)` satisfies the on-time predicate without comparison to deadline | Compare completion time to the deadline and distinguish completed-late from overdue-open |
| Manager inventory graphic mixes lead states and overlapping populations | Same file, line 167 | Active leads contribute to available; assigned active leads also contribute to reserved | Separate pipeline from inventory; stacked parts must be mutually exclusive |
| Empty public catalog becomes advertised sample inventory | `src/components/sections/LandingPageContent.tsx:42,311` | Local empty-API test rendered two available fallback properties, IDs 101 and 103 | Replace fallback advertisements with a truthful empty state and a property-finding inquiry |
| Dari direction works but translation is incomplete | Same file, line 378; `src/components/ui/PropertyCard.tsx` | In local `fa` mode, `dir=rtl` but headline and card labels stayed English | Translate the whole journey, including validation, statuses, numbers, dates, and delivery messages |
| Saved property state is temporary | `src/components/ui/PropertyCard.tsx:51` | Heart state lives only in component state | Persist anonymous saved listing IDs; make unsave/revisit behavior predictable |
| Property card contains nested actions inside a link | Same file, lines 72 and 182 | Two property links each contained a button in the local check | Use a semantic article, separate detail link and sibling save control; verify keyboard behavior |
| Email is mandatory for public inquiries | `src/components/forms/InquiryForm.tsx:15` | Schema requires a valid email | Test optional email for phone-led inquiries; validate backend contract too; do not assume uplift |
| Current staff auth conflicts with confirmed Firebase direction | `apps/staff/src/api.ts:92`; `staff-service/src/App.php:152,366` | Username/password login; provisioning hashes password and generates `local_` UID | Resolve the existing architecture mismatch before polishing account and recovery journeys |

Not every existing chart is synthetic. Admin monthly series reads record dates, for example. Audit each metric independently; preserve genuinely observed aggregates.

## Visual direction

Use one brand vocabulary with different information density for customers and staff.

**Website:** architectural photography, quiet white/light surfaces, clear navy text, restrained blue CTAs, compact factual card content, and minimal passive animation. Maintain the existing public typography and palette unless a scoped design decision changes them. Use genuine property photos and label renders; replace generic trust claims with substantiated project facts, service commitments, and named contact routes.

**CRM:** retain UI Variant 1, its 64px rail, contextual drawer, white surfaces, and role-aware navigation. Lead with the work queue. Four KPI positions can remain, but each must have a definition, scope, time period, freshness, and drill-through. A missing historical series should show a useful empty state instead of an attractive invented chart.

Preserve logo blue `#0072BC`, green `#14A850`, and slate `#818285` as brand accents. Introduce accessible semantic text roles rather than using accent colors indiscriminately for small text. Measured contrast on white: slate 3.84:1, green 3.11:1, blue 5.08:1. Proposed dark text tokens `#475569` and `#0D6042` are approximately 7.58:1. Actual tinted backgrounds and interactive states need separate checks. WCAG normal text baseline is 4.5:1. Source: [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

UI/UX Pro Max's generic real-estate search returned glassmorphism and alternate fonts. I would reject those suggestions here: they conflict with the established dashboard standard and add no demonstrated customer value. Its funnel guidance fits sequential cohort conversion; it does not justify funnel charts for arbitrary current-state counts. Its dashboard UX search and narrowed retry returned no verified match; operational recommendations here derive from source inspection and primary-source research instead.

## Website I would develop

### Homepage and discovery

Order: useful search; genuine available properties/projects; concise evidence about the agency; location guidance; viewing/contact action. Keep a moderate photographic hero. Remove date/time/weather from primary navigation unless research shows a buying task they support. Use header space for Properties, Projects, About, Contact, language, and one inquiry action.

In the empty-API inspection, the first property card began around 2,145px down the English mobile page at an 812px viewport. This is an empty-state layout measurement, not a live-user result. Collapse empty feature sections and retain useful next steps; avoid reserving a large project showcase when no projects exist.

On listings, preserve URL-based filters and add predictable sorting, result counts, clear-all, recoverable no-results states, and back-navigation continuity. Retain list/map choice; use a compact mobile filter sheet and apply action. Validate scale before adding server pagination; current client-side filtering may be adequate for a small catalog but should not require downloading every listing as inventory grows.

### Property cards

Use a stable 4:3 photo. Put price on a readable content surface, followed by localized title, neighborhood, and one concise facts row. Keep one availability badge and a separate accessible save control. Retain a reference code as secondary metadata. Show exact currency and rental period; never infer currency conversion or payment affordability.

```text
[Genuine property photo]                       [Save]
USD 85,000                         Available
3-bedroom apartment
Neighborhood, Kabul
3 beds   2 baths   145 m²   Floor 4
Reference AP-0123
[View property]
```

The content is illustrative, not an actual listing. Put installment amounts on a card only when the schedule, deposit, term, fees, and eligibility are explicit. Avoid making a low monthly amount compete with the full price without context.

Persist saved IDs for anonymous buyers. Offer comparison for two or three properties once sufficient structured data exists. Keep save and comparison optional; the primary route remains opening the property and arranging contact. Validate that extra controls improve selection rather than increase distraction.

### Project cards and detail pages

Project cards should expose location, genuine construction status, verified availability, and documented handover information. Include a starting price only when a currently available unit supports it. A project with zero availability must not display an open percentage.

Detail order: price/availability; photos; facts and plan; location and practical neighborhood context; documented payment terms; agent/viewing contact. Load maps, video, and 3D content when useful rather than before the main decision information. Use clear dates such as 'Availability checked [date]' only when a real review event supports them. Distinguish a render from a finished property photo.

For mobile, use a compact contact bar that respects screen space and keyboard focus. Choose a viewing request as the main detail action, with Call and WhatsApp as secondary routes. Measure the choice before treating it as a permanent winner.

### Inquiry design

Proposed initial fields: name, phone, preferred contact method; optional email and notes. Attach listing/unit identity, language, and acquisition context. Confirm availability during staff follow-up; an inquiry does not reserve a property.

Keep existing pending/confirmed outbox semantics. Show 'Saved on this device, waiting to send' versus 'Received, reference …' accurately. Preserve form input after failure, show actionable validation, and make contact consent/preferences understandable. Do not count opening WhatsApp or dialing a number as successful contact.

## CRM I would develop

### Personal work and customer record

Start sales and call-center users on Today: overdue contacts, new unassigned/unaccepted inquiries where permitted, upcoming visits, and records missing a next action. Keep the all-record list one navigation step away. Default sort should reflect work urgency and ownership, not a visually attractive chart.

Desktop: searchable table with owner, stage, next action, due time, last contact, and record identity; open a detail drawer without losing the filtered list. Mobile: concise action cards with the customer, property interest, due state, and one primary task.

```text
Customer name                  Follow-up overdue
Reference LEAD-0123 · Assigned agent
Interest: 3-bedroom apartment · Budget recorded
Last contact: [actual timestamp]
Next action: Confirm viewing · Due [timestamp]
[Call]       [WhatsApp]       [Log outcome]
```

This is a proposed structure with placeholders, not customer data. Clicking Call should not silently mark the task complete. Logging an outcome should suggest the next permitted action and preserve an audit trail.

The customer workspace should connect contact details, separate inquiries/opportunities, requirements, timeline, assigned collaborators, visits, offers, and documents. Do not collapse a person, inquiry, property, and contract into one status field. Shared phones need review rather than automatic merging. Preserve branch and role scope server-side.

### Department homes

| Workspace | Lead with | KPI/chart emphasis | Win |
|---|---|---|---|
| Call center | Intake, duplicate review, acceptance, callback queue | Time to first attempt, unassigned age, actual intake/handoff by date | Fewer unowned or forgotten inquiries |
| Sales | Due follow-ups and confirmed visits | Tasks due/late, contact outcomes, mature cohort conversion | Less navigation before the next customer action |
| Sales leader | Team exceptions and workload | Aging by agent, conversion with denominator/source mix, loss reasons | Coaching based on comparable work |
| Management | Reservation/contract and duplicate exceptions | Inventory states, pending decisions, reassignment needs | Clear ownership of stalled transactions |
| Finance | Due/overdue collections and approval queue | Receipts posted, due balances, aging by currency | Clear separation of money collected and promises |
| Marketing | Publishing work and campaign quality | Qualified inquiries, held visits, signed outcomes by source | Less emphasis on superficial engagement totals |
| Engineering | Assigned deliverables and revisions | Due dates, approval state, version turnaround | Fewer lost revisions and unclear handoffs |
| CEO | Cross-branch exceptions and approvals | Observed pipeline, signed sales, posted collections, aged risk | Decisions based on traceable evidence |

Keep action queues even when a dashboard chart has no history. Respect the owner's CEO approval rules; optimize preparation and visibility without silently delegating approval authority.

### Approvals and financial actions

Use the existing queue/detail split view: decision context, document version, before/after amount, reason, checklist, actor history, then a clearly named action. Require approval against the exact record version. Surface conflicts instead of overwriting concurrent changes. Keep recorded, approved, posted, and reversed money states distinct. Group amounts by currency unless an explicit exchange-rate policy exists.

## Data and charts I would trust

1. **Cohort conversion:** unique inquiries received in a defined period, followed through contact, qualification, held visit, reservation, and signed contract. Report observation window and maturity. Raw current stage counts are a pipeline bar chart, not necessarily a decreasing funnel.
2. **Response-time distribution:** inquiry to first human attempt; inquiry to successful contact; uncontacted backlog separately. Show median and p90 with working-hours rules. Preserve the existing 24-hour follow-up policy; do not substitute an arbitrary universal response promise.
3. **Stage aging:** horizontal bars or a distribution by stage/owner. Define re-entry, reopened cases, and clock resets.
4. **Inventory:** one mutually exclusive available/reserved/contracted/blocked state per unit at a specified time. Read reservations/contracts, not lead assignment.
5. **Finance:** posted receipts over time and outstanding balance aging, separated by currency. Signed contract value is not cash received.
6. **Acquisition quality:** campaign/source compared by qualified inquiries, visits held, and signed outcomes. Preserve Unknown and distinguish first acquisition from inquiry channel.

Every KPI needs a brief contract: source, unique entity, event timestamp, filters, denominator, timezone, and refresh time. Clicking a count should reveal precisely the eligible records, subject to permissions.

## Measurement plan and expected wins

Use stable event/record IDs to connect browser behavior and server-confirmed business outcomes. Suggested events: search submitted, zero results, listing viewed, save toggled, inquiry started, inquiry accepted by server, assignment accepted, first attempt, successful contact, viewing held, reservation confirmed, contract issued. Keep personal information out of analytics payloads. Use CRM IDs and restricted joins for business analysis.

| Proposed change | Expected win (hypothesis unless correctness fix) | Measure |
|---|---|---|
| Truthful inventory and chart calculations | Correct decisions and fewer misleading promises | Empty/known-data fixtures reconcile exactly to source records |
| Full Dari journey | More understandable buyer and staff tasks | Completion/errors by language; native-language task testing |
| Clearer factual property cards | Faster selection of suitable properties | Qualified inquiries per eligible listing viewer; task success/time |
| Persistent save/compare | Easier return and family discussion | Revisit and qualified inquiry among users using saves; avoid causal claims from selection alone |
| Optional email experiment | Less friction for phone-led inquiry | Accepted inquiries and qualification rate; duplicate/spam guardrails |
| Today queue/customer timeline | Less administrative work and missed follow-up | Overdue share, records without next action, median/p90 response, timed staff tasks |
| Attributed outcomes | Better marketing allocation | Source completeness and qualified/contracted outcomes by cohort |

Collect a representative baseline across working days and campaign cycles. If traffic is low, use observed task tests and staged before/after measurements rather than underpowered A/B tests. Predefine a primary outcome, eligible population, guardrails, and exposure dates. A before/after difference alone does not prove causation.

Google's field targets are LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at p75, separately for mobile and desktop. These are targets, not measured results for Attaie. [Google Web Vitals](https://web.dev/articles/vitals)

NAR's 2025 US report rates photos (83%), details (79%), and floor plans (57%) very useful among internet-using buyers. This supports testing an information-led experience, but cannot predict Kabul preferences or conversion. [NAR Exhibit 3-6](https://cms.nar.realtor/sites/default/files/2025-03/2025-home-buyers-and-sellers-generational-trends-report-04-01-2025.pdf)

## Alternatives and recommended sequence

**Visual polish first:** quickest visible refresh, but leaves misleading numbers, incomplete language, and operational friction.

**Broad new platform/rewrite:** maximum freedom, but migration and duplicate-work cost, with no evidence that the existing stack prevents the required behavior.

**Recommended: improve the existing customer journey and operational workflow in place.** Retain the stack and design foundations; connect measurable outcomes through authoritative records. This is my recommendation, not a user-approved implementation decision.

| Order | Work | Acceptance evidence |
|---|---|---|
| 1 | Correct synthetic charts, availability percentages, fallback listings, and clarify staff authentication | Known and empty fixtures; real identity mapping verified against the chosen design; no sample advertisements on empty catalog |
| 2 | Define event/metric contracts and verify inquiry handoff | One fictional inquiry produces one accepted record with context and visible ownership across retry |
| 3 | Complete Dari and refine search/cards/detail/inquiry | English/Dari task checks, keyboard and mobile checks; legitimate empty/error/zero states |
| 4 | Deliver Today queue and customer timeline end to end | Create inquiry, assign, contact, schedule/hold visit, next action; permission and concurrency checks |
| 5 | Add trusted management and marketing charts | Each displayed figure reconciles to eligible records, with scope/date/currency/cohort documented |

Reserve the more ambitious portal, automated campaigns, AI matching, and additional wrappers for evidence of unmet tasks after these foundations. Existing AI/chat features can remain where useful; additional automation should not obscure ownership or silently invent answers about price and availability.

## Artifacts and remaining uncertainty

- `2026-11-24-ux-evidence.md`: external primary sources.
- `2026-11-24-ux-assets/browser-audit.json`: local inspection measurements.
- `2026-11-24-ux-assets/calculations.json`: exact diagnostic calculations.
- `2026-11-24-ux-assets/attaie-ux-evidence.html`: two chart payloads, statically validated; visual rendering not checked.
- `2026-11-24-ux-assets/home-*.png`: local screenshots with empty API responses and blocked outbound resources. Missing external/lazy image behavior in these captures is not proof of a hosted image failure.
- `2026-11-24-audit-browser.mjs` and `2026-11-24-ux-calculations.mjs`: reproducible diagnostics.

No product source changed. Existing uncommitted Digital Vault and other work was preserved. No deployment, database mutation, live sign-in, production build, end-to-end contract/finance verification, customer interview, or field performance audit was performed. The recommendations identify what to verify and improve; they do not establish hosted release readiness.
