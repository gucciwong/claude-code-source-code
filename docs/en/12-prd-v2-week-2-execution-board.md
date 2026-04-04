# Sovereign Code Week 2 Execution Board

> Scope Window: Foundation Month 1, Week 2
> Alignment: F4.1 completion, F2.1 hardening, F1.3 benchmark validation, F3.1 kickoff
> Status: Ready to Execute
> Date: 2026-04-01

## 1. Week 2 Goal

Convert the Week 1 vertical slice into a stable developer workflow by completing VSCode MVP runtime connectivity, hardening completion quality, and publishing reproducible baseline benchmark evidence.

## 2. Inputs from Week 1

1. Validated hardware profile table and compatibility findings.
2. Completion event payload examples and schema checks.
3. CLI contract samples for model list, switch, and completion.
4. Prioritized blocker list with severity and ownership.

## 3. Ticket Focus and Ownership

| Ticket | Outcome for Week 2 | DRI | Backup | Due |
|---|---|---|---|---|
| F4.1 | VSCode MVP runtime status and completion request path fully functional | IDE Lead (TBD) | Platform Eng (TBD) | 2026-04-10 |
| F2.1 | Inline completion latency and confidence fallback hardened | IDE Lead (TBD) | Applied AI (TBD) | 2026-04-09 |
| F1.3 | Baseline benchmark suite and regression thresholds published | Platform Lead (TBD) | Data DRI (TBD) | 2026-04-10 |
| F3.1 (kickoff) | Workspace indexing architecture and implementation plan signed off | Core AI Lead (TBD) | Product Eng (TBD) | 2026-04-11 |

## 4. Daily Plan

## Day 1 (Mon): VSCode Runtime Completion Path

1. Implement runtime status command and status panel wiring.
2. Complete VSCode completion request routing to local inference API.
3. Add actionable error states for missing runtime, model, or invalid profile.
4. Validate end-to-end flow with sample workspace.

Exit check:
1. VSCode can display runtime status and execute one successful completion request.

## Day 2 (Tue): Completion Hardening and UX Safety

1. Tune completion timeout and retry behavior.
2. Harden low-confidence fallback behavior.
3. Add edit-after-accept tracking and payload validation.
4. Confirm acceptance and rejection event integrity against schema.

Exit check:
1. Completion loop remains functional under degraded runtime conditions with no critical UX dead ends.

## Day 3 (Wed): Benchmark Harness and Reproducibility

1. Finalize benchmark scenarios for first-token latency and throughput.
2. Record baseline runs for at least two validated hardware tiers.
3. Publish regression thresholds and alert mapping.
4. Version benchmark artifacts and test scripts.

Exit check:
1. Baseline report can be reproduced from the documented harness in one run.

## Day 4 (Thu): Indexing Kickoff and Technical Design

1. Define F3.1 indexing architecture and data flow.
2. Select chunking strategy and incremental update approach.
3. Specify indexing status surface for CLI and IDE.
4. Review dependencies and risk impact on Month 1 to Month 2 transition.

Exit check:
1. F3.1 implementation plan is approved with explicit owner, scope, and start date.

## Day 5 (Fri): Integration Review and Readiness Gate

1. Run integrated demo for VSCode completion and runtime status.
2. Present benchmark baseline and regression thresholds.
3. Review unresolved blockers and assign carry-over actions.
4. Confirm v0.1 entry criteria trajectory for Foundation Month 1.

Exit check:
1. Week 2 evidence package is complete and accepted in review.

## 5. Demo Evidence Checklist

1. VSCode runtime status screen capture.
2. VSCode completion request and response trace.
3. Completion fallback behavior example under degraded runtime.
4. Benchmark report artifacts for first_token_latency_ms and tokens_per_second.
5. Regression threshold table with alert owner mapping.
6. F3.1 architecture note and dependency decision record.

## 6. Risk Watchlist (Week 2)

1. VSCode integration instability across project sizes.
2. Completion quality drop after latency tuning.
3. Benchmark noise due to inconsistent hardware test conditions.
4. F3.1 scope expansion risking Month 1 commitments.

Mitigation owners:
1. IDE Lead for integration and UX risks.
2. Platform Lead and Data DRI for benchmark and threshold risks.
3. Core AI Lead for scope control and indexing kickoff risk.

## 7. Friday Checkpoint Template

1. Which Week 2 ticket outcomes were delivered with evidence?
2. Which benchmark targets passed or failed by tier?
3. What blockers threaten Month 1 v0.1 trajectory?
4. What is locked for Week 3 execution?

## 8. Week 3 Hand-off Inputs

1. Stable VSCode completion and runtime status behavior.
2. Reproducible benchmark harness and published baseline.
3. Signed-off F3.1 implementation plan.
4. Carry-over issues with severity, owner, and planned fix window.
