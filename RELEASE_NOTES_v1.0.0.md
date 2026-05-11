# Sovereign Code v1.0.0 — Release Notes

**Release date:** 2026-07-06
**GA Runway:** 8-week plan, fully delivered — see
[`docs/plans/2026-05-11-ga-runway-plan.md`](docs/plans/2026-05-11-ga-runway-plan.md)

## TL;DR

Sovereign Code is a **100% local AI engineering platform**. v1.0.0 is the
first General Availability release. It ships:

* Signed installers for Windows, macOS (x64 + arm64), and Linux
  (AppImage + deb), distributed via GitHub Releases **and** Aliyun OSS
  (China path).
* 18 backend services, each containerised, scrape-able by Prometheus, and
  log-aggregated via Loki.
* Local-token authentication on every sensitive endpoint; Electron renderer
  attaches `Authorization: Bearer <token>` to every protected call.
* CAMR — **Context-Aware Model Router** — the GA hero feature: auto-routes
  prompts to the optimal local model and learns from your acceptance rate.
* PRD §4.2.1 inference KPIs enforced via `bench-perf.mjs`: first-token p95
  < 500 ms, ≥ 30 tok/s on a 7B Q4_K_M.
* SBOM (SPDX + CycloneDX) and cosign-signed checksums on every release.

## What's New

### Hero feature — CAMR

`POST /api/v1/route` picks a model per prompt based on classified task
type, current VRAM, and a persistent per-installation acceptance ledger
(`~/.sovereign-code/router_performance.db`). The "Auto" item in the Chat
model selector activates it. See
[`docs/plans/2026-04-09-ten-innovations-design.md`](docs/plans/2026-04-09-ten-innovations-design.md)
for the design rationale; the other nine innovations are explicitly v1.1+
roadmap.

### First-run onboarding

New users see a 4-card flow on first launch: hardware-detection → starter
model recommendation → one-click download → warm-up → ready. Recommendation
is keyed by VRAM tier per PRD §4.2.1 (3B for <6 GB, 7B for 6–10 GB, 14B
for 10–22 GB, 32B for ≥22 GB).

### Auto-update

`electron-updater` is wired against GitHub Releases. The renderer's
Settings → "Check for Updates" surfaces the status; background check
runs 30 s after launch. Disabled by default on enterprise builds
(`DISABLE_AUTO_UPDATE=1`).

### Auth

Every Sovereign service that mutates state requires a per-installation
bearer token issued by the Electron main process at first boot and stored
at `~/.sovereign-code/local.token`. Implementation in
`services/_shared/auth.py`; smoke-tested by `tests/test_auth_guards.py` in
each of the four critical services.

### Observability

`docker compose --profile observability up` brings up Prometheus +
Grafana + Loki + promtail. Every service exports `/metrics` (route
templates, not concrete URLs — so no high-cardinality label explosions) and
emits structured JSON logs with a `request_id` field propagated through
the call chain.

### Persistence

`MemoryStore`, `PluginRegistry`, federation `PeerRegistry`, and the
CAMR `PerformanceLedger` now persist to per-installation SQLite WAL files
under `~/.sovereign-code/`. State survives desktop restarts. The
in-memory mode is preserved as a backward-compat default so existing
tests don't break.

### CI/CD

Three new GitHub Actions workflows ship in v1.0:

* `services-ci.yml` — pytest matrix across all 18 services (W4-T10).
* `release.yml` — 3-OS signed installer pipeline + cosign + SBOM + Aliyun
  OSS mirror (W4-T11, W8-T23).
* `supply-chain.yml` — pip-audit, npm audit, trivy fs; weekly + on
  dependency PRs (W4-T13).
* `e2e.yml` — Playwright cross-OS happy-path tests (W7-T19).
* `perf.yml` — daily inference perf bench on a GPU runner (W7-T21).

## Truth Reconciliation

Prior pre-GA drafts of the PRD and release notes overstated what was
shipped. v1.0's docs are realigned to ground truth:

* The "10 Innovations" doc lists 10 design proposals. **v1.0 ships
  Innovation #3 (CAMR) only.** The other nine are v1.1+ backlog.
* The Federation feature ships single-peer happy-path; multi-peer
  training rounds are deferred to v1.1.
* Plugin marketplace third-party publishing is post-GA.
* The `Federation.tsx` legacy mock screen has been removed — the
  Federation nav item now routes to the real `FederationCore` screen.

See PRD §1.4 for the post-reconciliation status table.

## Compatibility

* **OS:** Windows 10/11 64-bit, macOS 13+ (Intel + Apple Silicon), Ubuntu
  22.04+ (or compatible). Linux ARM64 builds are v1.1.
* **Python:** 3.11 (services); shipped inside container images.
* **Node:** 20 (renderer + extension); pinned in `package.json`.
* **VRAM:** minimum 4 GB (3B fallback); 6 GB+ recommended; 24 GB unlocks
  the 32B coder model.

## Known Limitations

* macOS notarization is enabled by config but requires Apple Developer
  Program enrollment to actually produce notarized installers. CI builds
  unnotarized fallbacks if secrets aren't configured.
* Auto-routing accuracy depends on the user's acceptance history; the
  first ~30 prompts use the cold-start heuristic.
* HumanEval evaluation in `services/training-service/evaluation/runner.py`
  is still mocked; replaced with the real package in v1.1 (see TODO
  annotation in the file).

## Upgrade Path

There is no prior GA — v0.x → v1.0.0 is a clean install. Existing v0.x
data under `~/.sovereign-code/` is preserved untouched; the new SQLite
stores are created alongside it.

## Verification

```sh
# 1. Verify the SHA256SUMS cosign signature
cosign verify-blob \
  --certificate SHA256SUMS.pem \
  --signature   SHA256SUMS.sig \
  --certificate-identity-regexp '^https://github.com/gucciwong/claude-code-source-code/' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  SHA256SUMS

# 2. Verify the installer matches
sha256sum -c SHA256SUMS --ignore-missing

# 3. Inspect the SBOM
jq '.packages | length' sbom-spdx.json    # number of components
```

## Acknowledgements

GA delivery was driven by the 8-week runway in
[`docs/plans/2026-05-11-ga-runway-plan.md`](docs/plans/2026-05-11-ga-runway-plan.md).
Every P0/P1 risk in that file is closed. Every "Known v1.0 Gap" in PRD
§1.4 is closed. Thanks to the alpha cohort for catching the early
race conditions in serviceManager startup and the e2e helper port stubs.

## What's Next (v1.1 roadmap)

* Innovations #1, #2, #4–#10 from the ten-innovations design.
* Federation multi-peer rounds + reputation.
* Plugin marketplace third-party publishing.
* Linux ARM64 + Raspberry Pi 5 builds.
* SQLCipher encryption-at-rest opt-in (for HIPAA-locked deployments).
* Mobile companion app (read-only chat + telemetry).

See you in v1.1.
