# Sovereign Code — Compliance Reference

**Version:** 1.0.0 GA
**Last updated:** 2026-07-06

This document is the canonical reference for compliance, data-flow, and
trust questions that an enterprise security / privacy review will ask. It
is descriptive — not a substitute for the PRD privacy claims — and is meant
to be cited directly in IT-approval documents.

## 1. Data Flow

```
   ┌──────────────┐                                  ┌──────────────────┐
   │ Source code  │  read (UTF-8, never copied)      │   Local model    │
   │ on disk      │ ───────────────────────────────► │  inference       │
   └──────────────┘                                  │  process         │
          ▲                                          └────────┬─────────┘
          │                                                   │
          │ writes (file edits)                               │ tokens
          │                                                   ▼
   ┌──────────────┐                                  ┌──────────────────┐
   │   Editor     │ ◄──────────────────────────────  │   Renderer UI    │
   │   (VSCode    │      streaming response          │   (Electron)     │
   │    / desktop)│                                  └──────────────────┘
   └──────────────┘
```

**No outbound network traffic occurs during inference, RAG retrieval,
training, or chat.** The only outbound calls Sovereign Code ever makes are:

| Trigger                          | Destination               | Purpose                       |
|---------------------------------|--------------------------|--------------------------------|
| User clicks "Download model"    | huggingface.co OR        | Pull model weights              |
|                                 | hf-mirror.com            |                                |
| Auto-update check (opt-in)      | api.github.com           | Compare versions               |
| User's own outbound (HTTPS proxy)| (user-configured)        | Optional corporate proxy       |

The auto-update check is **off by default in enterprise builds**
(`DISABLE_AUTO_UPDATE=1`).

## 2. Data Storage

| What                                | Where                                | At rest                   |
|------------------------------------|--------------------------------------|---------------------------|
| Model weights (GGUF)                | `~/.cache/sovereign-code/models/`    | filesystem ACL, mode 0700 |
| Training data (per-installation)    | `~/.sovereign-code/training.db`      | SQLite, owner-only        |
| Chat history (per-installation)     | `~/.sovereign-code/chat-history.db`  | SQLite, owner-only        |
| Personal Knowledge Library          | `~/.sovereign-code/pkl.db`           | SQLite, owner-only        |
| Local auth token                    | `~/.sovereign-code/local.token`      | mode 0600                 |
| Model-router performance ledger     | `~/.sovereign-code/router_performance.db` | SQLite, owner-only |
| Memory store                        | `~/.sovereign-code/memory.db`        | SQLite, owner-only        |
| Federation peer registry            | `~/.sovereign-code/peers.db`         | SQLite, owner-only        |

No data is stored in cloud-based services by Sovereign Code itself. If the
operator chooses to deploy `services/` to a private cloud, that becomes a
governance decision under their existing data-handling regime.

### Encryption at rest

Sovereign Code does **not** encrypt the SQLite databases by default; we
rely on the operating-system disk encryption (BitLocker / FileVault /
LUKS) that is universal in enterprise builds. If you need additional
encryption at the application layer, enable `SOVEREIGN_DB_ENCRYPTION=1`
which switches the stores to SQLCipher (requires the SQLCipher dependency
to be linked at build time; this is a v1.1 backlog item).

## 3. Network Egress Controls

* All 18 backend services restrict CORS to localhost origins by default
  (see `ALLOWED_ORIGINS` env var on each service).
* Sensitive endpoints (training cleanup/export, model download, mirror
  switch, execution-trace, enterprise-data) require a per-installation
  bearer token issued by the Electron main process at first launch
  (see `services/_shared/auth.py` and `apps/desktop/src/main/localToken.ts`).
* The execution-trace service uses POSIX resource limits +
  Windows JobObject to sandbox user-supplied code.

For verification, the **Zero-Trust Local AI (ZTLA)** subsystem in
`enterprise-data-service` includes:

* `POST /api/v1/ztla/egress-check` — enumerate outbound connections from
  the inference process and assert none are present.
* `POST /api/v1/ztla/scan` — scan model outputs for exfiltration patterns
  (encoded URLs, suspicious base64, unusual repetition).
* `GET  /api/v1/ztla/audit-log` — signed, append-only log of model
  interactions.

These are accessible from the desktop's "Enterprise Data" screen.

## 4. Telemetry

Sovereign Code does **not** ship anonymous usage telemetry by default. The
"Training" subsystem logs interactions (completion accept/reject,
inference latency) to a **local-only** SQLite database for the purpose of
fine-tuning the user's local model. None of this data leaves the machine.

If your organisation wants to opt into product telemetry for the v1.0 beta
cohort, set `SOVEREIGN_TELEMETRY=1` in the desktop preferences. Even when
opted in, only aggregate counters are shipped — never prompts or code.

## 5. Auditable Releases

Every GA release is reproducible and auditable:

1. **SBOM** — both SPDX-JSON and CycloneDX-JSON attached to every release
   (`sbom-spdx.json`, `sbom-cyclonedx.json`).
2. **Signed checksums** — `SHA256SUMS` is signed by Sigstore cosign
   (keyless via GitHub Actions OIDC). Verification recipe in `SECURITY.md`.
3. **Code signing** — Windows installers are EV-signed; macOS dmg/zip are
   Apple notarized.
4. **CI provenance** — the GitHub Actions workflow that built every
   artefact is recorded in the release notes (`generate_release_notes: true`).

## 6. Compliance Posture (by framework)

This table is the **current** posture; some items are roadmap items for v1.1.

| Framework          | Status     | Notes                                            |
|--------------------|-----------|--------------------------------------------------|
| SOC 2 Type I       | ⚠️ Partial | Auditable logs ✅; formal audit attestation v1.1 |
| HIPAA              | ⚠️ Suitable| BAA + encryption-at-rest config required by op   |
| GDPR               | ✅ Compliant | Data never leaves the user's machine            |
| PCI-DSS            | ⚠️ Suitable| Air-gap deployment recommended                   |
| FedRAMP            | ❌ N/A    | Not pursued — defer to v2.x                      |
| ISO/IEC 27001      | ⚠️ Partial | Controls documented; certification not pursued   |

If your team needs help filling out a specific vendor questionnaire,
contact **security@sovereign-ai-labs.com**.

## 7. Known Limitations (acknowledged in writing)

* Model weights downloaded from HuggingFace are **not** code-signed by
  Sovereign Code; trust falls to the model author and the HF integrity
  hash. We surface the HF mirror toggle for users in restricted regions.
* The auto-update mechanism, if enabled, fetches release metadata from
  GitHub Releases. Disable it (`DISABLE_AUTO_UPDATE=1`) on air-gapped
  installations.
* Telemetry tables (when enabled) are stored locally and never
  transmitted; SOC 2-style "encryption-in-transit" claims for telemetry
  are vacuous because there is no transit.

## 8. Change Log

| Date       | Version | Change                                          |
|------------|--------|--------------------------------------------------|
| 2026-07-06 | 1.0.0  | Initial publication for GA                       |
