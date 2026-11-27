# Modes, scope and lifecycle

| Mode | Use | Minimum gates |
|---|---|---|
| RAPID | prototype, small fix/component | bounded scope, baseline/reproduction, relevant tests, honest limitations |
| PROFESSIONAL | client site, CRM feature, normal full-stack project | architecture/contracts, design where relevant, tests, independent QA handoff, release packet |
| ENTERPRISE | multi-branch, financial, sensitive or high-risk app | professional plus explicit threat model, migration rehearsal, independent QA required, performance budget, UAT and owner release authorization |

Legacy scope FULL / FEATURE / REDESIGN / COMPONENT / FIX remains available independently of mode. For example PROFESSIONAL + FEATURE. QUICK maps to RAPID; FEATURE and FULL are scope values, not risk modes.

## Frontend workflow
Inspect current UI and real API, define user journeys and responsive/accessibility criteria. Research only when useful. Choose design direction and components (licensing/dependency review). Implement real data states with agreed contract; use isolated fixtures for early development. Test keyboard, focus, RTL if required, viewport layout, reduced motion, loading/errors, and representative journeys. Optional product demo stays isolated from production data. Hand off screenshots and test evidence.

## Backend workflow
Inspect stack, auth, schema and data ownership; define contracts, business invariants, permissions, transactions, migration/recovery and error semantics. Write tests before behavior changes where practical. Implement small slices, verify negative auth paths and concurrency, test migrations on disposable data. Record actual commands/results and API/schema changes. Hand off to integration.

## Full-stack workflow
1. Discovery and scope: repo baseline, problem, constraints, acceptance criteria. Gate: coherent scope and safe environment.
2. Architecture: agreed contracts, role matrix, data invariants, threat model as appropriate. Gate: interface agreement before parallel coding.
3. UX/UI: responsive design tokens, states and accessibility criteria. Gate: adequate direction, owner signoff for major subjective decisions if not already approved.
4. Implementation: vertical slices; specialists operate within assigned scope. Gate: required unit/contract tests and no hidden mocks.
5. Integration: actual build, tests and representative browser/API flows. Gate: exact candidate with DEV_READY evidence.
6. QA: separate fresh reviewer validates candidate and records PASS/FAIL/BLOCKED. Fix and revalidate changes. Gate: QA PASS if required; no unresolved high/critical issues.
7. Experience/docs: optional demos/videos plus applicable diagrams and handover material. Gate: accurate claims and reviewed outputs.
8. Staging/release handoff: documented config, migration rehearsal, UAT and rollback. Gate: release packet; production action separately authorized and executed outside this skill.
9. Learning: verified facts and lessons in `.workflow/`, owner-reviewed durable changes. Gate: report memory changes and open risks.

## Example: property reservation in multi-branch CRM
Scope PROFESSIONAL/FEATURE or ENTERPRISE when financial exposure warrants. Agree one-active-reservation constraint, CEO-only approval, branch/object permissions, state transitions and idempotency. Backend enforces transaction and authorization; frontend exposes valid actions and handles conflicts. Concurrent reservation attempts should result in at most one active reservation. Test distinct branch identities and forbidden approval via direct API. QA independently validates exact candidate; use synthetic property/customer data for Stageshow demos. Release handoff includes database recovery strategy.
