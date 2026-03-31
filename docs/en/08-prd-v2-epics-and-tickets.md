# Sovereign Coder Epics and Tickets

> Status: Draft for execution
> PRD Baseline: Sovereign Coder PRD v1.0
> Date: 2026-03-31

## Epic F1: Local Inference Engine (Phase 1)

### Ticket F1.1: Ollama integration and local runtime bootstrap

- Problem: Product cannot deliver local-first value without a stable inference backend.
- Scope: Integrate Ollama runtime with model discovery, load checks, and health probes.
- Acceptance Criteria:
1. User can run first inference locally without cloud dependency.
2. Runtime health endpoint reports model readiness.
3. Failures return actionable setup guidance.
- Dependencies: Local runtime packaging and model manifest.
- Estimated Effort: 5-7 days.

### Ticket F1.2: Model format and hardware profile support

- Problem: Users have diverse GPUs and need deterministic model compatibility.
- Scope: Support GGUF first and profile-based model recommendations by VRAM tier.
- Acceptance Criteria:
1. 6GB/8GB/12GB/24GB profiles map to validated models.
2. Incompatible model selection is blocked with explanation.
3. Model switching command works in CLI and plugin.
- Dependencies: Ticket F1.1.
- Estimated Effort: 4-6 days.

### Ticket F1.3: Inference performance target validation

- Problem: PRD targets for latency and throughput need measurable enforcement.
- Scope: Benchmark first-token latency and token throughput for baseline models.
- Acceptance Criteria:
1. Benchmark report generated per supported profile.
2. First-token and throughput metrics are versioned.
3. Regression threshold alerts are defined.
- Dependencies: Tickets F1.1 and F1.2.
- Estimated Effort: 3-4 days.

## Epic F2: Completion Engine (Phase 1)

### Ticket F2.1: Inline completion MVP

- Problem: No core coding assistance experience without inline completion.
- Scope: Implement single-line inline completions with tab accept behavior.
- Acceptance Criteria:
1. Inline completion works in active editor with low-latency response.
2. Acceptance and rejection are captured for learning data.
3. Fallback behavior handles low-confidence outputs.
- Dependencies: F1 inference APIs.
- Estimated Effort: 4-6 days.

### Ticket F2.2: Multi-line block completion

- Problem: Real coding tasks require more than token-level prediction.
- Scope: Add multi-line completion mode with preview and accept flow.
- Acceptance Criteria:
1. Multi-line completions can be accepted or partially edited.
2. Completion quality measured by acceptance rate.
3. User controls include disable and retry.
- Dependencies: Ticket F2.1.
- Estimated Effort: 4-5 days.

## Epic F3: Context Awareness and RAG (Phase 1)

### Ticket F3.1: Workspace indexing pipeline

- Problem: Completions and agent behavior degrade without project context.
- Scope: Build file indexing with language-aware chunking and incremental updates.
- Acceptance Criteria:
1. Initial index builds on project open.
2. File change triggers incremental update.
3. Indexing status is visible in CLI or IDE.
- Dependencies: Storage layer and parser support.
- Estimated Effort: 5-7 days.

### Ticket F3.2: Hybrid retrieval service

- Problem: Context retrieval must balance semantic relevance and deterministic recall.
- Scope: Implement semantic, keyword, and hybrid retrieval.
- Acceptance Criteria:
1. Retrieval API supports top-k and token budget constraints.
2. Hybrid ranking improves benchmark queries vs keyword-only baseline.
3. Retrieval latency is within agreed target.
- Dependencies: Ticket F3.1.
- Estimated Effort: 4-6 days.

## Epic F4: IDE and CLI Experience (Phase 1)

### Ticket F4.1: VSCode plugin MVP

- Problem: Primary user adoption depends on first-class IDE workflow.
- Scope: Ship VSCode extension with completion and status feedback.
- Acceptance Criteria:
1. Local model connection and completion are functional.
2. Basic settings page supports model and runtime selection.
3. Error states include self-recovery actions.
- Dependencies: F1 and F2.
- Estimated Effort: 5-7 days.

### Ticket F4.2: CLI MVP command surface

- Problem: Terminal-native users need equivalent first-code capabilities.
- Scope: Provide CLI commands for model listing, switching, and completion requests.
- Acceptance Criteria:
1. CLI can perform completion with local model.
2. CLI can list and switch local models.
3. CLI outputs machine-readable and human-readable modes.
- Dependencies: F1 APIs.
- Estimated Effort: 3-5 days.

## Epic T1: Local Training System (Phase 2)

### Ticket T1.1: QLoRA training orchestration

- Problem: Product differentiation depends on local model adaptation.
- Scope: Implement training job orchestration using QLoRA pipeline.
- Acceptance Criteria:
1. User can start a local fine-tune job with config presets.
2. Checkpoint artifacts are versioned and recoverable.
3. Training logs include loss and runtime metrics.
- Dependencies: Data collection and model management.
- Estimated Effort: 6-8 days.

### Ticket T1.2: Data collection and curation pipeline

- Problem: Training quality depends on robust local data collection.
- Scope: Capture completion feedback, agent trajectories, and correction pairs.
- Acceptance Criteria:
1. Data schema supports required training modalities.
2. User can inspect and exclude samples.
3. Data export and retention policies are documented.
- Dependencies: F2 completion instrumentation.
- Estimated Effort: 5-7 days.

## Epic D1: Federated Learning Core (Phase 3)

### Ticket D1.1: Federation round management

- Problem: Multi-organization learning requires deterministic round lifecycle.
- Scope: Implement join, contribute, aggregate, and pull flow.
- Acceptance Criteria:
1. Nodes can join federation with identity and policy checks.
2. Round state transitions are auditable.
3. Aggregated model update is reproducible.
- Dependencies: Security model and transport.
- Estimated Effort: 7-10 days.

### Ticket D1.2: Privacy-preserving aggregation

- Problem: Federated value requires strong privacy guarantees.
- Scope: Add secure aggregation with optional differential privacy.
- Acceptance Criteria:
1. Raw training data never leaves participant node.
2. Aggregation path is encrypted in transit.
3. Privacy mode toggle is available with impact notes.
- Dependencies: Ticket D1.1.
- Estimated Effort: 6-9 days.

## Sprint 1 Candidate Tickets

1. F1.1 Ollama integration and local runtime bootstrap.
2. F1.2 Model format and hardware profile support.
3. F2.1 Inline completion MVP.
4. F4.1 VSCode plugin MVP.
5. F4.2 CLI MVP command surface.

## Definition of Ready

1. Ticket objective maps to a named PRD section.
2. Acceptance criteria are measurable.
3. Dependency chain is explicit.
4. Owner and target date are assigned.
5. Benchmark impact is identified.

## Definition of Done

1. Acceptance criteria verified with evidence.
2. Baseline and post-change metrics captured.
3. User-facing docs updated.
4. No unresolved high-severity regressions.
5. Rollback path is documented.
