# Architecture — Roheen DevOS V4

```mermaid
flowchart TD
 U[Owner / local browser] --> S[Studio HTTP loopback / CLI]
 S --> O[Python runtime orchestrator]
 O --> Q[(SQLite projects / tasks / events)]
 O --> G{Scope / design approval}
 G --> A[Fresh Codex role process or fixture]
 A --> K[V3.1 skills / role definitions]
 A --> W[Project-isolated workspace / memory]
 W --> V[Owner-configured local verification argv]
 V --> H[Source SHA-256 candidate]
 H --> R[Read-only Security and QA sessions]
 R --> P[Read-only Release Docs / handoff]
 R -->|FAIL or BLOCKED| F[Manual bounded repair / reverify]
 F --> O
 A --> E[Evidence JSON / logs / token counts]
 P --> E
 P --> N[Owner reviews; separate release process]
```

The queue is persisted; every role claim runs inside a SQLite transaction, with a single active task per project. A role's execution is a fresh subprocess for the Codex adapter, not a simulated persona. Fixture mode is visibly labeled and never performs a provider call. The runtime does not expose arbitrary shell commands through HTTP except the owner-authorized local verifier on project creation. Studio binds to 127.0.0.1 and uses an origin check plus per-instance token to protect actions from ordinary cross-origin requests. It is not designed for remote or multi-user hosting.

The portable skill is the policy/knowledge layer. The runtime provides deterministic transitions, candidate checks, bounded repair, structured role outputs and persisted evidence. Studio is the local control plane. External deployment, external actions, infrastructure isolation, provider/model selection, hard billing limits, streaming traces and true within-project parallel execution are not part of this initial local release.
