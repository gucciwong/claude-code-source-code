# Sovereign Code v0.7.0 — Federated Learning Sprint Plan

**Version:** v0.7.0  
**Theme:** Federated Learning & Platform Intelligence  
**Baseline commit:** `6ba6309` (v0.6.0 complete, 618 TS tests)

---

## Overview

v0.7.0 advances Sovereign Code from organizational intelligence (v0.6) into **federated intelligence** — enabling multiple Sovereign Code instances to collaboratively improve without sharing raw data, plus a semantic code search engine, a plugin extension system, and an automated PR/code review agent. This release establishes the foundation for the consortium model described in the PRD.

---

## Tasks

### T1: Semantic Code Search (Vector Embeddings)

**Goal:** Let users search their codebase by meaning, not just text. The service indexes code files with vector embeddings and returns semantically similar matches.

**Service:** `services/semantic-search-service/` — FastAPI port 8011  
**Components:**
- `CodeEmbedder` — chunk code files into ~50-line windows, generate vector embeddings (numpy/cosine similarity)
- `IndexManager` — in-memory FAISS-like index (pure numpy for simplicity), persist to SQLite
- `SearchEngine` — query embedding → cosine similarity → top-k ranked results
- Endpoints: `POST /index`, `POST /index/file`, `GET /search?q=…&top_k=5`, `DELETE /index`, `GET /health`
- 20+ Python tests

**Desktop:**
- `shared/semanticSearch.ts` — CodeSnippet, SearchResult, IndexStatus
- `renderer/store/semanticSearchStore.ts` + test (8)
- `renderer/hooks/useSemanticSearch.ts` + test (8)
- `renderer/screens/SemanticSearch.tsx` + test (8) — search bar + results list + index status badge
- `renderer/components/search/` — SearchResultCard, IndexStatusBadge, EmptySearchState
- NavSection: `'semanticsearch'`, Sidebar `Search` icon "Code Search"

**Commit:** `feat(v0.7.0-t1): Semantic Code Search - CodeEmbedder, IndexManager, SearchEngine, SemanticSearch UI, FastAPI port 8011, 40+ tests`

---

### T2: Plugin Extension System

**Goal:** Allow third-party and user-authored plugins to extend Sovereign Code with new tools, screens, and commands. Plugins are local directories with a `plugin.json` manifest.

**Service:** `services/plugin-registry-service/` — FastAPI port 8012  
**Components:**
- `PluginManifest` — Pydantic model: name, version, description, entry_point, permissions[], hooks[]
- `PluginLoader` — scan `~/.sovereign-code/plugins/`, validate manifests, report errors
- `PluginRegistry` — register, enable/disable, uninstall plugins
- `HookDispatcher` — call registered hooks (on_startup, on_chat_message, on_code_review)
- Endpoints: `GET /plugins`, `POST /plugins/install`, `DELETE /plugins/{name}`, `POST /plugins/{name}/enable`, `POST /plugins/{name}/disable`, `GET /health`
- 20+ Python tests

**Desktop:**
- `shared/plugins.ts` — PluginManifest, PluginStatus, HookEvent
- `renderer/store/pluginStore.ts` + test (8)
- `renderer/hooks/usePlugins.ts` + test (8)
- `renderer/screens/Plugins.tsx` + test (8) — installed list + install from path + hook event log
- `renderer/components/plugins/` — PluginCard, InstallPluginDialog, PluginHookLog
- NavSection: `'plugins'`, Sidebar `Puzzle` icon "Plugins"

**Commit:** `feat(v0.7.0-t2): Plugin Extension System - PluginLoader, HookDispatcher, PluginRegistry, Plugins UI, FastAPI port 8012, 40+ tests`

---

### T3: Automated PR Review Agent

**Goal:** Automatically review git diffs before commit/push. The agent runs the Persona Council checks, applies custom rules, and generates a human-readable review report with severity-ranked issues.

**Service:** `services/pr-review-service/` — FastAPI port 8013  
**Components:**
- `GitDiffParser` — parse unified diff format into hunks, extract added/removed lines
- `RuleEngine` — configurable rules: file size limits, TODO/FIXME density, complexity threshold
- `ReviewAggregator` — combine diff analysis + Persona Council scores → consolidated ReviewReport
- `CommentGenerator` — produce inline comments (line number, severity, suggestion)
- Endpoints: `POST /review/diff` (body: diff text), `POST /review/files` (file paths), `GET /rules`, `POST /rules`, `GET /health`
- 20+ Python tests

**Desktop:**
- `shared/prReview.ts` — DiffHunk, ReviewComment, ReviewReport, ReviewRule
- `renderer/store/prReviewStore.ts` + test (8)
- `renderer/hooks/usePRReview.ts` + test (8)
- `renderer/screens/PRReview.tsx` + test (8) — diff paste/upload + review results + inline comment list
- `renderer/components/review/` — DiffViewer, ReviewCommentCard, RuleConfigPanel
- NavSection: `'prreview'`, Sidebar `GitPullRequest` icon "PR Review"

**Commit:** `feat(v0.7.0-t3): Automated PR Review Agent - GitDiffParser, RuleEngine, ReviewAggregator, PRReview UI, FastAPI port 8013, 40+ tests`

---

### T4: Local Model Fine-tuning UI

**Goal:** A complete UI for managing QLoRA fine-tuning runs: dataset upload, hyperparameter config, live loss curve, checkpoint management, and model evaluation.

**Service:** Extends existing `services/training-service/` (port 8001) with new endpoints  
**New endpoints:**
- `POST /finetune/start` — start a QLoRA run with config (model, dataset, epochs, lr, lora_r, lora_alpha)
- `GET /finetune/status/{run_id}` — live training status (loss, epoch, eta)
- `POST /finetune/stop/{run_id}` — cancel run
- `GET /finetune/checkpoints` — list saved checkpoints
- `DELETE /finetune/checkpoints/{name}` — delete checkpoint
- `POST /finetune/evaluate` — run MMLU/HumanEval style eval on a checkpoint

**Desktop:**
- `shared/finetune.ts` — FinetuneConfig, FinetuneStatus, Checkpoint, EvalResult
- `renderer/store/finetuneStore.ts` + test (8)
- `renderer/hooks/useFinetune.ts` + test (8)
- `renderer/screens/Finetune.tsx` + test (8) — 3-tab (Config / Live Training / Checkpoints)
- `renderer/components/finetune/` — HyperparamForm, LossCurve (SVG), CheckpointTable, EvalResultCard
- NavSection: `'finetune'`, Sidebar `Zap` icon (already used) → use `FlaskConical` icon "Fine-tune"

**Commit:** `feat(v0.7.0-t4): Local Model Fine-tuning UI - FinetuneConfig, LossCurve, CheckpointManager, Finetune UI, 40+ tests`

---

### T5: Federated Learning Core

**Goal:** Enable multiple Sovereign Code instances to combine model improvements through FedAvg gradient aggregation, without sharing raw training data. Implement the privacy-preserving protocol described in PRD §4.2.

**Service:** `services/federation-service/` — FastAPI port 8014  
**Components:**
- `FedAvgAggregator` — weighted average of gradient updates from clients
- `DifferentialPrivacy` — add calibrated Gaussian noise (epsilon-delta DP) to gradients before publishing
- `FederationRound` — orchestrate one round: collect updates, aggregate, publish new weights
- `PeerRegistry` — track connected peers (name, address, last_seen, contribution_count)
- Endpoints: `POST /rounds/start`, `POST /rounds/{id}/submit`, `GET /rounds/{id}/aggregated`, `POST /peers/register`, `GET /peers`, `GET /health`
- 20+ Python tests

**Desktop:**
- `shared/federation.ts` — FederationRound, PeerInfo, GradientUpdate, AggregatedWeights
- `renderer/store/federationStore.ts` + test (8) — extends existing federation UI foundation
- `renderer/hooks/useFederation.ts` + test (8)
- `renderer/screens/FederationCore.tsx` + test (8) — round management + peer list + privacy config
- `renderer/components/federation/` — RoundCard, PeerTable, PrivacyConfigPanel, AggregationChart
- NavSection: update existing `'federation'` screen or add `'federationcore'`

**Commit:** `feat(v0.7.0-t5): Federated Learning Core - FedAvgAggregator, DifferentialPrivacy, PeerRegistry, Federation UI, FastAPI port 8014, 40+ tests`

---

## After All 5 Tasks

Update PRD to mark v0.7.0 complete, increment test count, plan v0.8.0.

---

## Test Count Targets

| Task | TS Tests | Python Tests | Total |
|------|----------|--------------|-------|
| Baseline (v0.6.0) | 618 | ~176 | ~794 |
| T1 Semantic Search | +24 | +20 | +44 |
| T2 Plugin System | +24 | +20 | +44 |
| T3 PR Review Agent | +24 | +20 | +44 |
| T4 Fine-tuning UI | +24 | +20 | +44 |
| T5 Federated Learning | +24 | +20 | +44 |
| **v0.7.0 total** | **~738** | **~276** | **~1,014** |

---

## Service Port Map (after v0.7.0)

| Port | Service |
|------|---------|
| 8001 | training-service |
| 8002 | model-manager-service |
| 8003 | knowledge-service |
| 8004 | enterprise-data-service |
| 8005 | execution-trace-service |
| 8006 | orchestration-service |
| 8007 | org-intelligence-service |
| 8008 | persona-council-service |
| 8009 | analytics-service |
| 8010 | messaging-bridge-service |
| 8011 | semantic-search-service |
| 8012 | plugin-registry-service |
| 8013 | pr-review-service |
| 8014 | federation-service |

---

## Navigation Sections (after v0.7.0)

```typescript
type NavSection = 
  | 'dashboard' | 'models' | 'chat' | 'training'
  | 'federation' | 'knowledge' | 'settings'
  | 'enterprise' | 'decisiongraph' | 'orchestration'
  | 'orgintelligence' | 'personacouncil' | 'analytics'
  | 'messaging' | 'semanticsearch' | 'plugins'
  | 'prreview' | 'finetune' | 'federationcore'
```
