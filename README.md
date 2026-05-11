# Sovereign Code

**Version:** 1.0.0 GA · 2026-07-06 · [Release Notes](RELEASE_NOTES_v1.0.0.md) ·
[Compliance](docs/en/COMPLIANCE.md) · [Security](SECURITY.md) ·
[中文](README_CN.md)

> **Sovereign Code is a 100% local AI engineering platform.** Code never
> leaves your machine. Model weights run on your own GPU. Training data
> stays in a SQLite file you own. Federated learning shares gradients, not
> code.

## Why Sovereign Code

| Concern                  | Cloud Tools (Copilot/Cursor) | Sovereign Code           |
|--------------------------|------------------------------|--------------------------|
| Where does your code go? | Vendor cloud                 | Stays on your laptop     |
| Who owns the model?      | The vendor                   | You — train and export   |
| Works air-gapped?        | No                           | Yes                      |
| China-mainland access?   | Slow / blocked               | hf-mirror.com toggle     |
| SOC 2 / HIPAA story?     | Vendor BAA                   | No data egress — trivial |

## What's in the box (v1.0.0)

* **Desktop app** (Electron + React) — Chat, Models, Training, Knowledge,
  Federation, Analytics, IM Bridge, PR Review, and more (25 screens).
* **VS Code extension** — inline completions backed by your local model
  with RAG context.
* **18 local FastAPI services** — model-manager, training, knowledge,
  enterprise-data, execution-trace, voice (Whisper + TTS), and friends.
* **CAMR — Context-Aware Model Router** — auto-routes each prompt to the
  optimal local model (small for completions, large for refactors);
  learns from your acceptance rate over time.
* **Local-first auth** — every service requires a per-installation
  bearer token; nothing on localhost is exposed to other processes.
* **Auto-update** — signed, cosign-verified delta updates via GitHub
  Releases.

## Quick Start

### Install (end-user)

Download the signed installer for your OS from
[GitHub Releases](https://github.com/gucciwong/claude-code-source-code/releases/latest):

* Windows — `Sovereign-Code-Setup-1.0.0.exe`
* macOS   — `Sovereign-Code-1.0.0.dmg`
* Linux   — `Sovereign-Code-1.0.0.AppImage` or `.deb`

Verify the download (recommended):

```sh
cosign verify-blob \
  --certificate SHA256SUMS.pem \
  --signature   SHA256SUMS.sig \
  --certificate-identity-regexp '^https://github.com/gucciwong/claude-code-source-code/' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  SHA256SUMS
sha256sum -c SHA256SUMS --ignore-missing
```

Launch the app. On first run you'll see the onboarding flow:
**detect VRAM → pick starter model → download → warm-up → ready**.
It takes about 90 seconds on a 6 GB VRAM machine.

### Develop (contributors)

```bash
# Desktop app
cd apps/desktop && npm install && npm run dev

# VS Code extension
cd apps/vscode-extension && npm install && npm test

# All services (Docker)
docker compose up                                 # core 18 services
docker compose --profile observability up        # + Prometheus/Grafana/Loki

# E2E tests (Playwright)
cd apps/desktop && npm run e2e

# CAMR routing bench
node scripts/bench-router.mjs

# Inference perf bench (requires a downloaded Qwen2.5-Coder-7B)
node scripts/bench-perf.mjs
```

## Architecture

```
┌──────────────────────────┐         ┌──────────────────────────────┐
│  Electron Desktop        │         │  18 local FastAPI services   │
│  • React 18 renderer     │ ◄────►  │  • model-manager (port 8002) │
│  • CAMR Auto mode        │         │  • training-service (8001)   │
│  • Auto-update           │         │  • knowledge-service (8003)  │
│  • Local-token auth      │         │  • enterprise-data   (8004)  │
└──────────────────────────┘         │  • execution-trace   (8005)  │
            │                        │  • + 13 more                 │
            │ Authorization:         └──────────────────────────────┘
            │ Bearer <token>                  │
            ▼                                 ▼
┌──────────────────────────┐         ┌──────────────────────────────┐
│  VS Code Extension       │         │  Observability (opt-in)      │
│  • Inline completions    │         │  • Prometheus / Grafana      │
│  • RAG over local index  │         │  • Loki + promtail (JSON)    │
└──────────────────────────┘         └──────────────────────────────┘
```

See [`docs/en/Sovereign-Code-PRD.md`](docs/en/Sovereign-Code-PRD.md) for
the full architecture spec.

## Documentation

* [PRD v3.0](docs/en/Sovereign-Code-PRD.md) — product requirements
* [GA Runway Plan](docs/plans/2026-05-11-ga-runway-plan.md) — the W1–W8
  delivery plan that shipped v1.0
* [Compliance](docs/en/COMPLIANCE.md) — data-flow, SBOM, signing
* [Security](SECURITY.md) — disclosure policy + verification
* [Release Notes](RELEASE_NOTES_v1.0.0.md) — what changed in v1.0

## License

See [LICENSE](LICENSE). Sovereign Code is permissively licensed for both
personal and commercial use.
