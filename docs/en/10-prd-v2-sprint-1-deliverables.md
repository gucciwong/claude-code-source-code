# Sovereign Code Sprint 1 Deliverables

> Sprint Window: Weeks 1-4 (Foundation Month 1)
> Phase Alignment: Foundation Month 1
> Status: Planned
> Date: 2026-04-01

## 1. Sprint Objective

Deliver the first executable slice of the Sovereign Code Foundation phase: local inference baseline, completion MVP, and developer-facing entry points.

## 2. Sprint Deliverables

1. Local inference bootstrap with Ollama backend and health checks.
2. Hardware profile recommendation table (6GB, 8GB, 12GB, 24GB VRAM).
3. Inline completion MVP flow with accept and reject instrumentation.
4. VSCode plugin MVP shell with runtime connection.
5. CLI command set for model list, switch, and completion request.
6. Baseline benchmark package for first-token latency, throughput, and acceptance.

## 3. Scope by Workstream

## 3.1 Local Inference

1. Connect runtime to local model endpoint.
2. Validate model availability before completion request.
3. Return setup guidance for missing runtime or model.

## 3.2 Completion Experience

1. Enable single-line inline completion.
2. Add acceptance and rejection telemetry events.
3. Add fallback behavior for low-confidence suggestions.

## 3.3 IDE and CLI Surface

1. VSCode command to verify runtime status.
2. CLI commands for model discovery and switching.
3. CLI completion response in human and machine-readable formats.

## 3.4 Measurement and Baseline

1. Capture first-token latency baseline.
2. Capture token throughput baseline.
3. Capture completion acceptance baseline.

## 4. Owners and Roles

1. Product DRI (TBD): sprint scope, acceptance alignment, weekly release readiness.
2. Platform DRI (TBD): inference runtime, model lifecycle, hardware profile gates.
3. IDE DRI (TBD): VSCode extension behavior and completion UX.
4. Product Engineering DRI (TBD): CLI command surface and output contracts.
5. Data DRI (TBD): instrumentation, baseline collection, dashboard wiring.

## 5. Week-by-Week Plan

## Week 1

1. Complete runtime integration and health checks.
2. Implement inline completion MVP.
3. Stand up CLI commands for model operations.

## Week 2

1. Stabilize hardware profile mapping and incompatible model guardrails.
2. Complete CLI completion request flow and output mode validation.
3. Instrument completion accept, reject, and edit-after-accept events.

## Week 3

1. Complete VSCode MVP shell and runtime connection.
2. Add runtime status checks and recovery guidance UX.
3. Capture benchmark baseline on validated hardware tiers.

## Week 4

1. Run end-to-end demo checklist and fix critical blockers.
2. Publish Month 1 baseline report and readiness summary.
3. Finalize Sprint 2 dependency map for context and RAG work.

## 6. Definition of Done

1. All sprint deliverables are functional in local environment.
2. Baseline metrics are captured and versioned.
3. Demo scenarios complete without critical blockers.
4. Sprint 2 backlog is created from unresolved dependencies.
5. Each completed ticket has named owner sign-off and acceptance evidence.
6. Completion and inference events pass schema and null-rate checks.

## 7. Demo Checklist

1. Run local model and verify health status.
2. Trigger inline completion and accept a suggestion.
3. Switch model from CLI and run completion again.
4. Show VSCode runtime connection and completion request path.
5. Show baseline report for latency, throughput, and acceptance.

## 8. Exit Criteria

1. Foundation Month 1 objectives are on-track for v0.1 milestone.
2. No unresolved critical issues in local inference path.
3. Sprint 2 scope is approved for context and indexing expansion.
4. First-token latency and throughput baselines are published for all validated tiers.
5. Acceptance baseline exists and can be compared week over week.
