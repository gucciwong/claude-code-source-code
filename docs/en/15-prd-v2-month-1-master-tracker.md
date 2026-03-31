# Sovereign Coder Month 1 Master Tracker

> Scope: Foundation Phase Month 1 (Weeks 1-4)
> Status: Active
> Date: 2026-04-01
> Source Boards: Week 1 to Week 4 execution and closure docs

## 1. Purpose

Provide a single-page operational view of Month 1 progress across streams, tickets, metrics, risks, and release readiness so weekly board outputs can be tracked in one place.

## 2. Linked Week Boards

1. Week 1: docs/en/11-prd-v2-week-1-execution-board.md
2. Week 2: docs/en/12-prd-v2-week-2-execution-board.md
3. Week 3: docs/en/13-prd-v2-week-3-execution-board.md
4. Week 4: docs/en/14-prd-v2-week-4-closure-board.md

## 3. Month 1 Objective Summary

1. Local inference bootstrap is production-usable on validated hardware tiers.
2. Inline completion MVP works end-to-end with acceptance telemetry.
3. VSCode and CLI surfaces support first-code workflow.
4. Baseline benchmark and KPI instrumentation are reproducible.
5. v0.1 release gate can be decided with complete evidence.

## 4. Stream Status Rollup

| Stream | Key Tickets | Week Target | Current Status | DRI | Notes |
|---|---|---|---|---|---|
| Inference Runtime | F1.1, F1.2, F1.3 | W1-W3 | Planned | Platform Lead (TBD) | Ollama bootstrap, model compatibility, benchmarks |
| Completion Experience | F2.1 | W1-W2 | Planned | IDE Lead (TBD) | Suggest or accept or reject loop and fallback behavior |
| IDE and CLI Surface | F4.1, F4.2 | W1-W3 | Planned | Product Eng Lead (TBD) | VSCode status path and CLI operation parity |
| Context and Retrieval | F3.1, F3.2 prototype | W2-W3 | Planned | Core AI Lead (TBD) | Indexing kickoff and hybrid retrieval prototype |
| Release and Operations | v0.1 gate prep | W4 | Planned | Product DRI (TBD) | Evidence packaging and go or no-go review |

## 5. Milestone and Gate Checklist

| Milestone or Gate | Target Week | Required Evidence | Status |
|---|---|---|---|
| Runtime bootstrap validated | Week 1 | Health checks, local inference trace, setup guidance | Pending |
| Completion MVP stabilized | Week 2 | Suggest or accept or reject flows plus telemetry audit | Pending |
| Benchmark baseline finalized | Week 3 | Tiered latency and throughput reports plus regression thresholds | Pending |
| v0.1 go or no-go review | Week 4 | Criterion matrix, defect ledger, final demo and readiness pack | Pending |

## 6. KPI Rollup (Month 1 Baseline)

| Metric | Target Reference | Baseline Snapshot | Owner | Status |
|---|---|---|---|---|
| first_token_latency_ms | <=500ms (7B), <=1000ms (32B) | TBD | Platform Lead (TBD) | Pending |
| tokens_per_second | >=30 tps | TBD | Platform Lead (TBD) | Pending |
| acceptance_rate | Week-over-week stable or improving | TBD | IDE Lead (TBD) | Pending |
| schema_mismatch_rate | <0.2% | TBD | Data DRI (TBD) | Pending |
| critical_field_null_rate | <0.5% | TBD | Data DRI (TBD) | Pending |

## 7. Defect and Risk Rollup

## 7.1 Defect Rollup

| Severity | Open | Mitigated | Deferred with plan | Owner |
|---|---|---|---|---|
| P0 | 0 (target) | 0 | 0 | Engineering Manager (TBD) |
| P1 | 0 (target) | 0 | 0 | Stream DRIs |
| P2+ | Track weekly | Track weekly | Track weekly | Stream DRIs |

## 7.2 Top Risks

1. Performance regression after retrieval integration.
2. Hardware-tier variability creates unstable benchmark comparisons.
3. Evidence gaps delay v0.1 gate review.
4. Sprint 2 scope inflation from unresolved Month 1 carry-over.

Mitigation ownership:
1. Platform Lead and Data DRI for performance and benchmark controls.
2. Product DRI for evidence governance and release gate discipline.
3. Core AI Lead for Sprint 2 scope control.

## 8. Weekly Governance Cadence

1. Monday planning: confirm weekly scope and owner commitments.
2. Wednesday checkpoint: benchmark or telemetry health review.
3. Friday checkpoint: evidence completeness and risk burn-down review.
4. End-of-month gate: formal v0.1 go or no-go decision.

## 9. Sign-off Matrix

| Decision Area | Required Sign-off | Status |
|---|---|---|
| Runtime and compatibility | Platform Lead (TBD) | Pending |
| Completion and UX | IDE Lead (TBD) | Pending |
| CLI contract and operability | Product Eng Lead (TBD) | Pending |
| KPI and benchmark validity | Data DRI (TBD) | Pending |
| Overall release recommendation | Product DRI (TBD) | Pending |

## 10. Transition to Sprint 2

1. Approved Sprint 2 backlog for F3.1 and F3.2 expansion.
2. Dependency map with ownership and target resolution windows.
3. Month 1 retrospective summary with top process improvements.
4. First-week Sprint 2 action list with named DRIs.
