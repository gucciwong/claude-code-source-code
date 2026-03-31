# Sovereign Coder Sprint 1 Deliverables

> Sprint Window: Weeks 1-2
> Phase Alignment: Foundation Month 1
> Status: Planned
> Date: 2026-03-31

## 1. Sprint Objective

Deliver the first executable slice of the Sovereign Coder Foundation phase: local inference baseline, completion MVP, and developer-facing entry points.

## 2. Sprint Deliverables

1. Local inference bootstrap with Ollama backend and health checks.
2. Hardware profile recommendation table (6GB, 8GB, 12GB, 24GB VRAM).
3. Inline completion MVP flow with accept and reject instrumentation.
4. VSCode plugin MVP shell with runtime connection.
5. CLI command set for model list, switch, and completion request.

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

1. Product DRI: sprint scope and acceptance alignment.
2. Platform DRI: inference runtime and model lifecycle.
3. IDE DRI: VSCode extension behavior.
4. Data DRI: baseline metric collection and dashboard wiring.

## 5. Week-by-Week Plan

## Week 1

1. Complete runtime integration and health checks.
2. Implement inline completion MVP.
3. Stand up CLI commands for model operations.

## Week 2

1. Complete VSCode MVP shell and runtime connection.
2. Capture and review baseline metrics.
3. Finalize Sprint 2 dependency map for context and RAG work.

## 6. Definition of Done

1. All sprint deliverables are functional in local environment.
2. Baseline metrics are captured and versioned.
3. Demo scenarios complete without critical blockers.
4. Sprint 2 backlog is created from unresolved dependencies.

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
