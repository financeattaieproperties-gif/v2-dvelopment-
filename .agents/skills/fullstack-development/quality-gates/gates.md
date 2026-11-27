# Evidence and quality gates
Gate values: PASS, FAIL, BLOCKED, N/A with rationale. Development result: DEV_READY, FAIL or BLOCKED. QA verdict: PASS, FAIL or BLOCKED. Never substitute a checklist for executed evidence.

| Gate | Evidence |
|---|---|
| Scope | acceptance criteria, baseline, exclusions and authorization boundaries |
| Design/architecture | versioned contract, role matrix where applicable, UI state/accessibility checklist, data migration and threat risks |
| Developer verification | exact commands, exit codes, lint/type/build, unit/integration, relevant E2E and regression results |
| Independent QA | exact candidate, distinct reviewer/context, requirement-to-test matrix, defect severity, sanitized screenshots/logs |
| Release readiness | QA verdict, deployment artifact, environment/config inventory (no secret values), staging/UAT evidence, backup and recovery plan, monitoring and smoke tests |

QA PASS requires all required tests pass on the exact candidate and no unresolved critical/high defects. Lower-risk exceptions require owner signoff; candidate changes invalidate prior verdict. Missing required environment, independence or evidence is BLOCKED. Known gate failure is FAIL. Never silently downgrade risk or fabricate results.

Production: this skill does not execute releases. Provide artifact/commit, deployment instructions, migration and rollback, known risks and explicit approval requirement. A separate authorized release process performs least-privilege changes, verifies backups, smoke-tests and monitors; roll back on documented triggers. No production tests that mutate live customer data. No secret-bearing evidence or external scans beyond authorized scope.
