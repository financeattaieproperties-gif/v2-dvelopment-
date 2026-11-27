# Attaie V2 redesign and release run

- Date: 2026-11-26. Mode: PROFESSIONAL; scope: REDESIGN/FULL release preparation.
- Owner approved Variant 1 refinement, preserved department responsibilities, English diagrams and EN/FA/RTL product.
- Baseline: e1b25244b61e4dda5a7c0182fbd16ee8621ce40d; remote a6114b19db871ca08a79b113df1d5e33f291b42e is already an ancestor. Git fetch completed; no merge needed. Existing dirty and staged edits preserved.
- Target: V2 testing https://website.attaieproperties.com only. No server upload or database operation performed.

## Work and evidence

- Firebase client/backend provisioning repaired; exact UID mappings retained. 15 isolated PHP login/provisioning and 14 verifier assertions pass.
- Public property failures no longer advertise fabricated records. Project error/empty states differentiated; EN/FA copy added. Four public state regressions pass.
- Staff submission policy restricted to canonical CEO/Editor permissions and separate Website Admin publishing.
- Preview catalog/contract/deposit seeds removed. Staff component extraction tests updated to actual owners.
- Staff snapshot analytics no longer infer history, inventory or revenue. Follow-up compliance distinguishes late, pending and unassessable records. Four new metric checks pass.
- Admin project cards use observed availability; public card permits zero. Synthetic property/project sparklines removed; dated series retain zeros.
- Staging canonical/noindex configuration protected; project canonical uses shared configuration. 29 Vitest tests pass.
- Windows DevOS directory creation now inherits operator ACL rather than Python's special 0700 ACL behavior. CLI global approval option precedes `exec`. Doctor passes; real project `2f8d657ece2e` invoked and blocked on provider workspace routing. Do not describe this as a successful full DevOS pipeline.
- Actual DevOS failure: `workspace routing owner is unavailable`; provider exhausted transport retries. No generated role approval was fabricated.
- Canva generated 18-page deck and overview image. Text review found factual mistakes; transaction/preview API errors prevent correction. See diagram CANVA-REVIEW.md. Local 18-diagram atlas has reviewed source, SVG accessibility, browser bounds checks and screenshots.
- Native preview-disabled source builds use testing endpoints and safe signing configuration. Fresh Android debug build passed; all 15 bundled files match current www source. APK: releases/android/AttaieSalesCRM-v2.0.1-v2-testing-20261126-debug.apk; SHA256 3cab3e252b89f0d55ff9fb7e1f4120179ca0008d916e99fd4c2a6f55ff2ab543.
- Call Center Windows NSIS and portable 2.0.1 builds completed. Installed login/session/device behavior remains unverified.
- Public navbar review found white text on a near-white background. Replaced transparent header with a readable white surface and navy labels; regression passes.
- Latest web candidate: releases/manual-staging-dashboard-completion-20261126T205109Z. Public ZIP 225 entries, private ZIP 12 entries; both verified. Source type checks pass for website/Admin/Staff. Earlier candidate 203512Z passed 40 local startup viewport cases and lint on 60 PHP files. Final navbar candidate smoke is recorded separately.
- Checks: 29 Vitest tests, 85 scoped Node checks before navbar addition, 24 root Node regressions, 13 DevOS runtime/Studio tests, 36 diagram self-check/geometry checks. Tests overlap; counts are not a unique-case total. Migration/database tests were not part of these passing checks.
- DevOS real adapter produced BLOCKED structured output: local runtime provisioning could not start shell/Node tools; no Product handoff generated. This supplements transport routing errors above. No repeated real-run attempt or approval bypass performed.

## Known gates

- Developer checks: ongoing integration; exact final candidate not yet frozen.
- Independent QA: BLOCKED; specialist account quota exhausted. Self-checks are not independent QA.
- Database rehearsal: BLOCKED; no disposable MySQL/MariaDB listener configured. No existing/live database used.
- Hosted Firebase, PHP/MySQL, private files, uploads and actual role workflows: unverified.
- iOS archive/signing and physical-device behavior: unverified; macOS/Xcode required.
- Full screen-by-screen redesign, explicit language URLs, all PHP/client metadata parity and complete end-to-end workflow review remain open in the implementation plan.
- Final release status: NOT READY for deployment acceptance. Prepared artifacts do not satisfy these gates.

No global memory files were changed. No commit, push or main-domain deployment performed by this run.
