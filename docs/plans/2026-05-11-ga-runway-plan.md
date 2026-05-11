# Sovereign Code — GA Runway Plan (8 Weeks → v1.0.0)

**Plan Date:** 2026-05-11
**Target GA:** 2026-07-06 (Mon, end of W8)
**Owner:** Sovereign AI Labs
**Status:** Active — Spec/Plan phase of super-dev pipeline (Spec → Plan → Impl(TDD) → Test → Review → Ship)

This is the single source of truth for what must ship before tagging `v1.0.0`. Every ticket below has an explicit Acceptance Criteria. Tickets are committed using the pattern `feat(vN.N.N-Tn): …` per repo convention. Source-of-truth lives here; PRD `docs/en/Sovereign-Code-PRD.md` is realigned in W1-T1 to match.

---

## Pipeline Gates (per ticket)

1. **Spec** — Issue/ticket text with acceptance criteria copied from this file.
2. **Plan** — `docs/plans/2026-05-…-Tn-*.md` if the change spans >1 file or >100 LOC.
3. **Impl (TDD)** — Tests written first; commit `test: red` then `feat/fix: green`.
4. **Test** — `cd apps/desktop && npm test` and per-service `pytest -q` both green. New tests required.
5. **Review** — PR description references this plan ticket ID; one maintainer LGTM.
6. **Ship** — Squash-merge to `main`; tag-relevant tickets bump `package.json` version.

No ticket merges if it leaves the build red or removes test coverage. P0 unresolved → W(n+1) cannot start.

---

## Risk Register (P0–P10)

| ID | Risk | Severity | Mitigation Ticket |
|----|------|----------|-------------------|
| P0 | PRD vs code mismatch (Models HF UI, Training mock data, Federation legacy) | Critical | W1-T1, W1-T2, W1-T3, W2-T4, W2-T5 |
| P0 | No signed release pipeline; no auto-update | Critical | W4-T11, W4-T12, W8-T23 |
| P0 | 18 services accept unauthenticated calls | Critical | W3-T7, W3-T8 |
| P1 | 18 Python services have zero CI coverage | High | W4-T10 |
| P1 | No e2e / cross-service integration tests | High | W7-T19 |
| P1 | Observability lives only in voice-service | High | W6-T17, W6-T18 |
| P2 | China mirror toggle is "paste this command" | Medium | W2-T5 |
| P2 | 18 hot-path TODOs incl. 3 in `training-service/main.py` | Medium | W2-T6, W7-T22 |
| P2 | In-memory persistence in multiple services | Medium | W6-T16 |
| P3 | "10 Innovations" are design-only | Low | W5-T14, W5-T15 (1 of 10 only) |
| P3 | No SBOM/SAST/dep scan; signing not exercised | Low | W4-T13, W8-T24 |
| P3 | better-sqlite3 native build unverified on macOS/Linux | Low | W4-T11 |
| P3 | Marketing assets (pricing page, onboarding video) drift | Low | W8-T25 |

---

## W1 (2026-05-12 → 05-18) — Truth Reconciliation

Goal: stop the bleeding caused by PRD claiming "✅ Built" for unbuilt features.

### W1-T1 — Rewrite PRD §1.4 to reflect code reality
- **Acceptance:** §1.4 status table column updated; entries that have stub/mock UI flipped to `⚠️ Partial` with code reference and one-line evidence. New "Known gaps for v1.0" subsection links to W2 tickets.
- **Files:** `docs/en/Sovereign-Code-PRD.md`
- **Tests:** docs-only; no code tests.

### W1-T2 — Delete legacy `Federation.tsx`; consolidate to `FederationCore`
- **Acceptance:** Sidebar shows a single "Federation" entry routing to `FederationCore`. Old screen file deleted. ≥4 vitest cases assert nav + route. Hardcoded "Finance AI Consortium" / "Open Source Coder Commons" strings grep-absent from `apps/desktop/src`.
- **Files:** `apps/desktop/src/renderer/screens/Federation.tsx` (delete), `Sidebar.tsx`, `MainContent.tsx`, routing tests.

### W1-T3 — Wire `Training.tsx` to real service (kill mock runs)
- **Acceptance:** Remove the 3 hardcoded `trainingRuns`. Add `GET /api/v1/training/history` on training-service (≥8 pytest, incl. empty/some/error). `useTrainingService` exposes `history` + `progress` derived from `is_training`. GPU line reads from `useSystemStore`. ≥6 vitest assert real-data render. `grep "RTX 4090" apps/desktop/src` returns 0.
- **Files:** `services/training-service/main.py`, `services/training-service/training/history.py`, `apps/desktop/src/renderer/screens/Training.tsx`, `apps/desktop/src/renderer/hooks/useTrainingService.ts`.

**W1 Exit Criteria:** `apps/desktop && npm test` green; PRD diff reviewed; demo of Training screen shows real data even if `history` is empty.

---

## W2 (05-19 → 05-25) — HF Download Closed-Loop

Goal: a new user can install → switch mirror → download model → chat. Today they cannot.

### W2-T4 — HuggingFace model browser UI
- **Acceptance:** `Models.tsx` gains tabs `[Installed (N)] [Download from HuggingFace]`. New components: `HuggingFacePanel`, `ModelCard`, `DownloadProgress`, `StaffPicks` (6 curated GGUF models). `useModelManager.downloadModel` wired to button. Polling shows progress bar. ≥10 vitest, ≥4 pytest on model-manager `/download`. Manual E2E: Llama 3.1 8B Q4_K_M downloads end-to-end on Win/macOS.
- **Files:** `apps/desktop/src/renderer/screens/Models.tsx`, new `apps/desktop/src/renderer/components/models/{HuggingFacePanel,ModelCard,DownloadProgress,StaffPicks}.tsx`.

### W2-T5 — Mirror toggle calls real `/api/v1/mirror/switch`
- **Acceptance:** `MirrorSelector` becomes radio (`Official` / `China Mirror`). Selection triggers `POST /api/v1/mirror/switch`. Success/failure toast. CLI-instruction string removed. ≥4 vitest covering switch success, switch error, network failure. Model-manager pytest: ≥3 cases for switch endpoint.
- **Files:** `apps/desktop/src/renderer/components/common/MirrorSelector.tsx`, `apps/desktop/src/renderer/hooks/useModelManager.ts`, `services/model-manager/main.py` (if endpoint adjustment needed).

### W2-T6 — Close training orchestrator wiring TODOs
- **Acceptance:** `services/training-service/main.py` line 459/491/519 `TODO: Wire with actual orchestrator/registry instance` removed; real injection via app state or factory. ≥8 new pytest covering happy + failure injection. baselines/benchmark TODOs in `metrics.py` either implemented or moved to issue with `# Tracked-In: #NNN` marker.
- **Files:** `services/training-service/main.py`, `services/training-service/training/orchestrator.py`.

**W2 Exit Criteria:** Internal demo: cold-launch installer → switch to China mirror → download starter model → first chat reply in ≤ 5 minutes. No mock data visible anywhere in main flows.

---

## W3 (05-26 → 06-01) — Security Hardening: Local Token Auth

Goal: any process that can `curl localhost:8001` cannot. Enterprise prerequisite.

### W3-T7 — `services/_shared/auth.py` module (TDD)
- **Acceptance:** New module exports `verify_local_token` FastAPI dependency. Reads token from `$SOVEREIGN_LOCAL_TOKEN` or `$SOVEREIGN_LOCAL_TOKEN_FILE` (default `~/.sovereign-code/local.token`). Uses `hmac.compare_digest`. Returns 401 on missing/wrong header. Dev mode env `SOVEREIGN_LOCAL_AUTH_DISABLED=1` bypasses (warned in startup log). ≥8 pytest covering: missing header, wrong scheme, wrong token, env token match, file token match, missing-file-error, disabled-mode-allow, constant-time-compare smoke.
- **Files:** new `services/_shared/{__init__.py,auth.py}`, `services/_shared/tests/test_auth.py`.

### W3-T8 — Apply guard to sensitive endpoints
- **Acceptance:** `Depends(verify_local_token)` attached to: `enterprise-data-service` all routes; `training-service` `/api/v1/training/start`, `/api/v1/training/feedback`, `/api/v1/training/history`; `model-manager` `/api/v1/models/{id}/download`, `/api/v1/mirror/switch`; `execution-trace-service` all `/exec*`. Electron main process generates token on first boot, writes to `~/.sovereign-code/local.token`, exposes to renderer via preload `window.electronAPI.getLocalToken()`. All desktop service clients add `Authorization: Bearer ${token}` header. ≥2 pytest per service: 401 without token, 200 with token.
- **Files:** four services' `main.py`, `apps/desktop/src/main/index.ts`, `apps/desktop/src/preload/index.ts`, `apps/desktop/src/renderer/services/*Client.ts`.

### W3-T9 — Tighten execution-trace sandbox
- **Acceptance:** Python runner sets `resource.setrlimit(RLIMIT_CPU, …)`, `RLIMIT_AS`, `RLIMIT_NOFILE`; Windows uses Job Object kill-on-close. Wall-clock budget enforced via `signal.alarm` (POSIX) / threading watchdog (Win). ≥6 pytest including: fork bomb (rejected), memory bomb (killed), infinite loop (timed out), legitimate code (≤200ms).
- **Files:** `services/execution-trace-service/execution_trace/python_runner.py`, tests.

**W3 Exit Criteria:** `curl -X POST localhost:8001/api/v1/training/start -H 'Content-Type: application/json' -d '{}'` returns 401. Same call from inside Electron app succeeds. Sandbox tests green.

---

## W4 (06-02 → 06-08) — Real CI/CD

### W4-T10 — `services-ci.yml` GitHub Actions workflow
- **Acceptance:** Matrix over all 18 services; per service: `pip install -r requirements.txt && pytest -q`. Caches pip. Blocks merge on red. Runtime ≤ 12 min via matrix parallelism.
- **Files:** `.github/workflows/services-ci.yml`.

### W4-T11 — `release.yml` multi-OS signed installer pipeline
- **Acceptance:** Triggered by tag `v*-rc*` and `v*`. Matrix `ubuntu-latest / macos-13 / windows-latest`. Each builds desktop via `npm run build:<os>`. Code-sign with secrets `WIN_CSC_LINK`/`WIN_CSC_KEY_PASSWORD` (Win), `CSC_LINK`/`APPLE_ID`/`APPLE_APP_SPECIFIC_PASSWORD`/`APPLE_TEAM_ID` (macOS notarization). Artifacts uploaded to GitHub Release as draft. Includes `.yml` + `.blockmap` for auto-updater.
- **Files:** `.github/workflows/release.yml`, `apps/desktop/electron-builder.json` (publish provider = `github`).

### W4-T12 — `electron-updater` integration
- **Acceptance:** Renderer "About → Check for Updates" wired. On startup, silent check; user prompted before download. Disable in dev. ≥4 vitest for update store states (idle/checking/available/downloaded). Manual check from a 1.0.0-rc1 build sees rc2 availability.
- **Files:** `apps/desktop/src/main/index.ts`, `apps/desktop/src/main/updater.ts` (new), `apps/desktop/src/renderer/store/updateStore.ts` (new).

### W4-T13 — Supply-chain scan gates
- **Acceptance:** Three new CI jobs (advisory at first, blocking by W8): `pip-audit` per service; `npm audit --omit=dev --audit-level=high` for apps; `trivy fs --severity HIGH,CRITICAL .` for repo. Findings written to `SECURITY-REPORT.md` artifact.
- **Files:** `.github/workflows/supply-chain.yml`.

**W4 Exit Criteria:** Cutting tag `v1.0.0-rc1` produces signed `.exe / .dmg / .AppImage` artifacts attached to a GH Release draft. Installing rc1 on a clean Win 11 VM completes; auto-updater can detect rc2.

---

## W5 (06-09 → 06-15) — GA Hero Feature: Context-Aware Model Router

Pick exactly 1 of the 10 innovations. Selected: **CAMR** because impact:effort = high:low and changes are localized to `model-manager`.

### W5-T14 — `ModelRouter` in model-manager
- **Acceptance:** New `services/model-manager/model_router.py` with `TaskClassifier` (regex+heuristic on prompt/file ext), `VRAMSchedule` (queries `/api/v1/system/gpu` or `pynvml`), `PerformanceLedger` (SQLite-backed acceptance/latency table). Endpoint `POST /api/v1/route` returns chosen model id + reason. ≥20 pytest including: completion-task → small model, refactor-task → bigger model, VRAM exhausted → fallback, ledger feedback shifts choice.
- **Files:** new files under `services/model-manager/`, additions to `main.py`.

### W5-T15 — Desktop "Auto" model mode
- **Acceptance:** Model selector gains `Auto` option. Chat and Completion call `/api/v1/route` to pick model per request when Auto. Manual override persists per session. ≥6 vitest. Bench script `scripts/bench-router.mjs`: HumanEval 30-task subset latency improvement ≥30% vs always-32B; pass@1 not lower than always-32B.
- **Files:** `apps/desktop/src/renderer/components/ModelSelector.tsx`, `apps/desktop/src/renderer/screens/Chat.tsx`, `apps/desktop/src/renderer/screens/CodeCompletion.tsx`, `scripts/bench-router.mjs`.

**W5 Exit Criteria:** Bench numbers committed to `docs/en/17-benchmark-baseline-table.md` showing CAMR perf win. Auto mode default for new installs (opt-out).

---

## W6 (06-16 → 06-22) — Persistence + Observability

### W6-T16 — Persist in-memory services to SQLite
- **Acceptance:** `plugin-registry`, `persona-council`, `memory`, `federation` peer registry switch to SQLite (file under each service's `data/` dir, mounted as docker volume). One-time migration script `services/<svc>/scripts/migrate.py`. Restart-survives test added per service.
- **Files:** four services + tests.

### W6-T17 — Prometheus/Grafana/Loki stack
- **Acceptance:** All 18 services use `prometheus-fastapi-instrumentator`. Compose adds `prometheus`, `grafana`, `loki`, `promtail`. Prebuilt Grafana dashboard JSON committed (`infra/grafana/dashboards/sovereign-overview.json`). Desktop "Health" screen reads `/metrics` for live status.
- **Files:** every service `main.py` (one-line addition), `docker-compose.yml`, `infra/` directory.

### W6-T18 — Structured logging + requestId propagation
- **Acceptance:** All services use `structlog` (or loguru) with JSON formatter; middleware injects `request_id` (UUID4) into context; client adds `X-Request-Id` header; Loki query by request id returns full chain across services. Sentry/Glitchtip optional, behind env flag.
- **Files:** add `services/_shared/logging.py`, wire into each `main.py`.

**W6 Exit Criteria:** Pull network cable on training-service container; Grafana alert fires within 90s; Loki query for any 5xx returns full request trace.

---

## W7 (06-23 → 06-29) — E2E, First-Run, Performance

### W7-T19 — Playwright cross-OS e2e
- **Acceptance:** 4 happy paths recorded on Win/macOS/Linux: Chat reply ≤5s, Model download ≤90s for 1GB-class quant, Training job submit→complete (tiny synthetic), Knowledge add→search. CI artifact: screenshots + traces. Workflow `.github/workflows/e2e.yml`.
- **Files:** new `apps/desktop/e2e/` directory; CI workflow.

### W7-T20 — First-run guided onboarding
- **Acceptance:** Desktop on first launch: detect VRAM (via system info), recommend exactly one starter model, one-click download with progress, warm-up after install, show "You're ready" card with link to docs. ≥6 vitest covering states. UX reviewed.
- **Files:** new `apps/desktop/src/renderer/screens/Onboarding.tsx`, store, hook.

### W7-T21 — Performance budget baked into CI
- **Acceptance:** Bench script measures first-token latency and tokens/sec on a `Qwen2.5-Coder-7B-Q4_K_M` reference model. CI job (non-blocking advisory) records numbers per commit. Targets per PRD §4.2.1: first-token <500 ms; ≥30 tok/s. Regression alerting via PR comment.
- **Files:** `scripts/bench-perf.mjs`, `.github/workflows/perf.yml`.

### W7-T22 — TODO sweep
- **Acceptance:** All 18 source-tree TODOs from `grep -nE "TODO|FIXME" apps/desktop/src apps/vscode-extension/src services` (excluding tests/sample data) are either implemented or annotated `# Tracked-In: #NNN`. None remain unannotated.

**W7 Exit Criteria:** Clean install on each OS, run guided onboarding, hit perf targets, no orphan TODOs.

---

## W8 (06-30 → 07-06) — Freeze → RC → GA

Mon 06-29: **Code Freeze** (P0/P1 only). Wed 07-01: RC2. Fri 07-03: RC3 if needed. Mon 07-06: GA tag.

### W8-T23 — Signed release + dual distribution
- **Acceptance:** `v1.0.0` tagged; release.yml produces signed installers for Win/macOS/Linux; macOS notarized; assets uploaded to GH Release + mirrored to Aliyun OSS bucket `sovereign-code/releases/` (China download path). SHA-256 sums signed with cosign.

### W8-T24 — Compliance pack
- **Acceptance:** `syft .` SBOM (SPDX-json) attached to release. `SECURITY.md` published. `docs/en/COMPLIANCE.md` lists data flow, network egress claims, encryption-at-rest stance.

### W8-T25 — Marketing-code alignment
- **Acceptance:** `README.md`, `README_CN.md`, `RELEASE_NOTES_v1.0.0.md`, `docs/en/PRICING_PAGE_COPY.md` reference v1.0 only, no stale v0.x claims. PRD v3.0 → v3.1 footer marks GA reached.

### W8-T26 — Day-0 gradual rollout
- **Acceptance:** 3 internal alpha users + 10 external beta cohort installs v1.0.0; 72-hour observation; Grafana zero `CRITICAL` alerts; ≥80% telemetry success metric (opt-in). After window passes, public download link goes live.

**W8 Exit Criteria:** Release page lists ≥ 3 platform artifacts; cosign verify passes; Grafana 24h clean; first 13 users completed first-run without manual intervention.

---

## Open Questions (for product owner before W1 starts)

1. CAMR (W5) is the chosen Hero Feature — confirm or swap (alternatives: PBR, ACW).
2. Aliyun OSS bucket name for China mirror distribution — provision and provide secret to W8-T23.
3. Signing certificates for Win (EV recommended) and Apple Developer Program enrollment — needed by W4-T11.
4. Beta cohort identity (W8-T26) — 10 external users to recruit by W6.

---

## Out of Scope for v1.0.0 (Deferred to v1.1+)

- Innovations 1, 2, 4–10 (only CAMR ships in GA).
- Federation actual multi-peer training (only `FederationCore` UI + single-peer round).
- Plugin marketplace third-party publishing.
- Cloud-sync of PKL across machines.
- Linux ARM64 builds.
- Mobile companion app.

---

_End of GA Runway Plan._
