# Security Policy

## Reporting a Vulnerability

If you discover a security issue in Sovereign Code, **please do not file a
public GitHub issue.** Instead, email **security@sovereign-ai-labs.com** with:

* a short description of the issue (one paragraph is fine)
* steps to reproduce, ideally with a minimal repro repo or a 1-shot script
* the affected component (desktop, vscode-extension, or specific service)
* the affected version (output of `Help → About` in the desktop app, or the
  release tag — e.g. `v1.0.0`)

We acknowledge new reports within **3 business days** and provide a fix or
mitigation within **30 days** for critical issues. You'll be credited (with
your consent) in the release notes that ship the fix.

## Supported Versions

Sovereign Code follows a "latest GA + previous minor" support window:

| Version    | Status                  |
|------------|-------------------------|
| 1.0.x      | ✅ Active — security and bug fixes |
| < 1.0.0    | ❌ Pre-GA — no security guarantees |

## Verifying Release Artifacts

Every release artifact is checksummed and the checksum file is signed via
[Sigstore cosign](https://github.com/sigstore/cosign) (keyless / OIDC). A
typical verification on Linux looks like:

```sh
# Download the artefacts + signature + cert from the release page
curl -L -O https://github.com/gucciwong/claude-code-source-code/releases/download/v1.0.0/Sovereign-Code-Setup-1.0.0.exe
curl -L -O https://github.com/gucciwong/claude-code-source-code/releases/download/v1.0.0/SHA256SUMS
curl -L -O https://github.com/gucciwong/claude-code-source-code/releases/download/v1.0.0/SHA256SUMS.sig
curl -L -O https://github.com/gucciwong/claude-code-source-code/releases/download/v1.0.0/SHA256SUMS.pem

# 1. Verify the cosign signature on the checksum file
cosign verify-blob \
  --certificate SHA256SUMS.pem \
  --signature SHA256SUMS.sig \
  --certificate-identity-regexp '^https://github.com/gucciwong/claude-code-source-code/' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  SHA256SUMS

# 2. Verify the artefact hash matches the signed checksum
sha256sum -c SHA256SUMS --ignore-missing
```

If either step fails, **do not install the artefact** — it has been tampered
with in transit or replaced. Open a security report so we can investigate.

## Supply-Chain Posture

* Every Python dependency is scanned weekly by `pip-audit` (see
  `.github/workflows/supply-chain.yml`).
* Every npm dependency is audited by `npm audit --omit=dev --audit-level=high`
  on every PR that touches `package.json`.
* The filesystem is scanned by `trivy fs` for HIGH/CRITICAL CVEs and secret
  leaks; findings are uploaded to GitHub code-scanning.
* SBOMs in both SPDX and CycloneDX formats are attached to every GitHub
  Release (`sbom-spdx.json`, `sbom-cyclonedx.json`).

## Local-Token Authentication

All Sovereign Code services run on localhost. To prevent any process on the
machine from calling them, every sensitive endpoint requires a
`Authorization: Bearer <token>` header where the token is generated on first
boot and stored at `~/.sovereign-code/local.token` (mode `0600`). The
matching server-side check lives in `services/_shared/auth.py`.

The token is **never** sent to a remote endpoint. If you need to inspect or
rotate it, delete the file and restart the desktop app — a new token is
generated on the next launch.

## Out of Scope

* Attacks that require physical access to an unlocked machine
* Vulnerabilities in third-party model weights downloaded from HuggingFace
  (these are scanned at download time but trust falls to the model author)
* Issues in browser extensions / IDE extensions other than the official
  `apps/vscode-extension`

For broader Anthropic-style threat modelling guidance see
`docs/en/COMPLIANCE.md`.
