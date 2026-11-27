# Specialist agent operating model
The orchestrator owns plan, contracts, integration and gate decisions. Delegate only if the runtime supports real agents; otherwise execute roles in sequence and disclose. Roles are responsibilities, not claims of running agents. Use a fresh QA context where available.

| Role | Owns | Required handoff |
|---|---|---|
| Product | user needs, scope, workflows | acceptance criteria, explicit exclusions |
| Research | UX patterns, versioned docs | evidence, assumptions, alternatives |
| UX/UI | design system, screens, accessibility | tokens, states, approved direction |
| Architect | data/API/workflow contracts and risks | ADRs, permission matrix, interfaces |
| Frontend | UI and client state | code, component tests, integration notes |
| Backend | services, API, server authorization | endpoints, tests, contract changes |
| Database | migrations, constraints, data integrity | schema diff, recovery plan, invariants |
| Experience | Stageshow/HyperFrames scoped demos | synthetic demo, review notes |
| Security | threat model and authorized checks | prioritized risks and evidence |
| Integration | assemble vertical slices and verify contracts | exact candidate and test evidence |
| Independent QA | fresh-context verification, no silent implementation | verdict, defects, evidence |
| Release/docs | staging/release checklist, documentation | rollback and operational handoff |

## Delegation contract
Every assignment must identify run ID, objective, dependencies, accepted interface, file write set, read-only resources, allowed tools, constraints, acceptance checks, output format, stop conditions and evidence. Agents do not change contracts unilaterally. Assign non-overlapping writers; coordinate shared files through orchestrator. Keep credentials out of handoffs. Review diffs and reconcile results before integration; no auto-merge.

## Parallel execution
Product/research may run together. Architecture must establish API and data contracts before frontend/backend split. Frontend/backend/database may proceed in parallel only with explicit file boundaries and stable contracts. Integration follows those handoffs. Independent QA reviews the frozen candidate after integration. Security can review architecture earlier and final candidate later. Product demos can use a verified synthetic contract and must be updated if functionality changes.
