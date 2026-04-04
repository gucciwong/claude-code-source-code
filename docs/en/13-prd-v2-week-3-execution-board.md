# Sovereign Code Week 3 Execution Board

> Scope Window: Foundation Month 1, Week 3
> Alignment: F3.1 implementation, F3.2 retrieval prototype, v0.1 gate preparation
> Status: Ready to Execute
> Date: 2026-04-01

## 1. Week 3 Goal

Move from MVP stabilization to context-aware capability by implementing the first usable indexing pipeline and hybrid retrieval prototype, while preparing release-quality evidence for the v0.1 month-end gate.

## 2. Inputs from Week 2

1. Stable VSCode runtime and completion flow.
2. Reproducible benchmark harness with baseline reports.
3. Signed F3.1 architecture and dependency decisions.
4. Carry-over bug and blocker list with severity and ownership.

## 3. Ticket Focus and Ownership

| Ticket | Outcome for Week 3 | DRI | Backup | Due |
|---|---|---|---|---|
| F3.1 | Workspace indexing pipeline implemented for initial project scan and incremental updates | Core AI Lead (TBD) | Product Eng (TBD) | 2026-04-17 |
| F3.2 (prototype) | Hybrid retrieval prototype with top-k controls and token budget constraints | Core AI Lead (TBD) | Applied AI (TBD) | 2026-04-18 |
| F1.3 | Benchmark rerun with retrieval-enabled workload to detect regression impact | Platform Lead (TBD) | Data DRI (TBD) | 2026-04-18 |
| v0.1 Gate Prep | Release readiness evidence pack draft completed | Product DRI (TBD) | All stream DRIs | 2026-04-19 |

## 4. Daily Plan

## Day 1 (Mon): Indexing Pipeline Core

1. Implement project-open initial indexing workflow.
2. Add language-aware chunk generation and metadata schema.
3. Persist index state and update checkpoints.
4. Validate indexing performance on medium-size workspace sample.

Exit check:
1. Initial indexing completes with visible status and persisted artifacts.

## Day 2 (Tue): Incremental Update Path

1. Implement file-change watchers and incremental re-indexing.
2. Add stale-entry cleanup for file moves and deletes.
3. Expose indexing status to CLI and IDE surfaces.
4. Add failure recovery for interrupted indexing runs.

Exit check:
1. Modified files are reflected in index without full rebuild.

## Day 3 (Wed): Hybrid Retrieval Prototype

1. Implement keyword retrieval baseline and semantic retrieval path.
2. Add hybrid ranking strategy with configurable weighting.
3. Add top-k and token budget limits in retrieval API.
4. Prepare retrieval benchmark query set for Week 3 validation.

Exit check:
1. Retrieval API returns ranked context results with deterministic budget limits.

## Day 4 (Thu): Evaluation and Regression Analysis

1. Run retrieval relevance checks on curated query set.
2. Re-run latency and throughput benchmarks with context retrieval enabled.
3. Compare retrieval and completion performance against Week 2 baseline.
4. Tag regressions with owner and fix plan.

Exit check:
1. Week 3 benchmark comparison report is published and reviewed.

## Day 5 (Fri): Readiness Packaging

1. Compile v0.1 evidence draft for inference, completion, CLI, VSCode, and indexing.
2. Review open risks and unresolved blockers against v0.1 criteria.
3. Lock Week 4 closure scope and defect burn-down list.
4. Publish Week 3 checkpoint and Week 4 hand-off bundle.

Exit check:
1. Release readiness evidence draft is complete and accepted by stream DRIs.

## 5. Demo Evidence Checklist

1. Initial indexing run output and status capture.
2. Incremental update proof for file add, edit, and delete scenarios.
3. Retrieval API sample responses with top-k and token budget fields.
4. Relevance comparison snapshot: hybrid versus keyword-only baseline.
5. Benchmark delta report: first_token_latency_ms, tokens_per_second, acceptance_rate.
6. v0.1 readiness draft with mapped evidence per criterion.

## 6. Risk Watchlist (Week 3)

1. Indexing latency scales poorly for large repositories.
2. Hybrid retrieval quality improvements are inconsistent by language.
3. Retrieval integration causes completion latency regression.
4. Scope creep in F3.2 prototype threatens Week 4 closure goals.

Mitigation owners:
1. Core AI Lead for indexing and retrieval quality risks.
2. Platform Lead for performance regression risks.
3. Product DRI for scope discipline and release gate alignment.

## 7. Friday Checkpoint Template

1. Which F3.1 and F3.2 outcomes shipped with evidence?
2. What performance regression deltas were observed and accepted?
3. Which blockers must be closed in Week 4 to keep v0.1 on-track?
4. Is the v0.1 readiness draft complete by criterion?

## 8. Week 4 Hand-off Inputs

1. Functional indexing and retrieval prototype with documented limits.
2. Week 3 benchmark comparison and regression triage decisions.
3. v0.1 readiness evidence draft mapped to entry criteria.
4. Prioritized Week 4 closure list with owner and due date.
