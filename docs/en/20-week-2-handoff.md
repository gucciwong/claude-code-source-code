# Sovereign Code — Week 2 Handoff & Blocker Log

> Date: 2026-04-03
> Author: Platform Lead
> Input document: docs/en/19-week-1-evidence-bundle.md
> Target: docs/en/12-prd-v2-week-2-execution-board.md

---

## 1. Carry-Over Work (from Week 1)

| ID | Item | Status | Ticket | Owner |
|---|---|---|---|---|
| W1-01 | Tier A 6GB throughput shortfall (28 tok/s < 30 tok/s) | ⚠️ Open | F1.2 | Platform Lead |
| W1-02 | `finetune/job_manager.py` deprecation warnings (datetime, Pydantic) | 🔵 Low | tech-debt | Platform Eng |
| W1-03 | Spec §6 alert threshold for 6GB tier needs updating (30→25 tok/s) | 🔵 Low | F1.2 | Product |

---

## 2. Week 2 Blockers

### BLOCKER-01 — Tier A 6GB sustained throughput

| Field | Value |
|---|---|
| Severity | **Medium** |
| Blocks | F1.3 baseline publication; 6GB-tier user onboarding flow |
| Description | 7B Q4_K_M on 6 GB leaves insufficient headroom for KV-cache under production completion lengths. Measured 28 tok/s vs. the 30 tok/s floor. |
| Options | 1. Test `Q3_K_S` quantization — trades ~2% model quality for throughput headroom. |
| | 2. Adjust the 6GB alert threshold in spec §6 to 25 tok/s (spec change, not code change). |
| | 3. Add a UI warning when a 6GB profile is active: *"Responses may exceed 30 tok/s minimum on long completions."* |
| Decision needed by | W2-Day1 (Monday 2026-04-06) |
| Owner | Platform Lead |

### BLOCKER-02 — VSCode extension runtime status panel (F4.1 pre-req)

| Field | Value |
|---|---|
| Severity | **High** |
| Blocks | F4.1 VSCode MVP runtime connectivity (Week 2, Day 1) |
| Description | The VSCode extension (`apps/vscode-extension/`) has not yet been wired to the runtime-check CLI output. The `runtime status` command exists but its JSON contract has not been consumed by the extension status panel. |
| Required | Extension must read `runtime.reachable`, `runtime.host:port`, and `recommendations.suggested[0]` from the JSON output and surface them in the status bar. |
| Owner | IDE Lead |
| Pre-req | `docs/en/18-cli-runtime-contract.md §1.1` (runtime JSON schema) is now finalized. |
| Target | W2-Day1 |

### BLOCKER-03 — Completion confidence fallback not implemented (F2.1 hardening)

| Field | Value |
|---|---|
| Severity | **Medium** |
| Blocks | F2.1 completion hardening (Week 2, Day 2) |
| Description | The Chat screen currently emits `completion_suggested` and `completion_accepted` events but does not track low-confidence fallback behavior. When `tokens_per_second` drops below 20 tok/s the UX shows no degraded-state indicator. |
| Required | Implement a `lowConfidence` flag in `chatStore.ts`; display an inline warning when `tokensPerSecond < 20`. |
| Owner | IDE Lead |
| Target | W2-Day2 |

---

## 3. Week 2 Prerequisites Delivered

All inputs required by `docs/en/12-prd-v2-week-2-execution-board.md §2` are satisfied:

| Input | Delivered | Location |
|---|---|---|
| Validated hardware profile table | ✅ | `docs/en/17-benchmark-baseline-table.md` |
| Completion event payload examples and schema | ✅ | `docs/en/18-cli-runtime-contract.md §2.2` |
| CLI contract samples | ✅ | `docs/en/18-cli-runtime-contract.md §1` |
| Prioritized blocker list | ✅ | Section 2 above |

---

## 4. Recommended Week 2 Day-1 Actions

1. **Decision on BLOCKER-01** — Platform Lead to decide Q3_K_S vs. spec threshold change by EOD Monday.
2. **BLOCKER-02 kickoff** — IDE Lead to read `docs/en/18-cli-runtime-contract.md §1.1` and wire extension status panel.
3. **finetune deprecation warnings** — Platform Eng to fix `job_manager.py` in background (no test changes needed, drop-in `datetime.now(UTC)` + `model_dump()`).

---

## 5. Week 2 Ticket Scope (reproduced from execution board)

| Ticket | Outcome | Due |
|---|---|---|
| F4.1 | VSCode MVP runtime status and completion request path fully functional | 2026-04-10 |
| F2.1 | Inline completion latency and confidence fallback hardened | 2026-04-09 |
| F1.3 | Baseline benchmark suite and regression thresholds published | 2026-04-10 |
| F3.1 (kickoff) | Workspace indexing architecture signed off | 2026-04-11 |

F1.3 is **unblocked** — `docs/en/17-benchmark-baseline-table.md` and `scripts/tests/sovereign-week1-tier-baseline.test.mjs` are both committed and reproducible.

---

## 6. Test Coverage State Entering Week 2

| Layer | Tests | Status |
|---|---|---|
| Python training-service | 50 | ✅ all pass |
| Node.js script harness | 88 | ✅ all pass |
| TypeScript desktop app | 781 | ✅ all pass, 10 skipped |
| Total | 919 | ✅ |
