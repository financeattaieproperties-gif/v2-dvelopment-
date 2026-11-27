# Roheen DevOS V4.0

**Local agent orchestration starter platform.** V3.1 portable skills + executable Python/SQLite runtime + browser-based Studio. It is a functioning local orchestration package, not a hosted service or a guarantee of autonomous production software delivery. Live Codex execution requires your installed, authenticated CLI and has not been exercised in the build environment.

## 1. Start on macOS or Linux

Requirements: Python 3.10+ (tested 3.13), a modern browser, and terminal access. No Python dependencies for the runtime. Windows is not tested. Extract the archive, open Terminal, and `cd` into the extracted `roheen-devos-v4` directory.

```bash
python3 -m devos doctor
python3 -m devos studio
```

Open **http://127.0.0.1:8765/** in your browser. If the port is busy, stop the other process or choose `python3 -m devos studio --port 8766`. Use the numeric loopback address, not `localhost`. Keep the terminal open. Press Ctrl+C to stop the Studio. It is local only: never expose the HTTP server through a tunnel, reverse proxy or public interface. It has CSRF/origin protections, but no multi-user authentication or TLS.

## 2. First run — free orchestration fixture

The Studio pre-fills the Attaie Properties pilot brief. Select **Fixture** and click Create project. Click **Run / continue** until the scope approval gate; inspect the role summary and workspace files, approve, and run again. Repeat for design approval. The final result is `SIMULATION_ONLY`. This tests the queue, role routing, persistence and gates; it creates a minimal fixture HTML, not a generated real estate design. It does not invoke any AI provider or paid tool.

CLI equivalent:

```bash
P=$(python3 -m devos create --name 'Attaie Properties' --brief examples/attaie-landing.md)
python3 -m devos run "$P"
python3 -m devos status "$P"
python3 -m devos approve "$P"
python3 -m devos run "$P"
python3 -m devos approve "$P"
python3 -m devos run "$P"
python3 -m devos inspect "$P"
```

## 3. Real specialist sessions using Codex

Install/configure Codex through its official instructions, and check `codex --version`, `codex exec --help`, and `python3 -m devos doctor`. Authenticate through Codex normally. DevOS does not request or store API keys and does not install third-party skills. Your account, model, quota, API charges and MCP access remain managed by Codex. Confirm actual CLI flags in your installed version. The adapter uses separate fresh `codex exec --json --sandbox ... --ask-for-approval never --skip-git-repo-check --output-schema ... --output-last-message ... -` invocations. The `--ask-for-approval never` policy declines sandbox escalation; it does **not** grant unrestricted access. Review configured MCPs and permissions before enabling the adapter; disable any production, payment, external-write or other sensitive connectors in the profile you use. The runtime cannot independently sandbox MCP actions or enforce an agent's natural-language promises.

The adapter places the global approval policy before the subcommand: `codex --ask-for-approval never exec ...`. This ordering is required by Codex CLI 0.172.0.

In Studio select **Codex**, supply a real verification command as a JSON argv array (e.g. `["npm","test"]` only if that project will define an npm test script), and acknowledge real execution. A real run without a verifier blocks at verification. For the CLI, pass `--allow-real` explicitly:

```bash
P=$(python3 -m devos create --name 'Attaie Properties' \
  --brief examples/attaie-landing.md --adapter codex --profile landing \
  --mode professional --verify '["npm","test"]' --allow-real)
python3 -m devos run "$P"
# Inspect the scope, approve, run again, inspect design, approve, run again.
python3 -m devos inspect "$P"
```

Add test expectations to the brief, including a runnable `npm test` script if using that verifier. Install needed dependencies in the isolated workspace yourself if network-restricted. For backend/database work choose `--profile fullstack` and set a meaningful verification command for the selected stack; provide test databases and credentials only through a safe isolated mechanism, never production. Antigravity can still use the bundled portable skills, but is **not** a runtime adapter in V4.0.

### Existing projects

Use CLI `create ... --source /path/to/clean-copy` to copy a curated local project into a new DevOS workspace, rather than editing the original. It skips known cache/build directories, `.git`, existing DevOS records, `.env*`, common private-key extensions, and symlinks. These exclusions are **not a secret scanner**; inspect and sanitize the source first, remove client data/credentials and use only code you have permission to copy. Original `AGENTS.md` instructions are preserved with DevOS boundaries appended. Existing source is not imported through the web dashboard. DevOS never pushes or merges the original repository. Review the new workspace diff manually before transferring changes.

## 4. Runtime workflow

- Product → owner scope approval → Research → Architect → Design → owner design approval.
- Full-stack profile adds Database and Backend; both profiles run Frontend. Professional/Enterprise add Motion; Rapid omits it.
- Integration → trusted verification command → fresh read-only Security session → fresh read-only QA session → read-only Release Docs session → handoff packet.
- Each role reads its own V3.1 instructions, the mode, routing registry and gate standards. Real writing roles must produce a nonempty `.workflow/roles/<role>.md`; they return structured verdicts and evidence. Third-party skills/MCPs are discovered by the provider; none are asserted installed. Read-only reviews use separate contexts but are still AI reviews, not human certification or guaranteed independence from model biases.
- Scope and design approval halt the queue. A gate never advances on FAIL or BLOCKED. No unattended retries or deployments. The three modes share most pipeline stages; Enterprise uses stricter written instructions, not a dedicated enterprise isolation environment.
- SQLite prevents duplicate claims of the same task. Different projects can run concurrently; within a project roles are deliberately sequential (no shared write races). Provider calls time out after 900 seconds and the local verifier after 300 seconds; each task may be manually retried up to four attempts, and review-stage rework may be restarted up to three repair cycles. The runtime caps real specialist task attempts at 40 per project. These are operational bounds, not dollar or token budgets. The dashboard reports available input/output token counts from Codex JSON events, not billing estimates.
- The verifier runs a trusted argv directly on your computer, without a shell and outside Codex sandboxing. It can execute project code with your local permissions. Only approve commands and workspaces you trust; use a disposable OS user/VM for unknown code. No automatic testing of live customer data. The process inherits the local environment; do not expose secrets. No external publishing is supported.

## 5. Inspect, recover, reverify

```bash
python3 -m devos list
python3 -m devos status "$P"
python3 -m devos inspect "$P"
python3 -m devos retry "$P"    # failed/blocked step only
python3 -m devos run "$P"
python3 -m devos repair "$P"   # after a blocked/failed integration or review gate
python3 -m devos run "$P"      # re-runs integration, verifier, reviews, handoff
```

If Studio or terminal was interrupted while a task was `running`, first confirm no worker or provider process for that project is still alive, inspect partial files and logs, then explicitly mark interrupted work blocked:

```bash
python3 -m devos recover "$P" --worker-stopped
python3 -m devos retry "$P"
python3 -m devos run "$P"
```

There is no automatic replay after interruption (prevents accidental duplicate external operations). There is no provider cancellation API. Killing Studio may leave a provider process alive; confirm before recovery. An already completed project is not automatically re-opened if you edit it: create a new isolated run using a reviewed source copy. Gate checks freeze a source digest after verification and verify it before review and handoff. The digest excludes `.git`, `.workflow`, `.agents`, `node_modules`, Python/JS caches and common build-output folders; it is not a deployment-artifact checksum. Treat build artifacts as separately reviewed before any deployment.

## 6. Data, security and portability

Default storage: `~/.roheen-devos/` (set `DEVOS_HOME` or `--home /path` before the subcommand). Keep this folder private. New project directories use restrictive POSIX permissions. SQLite stores tasks and state. Project workspaces contain copies of the portable skills, project memory templates and role handoffs. Evidence directories store provider raw stdout/stderr, structured outputs and a final `HANDOFF.md`. Raw logs may contain prompt/code/tool output; inspect and redact before sharing. Never put secrets or sensitive customer data in the brief, memory or evidence. Workspace isolation depends on OS permissions and the provider sandbox; it is not a container/VM boundary.

The bundled `skills/fullstack-development` and `skills/independent-qa` are the preserved V3.1 skills. Copy them to your coding agent's configured skill directory if you want to use them outside the runtime; back up existing versions. The runtime copies them into each new workspace's `.agents/skills/`. External skills such as Taste, Mobbin/Stitch/Context7, Stageshow, HyperFrames and Motion are not vendored, and their availability must be checked separately.

## 7. Tests and limitations

```bash
python3 -m unittest discover -s tests -v
# Optional UI smoke (requires Playwright and Chromium on your own machine):
python3 -m pip install playwright
python3 -m playwright install chromium
PYTHONPATH=. python3 tests/browser_smoke.py evidence
```

The supplied browser smoke is intended for a disposable test environment; it uses a fixture and tests local navigation, approvals and responsive width. Use a trusted browser installation. See `docs/TEST-REPORT.md` and `evidence/test-results.txt` for actual results. No real Codex session, Antigravity provider, remote deployment, hosted Studio, independent human review or multi-browser production UI audit has been verified.

## 8. Architecture and output statuses

See `docs/ARCHITECTURE.md`. `SIMULATION_ONLY` is a fixture result, not a product. `REVIEWED_HANDOFF` means the configured local verifier and role reviews returned PASS against the frozen source digest. This does not guarantee feature correctness, security, independent human approval, staging, deployment readiness or production authorization. `FAIL` indicates a known failed gate; `BLOCKED` indicates missing evidence or a runtime condition requiring intervention.

Official Codex references: https://developers.openai.com/cookbook/examples/codex/build_iterative_repair_loops_with_codex ; https://developers.openai.com/blog/eval-skills/ .
