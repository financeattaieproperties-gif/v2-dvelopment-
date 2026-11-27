# Persistent project memory
Use project-local `.workflow/` only, respecting repository instructions. Store minimal durable information and separate facts from assumptions. Never persist secrets, raw sensitive logs, production customer records or unrelated user data. Keep proprietary docs within authorized project boundaries.

Suggested files (create only as needed):
- `project.md`: goals, stack, owners, constraints, environment descriptions without credentials.
- `requirements.md`: scoped criteria and exclusions, with change history.
- `architecture.md`: contracts, module boundaries, data/role model.
- `design-system.md`: tokens, components, accessibility and localization.
- `decisions.md`: dated ADRs with context, alternatives, decision, consequences, owner status.
- `lessons-learned.md`: verified issue, root cause, evidence and prevention.
- `progress.md`: last verified candidate, open tasks and QA status.
- `runs/<run-id>/run-record.md`: run-specific evidence and links to sanitized artifacts.

Read relevant records before work; check against actual code and current user instructions. Mark stale/conflicting information. Update run records as work happens. At closure propose durable memory changes; review consequential architecture/skill changes with owner. Never silently edit the global skill, weaken quality gates, or promote an unverified pattern. Keep skill updates versioned and reviewable.
