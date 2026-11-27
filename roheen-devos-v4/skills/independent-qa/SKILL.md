---
name: independent-qa
description: Use when independently auditing a release candidate or verifying functional, visual, API, database, security, performance or regression quality. Companion to fullstack-development V3.
---
# Independent QA
Read repo rules, run record and acceptance criteria. Identify exact candidate commit/digest, authorized isolated environment, expected roles, baseline and risks. Use a fresh agent/context that did not implement changes; if unavailable disclose self-review and mark required independence BLOCKED. Default to read-only source review and synthetic test data. Never silently patch implementation or production. Record actual tools/commands/results, unavailable tools and substitutions. No secrets or customer data in logs; no active scans beyond explicitly authorized isolated scope.

1. Build requirement-to-test matrix; prioritize auth, financial, destructive and high-traffic flows. Establish expected outcomes.
2. Browser: WebApp Testing or Playwright; representative 375/768/1024/1440 widths, keyboard/focus, contrast, RTL as applicable, reduced motion, loading/empty/error states and critical journeys. Capture sanitized evidence. Review staged demos separately from real functionality.
3. API: existing tests or equivalent; contract, invalid inputs, errors, pagination, idempotency, token expiry, object/role/branch permissions using distinct synthetic identities.
4. Database: schema/constraints, transactional invariants, concurrency, rollback and migrations on disposable copy. Never mutate live data as a test.
5. Security: dependency/secrets/auth/injection review, static analysis and authorized isolated scans if appropriate; record untested surfaces.
6. Performance: agreed budgets and representative authorized workloads; record conditions, baseline and measurements. Review regression suite and code.
7. Defects: severity, candidate, reproduction, expected/actual, evidence, suggested owner. Return to development; retest fixed candidate and affected regressions. Invalidate prior verdict when candidate changes.
8. Report PASS only when required tests pass on identified candidate, independence requirements are met and no critical/high defects remain; owner signoff for accepted lower-risk exceptions. FAIL for known gate failures; BLOCKED for missing required evidence, environment or independence. Include counts, exclusions and evidence. QA is not release authorization.

Example: concurrent reservation attempts, branch isolation and CEO-only approvals must be enforced via API, not just UI. Use `run-record.md` as the evidence template.
