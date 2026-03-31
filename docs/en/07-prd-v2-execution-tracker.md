# Sovereign Coder Execution Tracker

> Status: Active
> PRD Baseline: Sovereign Coder PRD v1.0 (2026-03-31)
> Owner Group: Product, Platform Engineering, Applied AI
> Last updated: 2026-04-01

## 1. Purpose

Track delivery against the Sovereign Coder roadmap and ensure every phase milestone has clear ownership, measurable exit criteria, and risk controls.

## 2. Phase Streams

| Phase | Stream | Objective | DRI | Status | Target |
|---|---|---|---|---|---|
| Foundation (M1-M3) | F1 Local Inference | Ship local inference engine with Ollama-first support | Platform | Planned | Month 1 |
| Foundation (M1-M3) | F2 Completion Engine | Deliver inline and multi-line completion | IDE | Planned | Month 1 |
| Foundation (M1-M3) | F3 IDE + CLI UX | VSCode MVP and CLI first-code workflow | Product Eng | Planned | Month 1 |
| Foundation (M1-M3) | F4 Context Awareness | RAG indexing and retrieval in workspace | Core AI | Planned | Month 2 |
| Training (M4-M9) | T1 QLoRA Pipeline | Local fine-tuning with dataset pipeline | Applied AI | Planned | Month 5 |
| Training (M4-M9) | T2 Self-Improve Loop | 10-minute loop and quality gates | Applied AI | Planned | Month 7 |
| Federation (M10-M15) | D1 Federated Core | Secure aggregation and federation rounds | Platform | Planned | Month 11 |
| Federation (M10-M15) | D2 Enterprise Controls | SSO, audit logging, role controls | Enterprise | Planned | Month 13 |

## 3. Milestones

| Milestone | Target | Success Definition | Status |
|---|---|---|---|
| v0.1 First Code | Month 3 | Basic local completion on consumer GPU, VSCode MVP, CLI MVP | Planned |
| v0.5 Self-Improving | Month 9 | Fine-tuning loop shows measurable gains over baseline | Planned |
| v1.0 Federated | Month 15 | First federated consortium operational | Planned |
| v2.0 Platform | Month 24 | Plugin and ecosystem model established | Planned |

## 4. Current Quarter Focus

1. Complete Month 1 deliverables for local inference, completion, VSCode MVP, and CLI MVP.
2. Lock benchmark harness for HumanEval and SWE-bench Lite baseline runs.
3. Finalize hardware profile support matrix for 6GB, 8GB, 12GB, and 24GB VRAM tiers.
4. Enforce ticket-level owner and due-date accountability for Foundation Week 1-4 execution.
5. Publish v0.1 entry criteria and run weekly go or no-go readiness checks.

## 5. Weekly Review Checklist

1. Are Month 1 streams on schedule for v0.1 scope?
2. Any performance regressions against token latency or throughput targets?
3. Any blocking dependency on model format support or runtime integration?
4. Are evaluation baselines reproducible and versioned?
5. Are high-probability risks actively mitigated?

## 6. Risk Register

| Risk | Probability | Impact | Owner | Mitigation | Status |
|---|---|---|---|---|---|
| Local model capability gap vs cloud tools | High | Medium | Applied AI | Prompt optimization, model matrix benchmarking | Open |
| Training instability during QLoRA cycles | Medium | High | Applied AI | Strict quality gates and rollback checkpoints | Open |
| Hardware constraints for target users | Low | High | Platform | Progressive model sizing and quantization defaults | Open |
| Cross-team delivery slippage | Medium | Medium | Product Eng | Weekly dependency triage and scope control | Open |

## 7. Decision Log

| Date | Decision | Owner | Rationale | Follow-up |
|---|---|---|---|---|
| 2026-03-31 | Use Sovereign Coder PRD as canonical baseline | Product | Remove ambiguity across execution docs | Rewrite tracker, epics, KPIs, sprint docs |

## 8. Exit Criteria for Current Planning Cycle

1. Phase-aligned epics and tickets approved.
2. KPI instrumentation aligned with PRD success metrics.
3. Sprint 1 scope locked to Month 1 roadmap outcomes.
4. Ownership and review cadence confirmed for each stream.

## 9. Ticket Ownership and Due Dates (Month 1)

| Ticket | Scope Summary | DRI | Support | Due Date | Status |
|---|---|---|---|---|---|
| F1.1 | Ollama integration and local runtime bootstrap | Platform Lead (TBD) | Runtime Eng | 2026-04-07 | Planned |
| F1.2 | Hardware profile mapping and model compatibility guardrails | Platform Lead (TBD) | Applied AI | 2026-04-10 | Planned |
| F2.1 | Inline completion MVP and feedback events | IDE Lead (TBD) | Data Eng | 2026-04-14 | Planned |
| F4.2 | CLI model operations and completion interface | Product Eng Lead (TBD) | Platform Eng | 2026-04-12 | Planned |
| F4.1 | VSCode MVP runtime connection and status UX | IDE Lead (TBD) | Platform Eng | 2026-04-18 | Planned |

## 10. v0.1 Entry Criteria (Go or No-Go)

1. Local inference completes end-to-end on at least two validated hardware tiers (minimum 8GB and 12GB).
2. Inline completion flow supports suggest, accept, and reject events with complete event payloads.
3. CLI supports model list, model switch, and completion request in both human-readable and machine-readable modes.
4. VSCode MVP demonstrates runtime status, completion request path, and actionable error recovery guidance.
5. Baseline benchmark report is published for first-token latency, token throughput, and acceptance rate.
6. No unresolved critical-severity blockers in local inference and completion path at release review.

## 11. Month 1 Weekly Readout Template

1. Planned versus completed ticket count by stream.
2. Blockers opened and blockers closed this week.
3. Latency, throughput, and acceptance trend versus baseline.
4. Top 3 risks and mitigation owner actions due before next review.
