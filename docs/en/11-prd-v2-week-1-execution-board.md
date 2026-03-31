# Sovereign Coder Week 1 Execution Board

> Scope Window: Foundation Month 1, Week 1
> Alignment: F1.1, F1.2, F2.1, F4.2, F4.1 (prep)
> Status: In Progress (Kickoff Active)
> Date: 2026-04-01
> Kickoff Runbook: docs/en/16-prd-v2-week-1-kickoff-runbook.md

## 1. Week 1 Goal

Stand up the first local-first vertical slice: local runtime health and inference path, inline completion skeleton, and CLI command path with measurable evidence capture.

## 2. Ticket Focus and Ownership

| Ticket | Outcome for Week 1 | DRI | Backup | Due |
|---|---|---|---|---|
| F1.1 | Local runtime bootstrap and health probes working end-to-end | Alex Chen (Platform Lead) | Priya Nair (Runtime Eng) | 2026-04-03 |
| F1.2 | Draft hardware-tier mapping and compatibility checks ready for validation | Alex Chen (Platform Lead) | Mateo Silva (Applied AI) | 2026-04-04 |
| F2.1 | Inline completion request and response loop functional in dev flow | Dana Park (IDE Lead) | Leo Wang (Product Eng) | 2026-04-05 |
| F4.2 | CLI model list and switch commands implemented with output contract | Jordan Kim (Product Eng Lead) | Omar Haddad (Platform Eng) | 2026-04-05 |
| F4.1 (prep) | VSCode runtime connection contract and status command finalized | Dana Park (IDE Lead) | Omar Haddad (Platform Eng) | 2026-04-05 |

## 3. Daily Plan

## Day 1 (Mon): Runtime Foundation

1. Finalize F1.1 technical design notes and interface contract.
2. Implement runtime health endpoint wiring.
3. Add failure-mode setup guidance messages.
4. Confirm local inference smoke test path from CLI.

Exit check:
1. Health check command returns ready or actionable error in less than 2 seconds.

## Day 2 (Tue): Model Compatibility Layer

1. Implement initial VRAM-tier model recommendation table.
2. Add incompatible-model guardrail with clear explanation.
3. Define model manifest schema for runtime checks.
4. Record known unsupported combinations.

Exit check:
1. At least one validated model per target tier can be selected or rejected deterministically.

## Day 3 (Wed): Completion Loop Skeleton

1. Wire F2.1 completion request pipeline to local inference backend.
2. Implement accept and reject action handlers.
3. Emit completion_suggested, completion_accepted, and completion_rejected events.
4. Add low-confidence fallback behavior.

Exit check:
1. Dev user can request, view, and accept one inline completion successfully.

## Day 4 (Thu): CLI Product Path

1. Implement F4.2 commands for model list and model switch.
2. Add completion command with human-readable and machine-readable output modes.
3. Validate command error handling for missing runtime or model.
4. Freeze CLI output contract for downstream automation.

Exit check:
1. CLI commands complete without manual patching in a clean local setup.

## Day 5 (Fri): Integration, Demo, and Baseline

1. Execute end-to-end smoke scenarios across F1.1, F2.1, and F4.2.
2. Capture first-token latency, throughput, and acceptance baseline sample.
3. Complete Week 1 demo runbook and evidence bundle.
4. Publish Week 2 blockers and carry-over list.

Exit check:
1. Week 1 evidence package is complete and reviewed in Friday checkpoint.

## 4. Demo Evidence Checklist

1. Runtime health command output screenshot or terminal capture.
2. Successful local inference request and response trace.
3. Inline completion accept and reject flow recording.
4. CLI model list and switch command outputs.
5. Baseline metrics snapshot:
   - first_token_latency_ms
   - tokens_per_second
   - acceptance_rate
6. Known issues list with owner and target fix date.

## 5. Risk Watchlist (Week 1)

1. Runtime startup instability on lower VRAM devices.
2. Completion latency regressions above target.
3. Command contract churn between IDE and CLI paths.
4. Missing telemetry fields causing unusable baseline reports.

Mitigation owners:
1. Platform Lead for runtime and model compatibility risks.
2. IDE Lead for completion latency and UX fallback risks.
3. Data DRI for telemetry schema completeness.

## 6. Friday Checkpoint Template

1. What was planned versus completed by ticket?
2. Which evidence items are missing?
3. Which blockers can be resolved in Week 2 versus deferred?
4. Are Month 1 v0.1 entry criteria still on track?

## 7. Week 2 Hand-off Inputs

1. Validated hardware profile table from Week 1 observations.
2. Stabilized completion loop with event payload examples.
3. CLI contract version and sample outputs for tooling integration.
4. Prioritized bug list tagged by severity and owner.
