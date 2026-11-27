# V4.0 test report

Build environment: Linux, Python 3.13.5, Node 22.16.0. Codex CLI not present. All results are scoped to this local orchestration implementation.

| Check | Result | Evidence |
|---|---|---|
| Python automated suite | PASS — 13 tests | `evidence/test-results.txt` |
| CLI fixture lifecycle | PASS — two gates, complete, SIMULATION_ONLY | `evidence/fixture-cli-run.txt` |
| Persistent queue and concurrent claim | PASS | Unit tests |
| Project isolation and sanitized copy exclusions | PASS | Unit tests |
| Real adapter invocation shape and token usage parser | PASS with fake CLI executable only | Unit tests; no real model or Codex call |
| Verifier failure, candidate mismatch, bounded rework path | PASS | Unit tests |
| HTTP API and origin/token protections | PASS | HTTP integration test |
| Python source compilation | PASS | `python -m compileall -q devos tests` exited 0 |
| Studio browser navigation and visual audit | BLOCKED | Playwright default browser unavailable; system Chromium returned `net::ERR_BLOCKED_BY_ADMINISTRATOR` for loopback URL. No policy bypass attempted. |
| Live Codex execution / authentication | BLOCKED | `codex` executable unavailable here |
| Actual MCPs / third-party skills | NOT TESTED | Installed and configured separately on owner machine |
| Antigravity runtime / Windows | NOT IMPLEMENTED / NOT TESTED | Portable skills retained; Codex-only runtime adapter |
| Production deployment / external writes | NOT AUTHORIZED | No attempt made |

## Conclusion
The executable orchestrator, CLI, fixture flow and HTTP API were tested successfully. The provider adapter was contract-tested using a fake local executable; it is not an end-to-end provider validation. The browser front end requires a local browser smoke test. The package is a runnable local MVP with a clear path to live provider use, not a certified production autonomous platform. No claims of live AI delivery or independent human QA are made.
