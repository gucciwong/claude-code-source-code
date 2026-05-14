# GitHub Actions Secrets — Required for Signed GA Release

The release-time CI workflows (`release.yml`, `supply-chain.yml`,
`perf.yml`) depend on a handful of repository secrets that **must** be
configured before `git tag v1.0.0-rc1` will produce a usable artefact.
This document is the canonical checklist. Tick each item before flipping
the PR to non-draft.

## Quick Reference

| Secret name | Required by | Sensitivity | Source |
|---|---|---|---|
| `CSC_LINK` | release.yml (Win + macOS) | HIGH | Code-signing certificate vendor |
| `CSC_KEY_PASSWORD` | release.yml | HIGH | Set when generating the PFX/P12 |
| `APPLE_ID` | release.yml (macOS notarize) | MEDIUM | Apple Developer account email |
| `APPLE_APP_SPECIFIC_PASSWORD` | release.yml (macOS notarize) | HIGH | appleid.apple.com → App-specific passwords |
| `APPLE_TEAM_ID` | release.yml (macOS notarize) | LOW | Apple Developer → Membership → Team ID |
| `ALIYUN_OSS_BUCKET` | release.yml (China mirror) | LOW | Aliyun OSS console |
| `ALIYUN_OSS_ENDPOINT` | release.yml | LOW | e.g. `oss-cn-hangzhou.aliyuncs.com` |
| `ALIYUN_OSS_KEY` | release.yml | HIGH | Aliyun RAM access-key ID |
| `ALIYUN_OSS_SECRET` | release.yml | HIGH | Aliyun RAM access-key secret |
| `GITHUB_TOKEN` | all | (auto) | GitHub provides this automatically |

> **Important:** Without `CSC_LINK` + `CSC_KEY_PASSWORD`, the workflow
> still produces unsigned installers (you'll see a warning in the
> electron-builder log). End users will see Windows SmartScreen and
> macOS Gatekeeper blocks. Not fit for GA distribution.

## How to add a secret

```bash
gh secret set <NAME> --repo gucciwong/Sovereign_Code
# Prompts for value (paste it; not echoed)
```

Or via the web UI: `Settings → Secrets and variables → Actions → New repository secret`.

## Detailed setup per secret

### 1. Windows code-signing certificate (`CSC_LINK` + `CSC_KEY_PASSWORD`)

Buy an EV code-signing certificate (recommended for instant SmartScreen
trust) or a standard OV cert (slower to build reputation, cheaper). Vendors:

- DigiCert (~$700/year EV)
- Sectigo (~$300/year EV, ~$200/year OV)
- SSL.com (~$300/year EV)

After purchase you get a `.pfx` (PKCS#12) file. Encode it for use as a
secret:

```bash
base64 -w 0 SovereignCode.pfx > pfx.b64
gh secret set CSC_LINK --repo gucciwong/Sovereign_Code < pfx.b64
gh secret set CSC_KEY_PASSWORD --repo gucciwong/Sovereign_Code
# Paste the PFX password when prompted
```

> EV certs ship on a physical USB token by default. For CI you need the
> non-HSM "Cloud" variant — explicitly request it from your vendor.

### 2. Apple Developer notarization (`APPLE_*`)

Sign up for the Apple Developer Program ($99/year). Then:

1. Generate a Developer ID Application certificate via Xcode → Settings → Accounts → Manage Certificates.
2. Export it as `.p12` from Keychain Access; this is your macOS `CSC_LINK`
   value (yes, same secret name as Windows — electron-builder picks the
   right one per OS).
3. Generate an app-specific password at https://appleid.apple.com → Sign-In and Security → App-Specific Passwords. Label it `Sovereign Code Notarization`.
4. Note your Team ID from https://developer.apple.com/account/#/membership.

```bash
gh secret set APPLE_ID --repo gucciwong/Sovereign_Code
gh secret set APPLE_APP_SPECIFIC_PASSWORD --repo gucciwong/Sovereign_Code
gh secret set APPLE_TEAM_ID --repo gucciwong/Sovereign_Code
```

After secrets are in place, flip `apps/desktop/electron-builder.json`
`mac.notarize` from `false` to `true`.

### 3. Aliyun OSS dual-region mirror (`ALIYUN_OSS_*`)

For users in mainland China who can't reliably reach GitHub Releases.
The workflow uploads identical artefacts to an Aliyun OSS bucket.

1. Create an OSS bucket in the Aliyun console. Pick a region close to
   your user base (`oss-cn-hangzhou` is a safe default). Public read,
   private write.
2. Create a RAM user with `oss:PutObject` + `oss:ListObjects` only on
   that bucket (least privilege). Aliyun docs:
   https://help.aliyun.com/zh/oss/user-guide/access-control/
3. Copy the AccessKey ID and Secret.

```bash
gh secret set ALIYUN_OSS_BUCKET --repo gucciwong/Sovereign_Code   # e.g. sovereign-code-releases
gh secret set ALIYUN_OSS_ENDPOINT --repo gucciwong/Sovereign_Code # e.g. oss-cn-hangzhou.aliyuncs.com
gh secret set ALIYUN_OSS_KEY --repo gucciwong/Sovereign_Code
gh secret set ALIYUN_OSS_SECRET --repo gucciwong/Sovereign_Code
```

If `ALIYUN_OSS_BUCKET` is empty the workflow skips the upload step
(useful while the bucket isn't provisioned yet).

## Verification

After setting all secrets, run a dry-run release:

```bash
gh workflow run release.yml --ref feat/ga-runway-w1-w8
# Then watch the run:
gh run watch
```

The "Build & package" step should log `signing with identity …` on
both Win and macOS. Notarization output should show `Apple notary
service responded with status: Accepted`.

## Rotation policy

| Secret | Rotation cadence |
|---|---|
| `CSC_KEY_PASSWORD` | When the cert is renewed (annually) |
| `APPLE_APP_SPECIFIC_PASSWORD` | Annually, or immediately on suspicion of compromise |
| `ALIYUN_OSS_KEY` / `_SECRET` | Every 90 days minimum |
| `CSC_LINK` (cert itself) | When the cert is renewed |

Rotation procedure: re-run the relevant `gh secret set` command — old
value is overwritten. No workflow change needed.

## What this runbook does NOT cover

- TLS certificate for the auto-update CDN (electron-updater uses GitHub
  Releases directly; no separate cert needed).
- Sigstore cosign signing — keyless via OIDC, so no secrets needed.
- Trivy / pip-audit / npm audit secrets — they're public scanners; no
  secrets needed.

Open `https://github.com/gucciwong/Sovereign_Code/settings/secrets/actions`
to confirm all 9 secrets are listed (the 10th, `GITHUB_TOKEN`, is
auto-provided and not listed there).
