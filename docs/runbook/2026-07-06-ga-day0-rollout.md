# Sovereign Code v1.0.0 — Day-0 Gradual Rollout Runbook

**Date:** 2026-07-06
**Tag:** `v1.0.0`
**On-call lead:** Sovereign AI Labs release engineering
**Escalation:** security@sovereign-ai-labs.com → support@sovereign-ai-labs.com
**Predecessor RC:** `v1.0.0-rc3` (signed and shipped 2026-07-03; 72 h soak
clean — see Grafana dashboard `sovereign-overview`)

This runbook is the operational checklist for the GA rollout. Follow it
in order. Every step has an explicit pass/fail predicate; if a step fails,
the **Rollback** section is the only path forward — do not improvise.

---

## Cohorts

| Cohort      | Size | Time slot                     | Distribution            |
|-------------|------|-------------------------------|-------------------------|
| **Internal alpha** | 3    | T-72h  (Sat 2026-07-03 09:00 UTC) | GitHub Release direct  |
| **External beta**  | 10   | T-24h  (Mon 2026-07-05 09:00 UTC) | GitHub Release direct  |
| **Public GA**      | open | T+0    (Mon 2026-07-06 09:00 UTC) | Releases + Aliyun OSS  |

The alpha cohort is named in `docs/runbook/cohorts.md` (private). Beta is
the 10 community members who opted into the v0.9-rc feedback channel; their
GitHub handles are in `docs/runbook/cohorts.md` Section 2.

---

## T-72 h — Internal Alpha (Sat 2026-07-03 09:00 UTC)

1. **Cut `v1.0.0-rc3` tag.** `git tag -a v1.0.0-rc3 -m "GA RC"`,
   `git push --tags`. The `release.yml` workflow triggers automatically.
2. **Verify artefacts.**
   * Pass: GitHub Release draft has `.exe`, `.dmg`, `.AppImage`, `.deb`,
     `SHA256SUMS{,.sig,.pem}`, and `sbom-{spdx,cyclonedx}.json`.
   * Fail: re-run the failed matrix job; do not proceed.
3. **Verify cosign signature in a clean room VM.** Recipe in `SECURITY.md`.
   Pass = signature verifies and `sha256sum -c` succeeds. Fail = stop.
4. **Verify auto-updater.** Install rc3 on an alpha tester's machine;
   confirm `Help → Check for Updates` reports "you're up to date". Fail =
   open issue, do not proceed.
5. **Open `#release-day0` Slack room.** Pin this runbook + Grafana link.

---

## T-24 h — External Beta (Mon 2026-07-05 09:00 UTC)

1. Send the cohort the `v1.0.0-rc3` download link. Ask each user to:
   * verify the cosign signature using `SECURITY.md`,
   * install,
   * complete the onboarding flow,
   * send a single Chat message,
   * reply in `#beta-feedback` with `:thumbsup:` once successful.
2. **Pass gate:** 9 of 10 :thumbsup: within 6 hours. The 10th may lag.
3. **Fail gate (any of):**
   * < 8 :thumbsup: in 6 h → investigate, file blocker
   * Crash report received with severity High or Critical
   * P95 first-token latency on the GPU bench > 600 ms (KPI is 500 ms;
     give 20 % headroom for varied beta hardware)
4. **Grafana watch.** During the 24-h soak, watch
   `sovereign-overview` dashboard:
   * Error rate (5xx / total): < 0.5 % per service
   * p95 latency by service: no service > 2× its baseline from rc2
   * Loki: zero log lines at level=`ERROR` with category=`security`

---

## T-0 — GA (Mon 2026-07-06 09:00 UTC)

1. Promote rc3 → GA: `git tag -a v1.0.0 <rc3-sha> -m "Sovereign Code 1.0.0 GA"`
   `git push --tags`. Release workflow re-runs, producing identical
   binaries with the GA tag. (Reproducible builds verified in T-72.)
2. **Publish the Release.** In GitHub UI: edit the draft, untick "draft",
   tick "set as latest release", publish.
3. **Aliyun OSS push.** The workflow handles this automatically when
   `ALIYUN_OSS_*` secrets are configured. Verify
   `oss://sovereign-code/releases/v1.0.0/` has all 11 artefacts.
4. **Flip the auto-updater feed.** No action needed — `electron-updater`
   reads from `latest-{linux,mac}*.yml` which are now present on the
   Release.
5. **Update README badges + product page** — already in this PR.
6. **Announce.** Twitter / Hacker News / WeChat post per
   `docs/runbook/launch-comms.md`.

---

## T+0 to T+72 h — Soak Window

The 72-hour soak is **mandatory** before declaring GA fully successful.
Watch:

* **Grafana** `sovereign-overview` — primary signal.
* **Loki** — query `{level="ERROR"} | json | service=~".+"` for cross-service
  errors. Acceptable: < 5 ERROR lines per service per hour (background
  noise from transient model-manager downloads is expected).
* **GitHub Issues** — label `v1.0.0` filtering. Sev:1 = same-hour ack.
* **`#release-day0`** — on-call lead checks every 4 hours.

### Alert thresholds (Prometheus rules)

These are documented here; the rules themselves are in
`infra/prometheus/rules.yml` (not yet committed — that's a v1.1 follow-up;
operators set up manually for GA).

| Alert                              | Threshold                                | Action               |
|------------------------------------|------------------------------------------|----------------------|
| ServiceDown                        | `up == 0` for 5 min                      | Page on-call         |
| HighErrorRate                      | 5xx rate > 1 % for 10 min                | Page on-call         |
| FirstTokenLatencyP95Regression     | p95 > 800 ms for 30 min                  | Investigate          |
| LokiNoLogsForService               | no lines for 15 min                      | Investigate (silent) |
| RouterFeedbackLossOfSignal         | router_performance row count flat 24 h   | Investigate          |

---

## Rollback

If any of the **fail gates** trip during T-72, T-24, or T-0, follow this:

1. **Stop new installations.** Update the Release draft to "pre-release" so
   the auto-updater feed (`latest*.yml`) won't promote it; pin the
   download page to point at the previous rc.
2. **Notify cohort + public** in `#release-day0` and the GitHub Release
   description. Use the template in `docs/runbook/rollback-comm.md`.
3. **For users who already installed:** if the issue is renderer-only,
   they can keep using the install until a fix ships. If a service-side
   data-corruption risk is present, instruct them to stop services and
   wait for the patch.
4. **Forensic capture.** Pull the Grafana dashboard PDF, Loki query results
   covering the failure window, and any user-supplied logs into
   `docs/postmortem/2026-07-06-incident-N/`.
5. **Cut a `v1.0.1` patch** with the fix. Re-run this runbook starting
   from T-72.

We commit to a same-day rollback decision — no waiting overnight if the
fail-gate is clear-cut.

---

## Sign-off

| Step       | Predicate                                | Owner       | Signed |
|------------|------------------------------------------|-------------|--------|
| T-72 alpha | cosign verify + auto-updater OK          | rel-eng     | ☐      |
| T-24 beta  | 9 of 10 :thumbsup:, Grafana clean        | rel-eng     | ☐      |
| T-0 GA     | tag pushed, Release published, OSS sync  | rel-eng     | ☐      |
| T+72 soak  | dashboards green, no Sev:1 issues open   | on-call     | ☐      |

When all four are signed, run `git tag -s v1.0.0-soaked` to mark the
release as production-validated. v1.1 planning kicks off the next Monday.
