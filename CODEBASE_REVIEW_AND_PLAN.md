# Sovereign Code — Full Codebase Review & Development Plan

> **Date**: 2025-01  
> **Scope**: 3-pass scan across desktop app, VS Code extension, 17 services, build/deploy infrastructure  
> **Objective**: Pin all bugs, missing features vs PRD/SPEC, launch readiness, and action plans

---

## TABLE OF CONTENTS
1. [Executive Summary](#1-executive-summary)
2. [Bug Registry](#2-bug-registry)
3. [Missing Features vs PRD/SPEC](#3-missing-features-vs-prdspec)
4. [Security Issues](#4-security-issues)
5. [Build & Deploy Gaps](#5-build--deploy-gaps)
6. [Launch Readiness Verdict](#6-launch-readiness-verdict)
7. [Development Plan — Prioritized Sprints](#7-development-plan--prioritized-sprints)

---

## 1. EXECUTIVE SUMMARY

| Metric | Count |
|--------|-------|
| Confirmed Bugs | 17 |
| Missing Features (vs PRD) | 20+ |
| Stub/Placeholder Implementations | 20+ |
| Security Issues | 17 |
| Build/Deploy Blockers | 4 |
| Services Ready for Production | 2 of 17 |

**Overall Status**: `SOVEREIGN_CODE_STATUS.md` says ~30% complete. After 3 scans, this is accurate. The **core chat loop works** (Desktop → Ollama), the desktop UI is structurally complete with 6 screens, and 314 tests pass. But nearly **every advanced feature is a stub**, the voice integration endpoint is **broken**, and the build pipeline **cannot produce installable packages** without fixes.

**Can it "make money" today?** No — but a focused **4-sprint plan** (below) can get a **Minimum Viable Product shipped**.

---

## 2. BUG REGISTRY

### P0 — Launch Blockers

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| B1 | **Voice endpoint mismatch**: Desktop calls `POST /synthesize` (JSON), service exposes `POST /speak` (FormData) | `apps/desktop/src/renderer/src/hooks/useVoiceService.ts` ↔ `services/voice-service/app/main.py` | Voice synthesis always fails with 404 |
| B2 | **Missing `resources/` directory**: electron-builder.json references `"buildResources": "resources"` but directory doesn't exist — build fails | `apps/desktop/electron-builder.json` | Cannot produce Windows/Mac/Linux installers |
| B3 | **Deploy script calls non-existent npm scripts**: `dist:win`, `dist:mac`, `dist:linux` don't exist in package.json | `scripts/deploy.ps1` lines 252/277/302 | Deployment pipeline completely broken |
| B4 | **No LICENSE file**: Legal shipping blocker | Repository root | Cannot legally distribute |

### P1 — Critical Bugs

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| B5 | **Silent streaming failure**: When Ollama stream fails mid-response, catch block sets `content: "Error..."` but no UI recovery mechanism | `apps/desktop/src/renderer/src/services/ollamaClient.ts` | User sees partial response with no way to retry |
| B6 | **Misleading training error responses**: `.catch()` returns `{ event_id: 'error', created_at: ... }` — fake success object masking failure | `apps/desktop/src/renderer/src/services/trainingClient.ts` | Training events silently lost, analytics corrupted |
| B7 | **Error state never clears in voice hook**: `setTranscriptionError()` set on failure but never cleared on subsequent success | `apps/desktop/src/renderer/src/hooks/useVoiceService.ts` | Stale error messages persist after recovery |
| B8 | **Race condition in model download polling**: `setInterval` polls download status but doesn't guard against concurrent polls or unmount | `apps/desktop/src/renderer/src/stores/modelManagerStore.ts` | Memory leak, stale state, duplicate polls |
| B9 | **RAG indexer race condition**: Indexer starts async but completions begin immediately — first N completions have no RAG context | `apps/vscode-extension/src/rag/indexer.ts` | Cold-start completions are low quality |
| B10 | **Silent DB init failure in extension**: SQLite DB creation error is caught and logged but extension continues without DB | `apps/vscode-extension/src/rag/store.ts` | All RAG features silently disabled |
| B11 | **ChunkStore loads ALL chunks for search**: No pagination on `getAllChunks()` — loads entire project into memory | `apps/vscode-extension/src/rag/store.ts` | OOM crash on large repositories |
| B12 | **Unguarded training telemetry in Chat**: Training events fire on every completion without checking if training service is configured | `apps/desktop/src/renderer/src/screens/Chat.tsx` | Console spam, wasted fetch calls |

### P2 — Moderate Bugs

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| B13 | **No error state in Models screen**: Download failures have no UI feedback | `apps/desktop/src/renderer/src/screens/Models.tsx` | User doesn't know download failed |
| B14 | **Silent Ollama polling failure**: `useOllamaStatus` swallows all errors and retries forever | `apps/desktop/src/renderer/src/hooks/useOllamaStatus.ts` | No degraded-state notification |
| B15 | **Training interval leak**: `setInterval` for status checking not cleaned up on component unmount | `apps/desktop/src/renderer/src/hooks/useTrainingService.ts` | Memory leak in long sessions |
| B16 | **Config update fire-and-forget in extension**: Workspace config changes trigger re-init without awaiting completion | `apps/vscode-extension/src/extension.ts` | Race conditions on rapid config changes |
| B17 | **Cancellation token fragility**: CancellationToken not checked between async operations in completion provider | `apps/vscode-extension/src/completionProvider.ts` | Stale completions returned after user moves cursor |

---

## 3. MISSING FEATURES vs PRD/SPEC

### Desktop App vs `SOVEREIGN_CODE_ARCHITECTURE.md` / `RELEASE_NOTES_v1.0.0.md`

| Feature (PRD) | Status | Notes |
|---------------|--------|-------|
| Chat with Ollama | ✅ Working | Core loop functional |
| Streaming responses | ⚠️ Partial | No stop/interrupt button |
| Model browsing | ✅ Working | List + active model selection |
| Model download | ❌ UI Stub | Backend ready, UI button disabled/non-functional |
| Model fine-tune | ❌ Stub | Button exists, no implementation |
| Model delete | ❌ Stub | Button exists, no implementation |
| Training dashboard | ❌ Stub | Screen exists, controls non-functional |
| Voice input (STT) | ❌ Broken | Endpoint mismatch (B1) |
| Voice output (TTS) | ❌ Broken | Endpoint mismatch (B1) |
| Settings panel | ⚠️ Partial | Service URLs shown, limited configuration |
| System status/health | ⚠️ Partial | Basic Ollama status only, no GPU/service health |
| Agent mode | ❌ Stub | UI shell exists, no execution engine |
| Command palette | ⚠️ Basic | Minimal commands, no extensibility |
| Conversation history persistence | ❌ Missing | No local storage of chat history |
| Multi-model comparison | ❌ Missing | Not implemented |
| Code execution sandbox | ❌ Missing | Not implemented |

### VS Code Extension vs PRD

| Feature (PRD) | Status | Notes |
|---------------|--------|-------|
| Inline completions | ✅ Working | Ollama-powered with RAG context |
| RAG context retrieval | ⚠️ Partial | Works but OOM risk on large repos (B11) |
| Chat panel | ❌ Missing | No sidebar chat integration |
| Model selection command | ❌ Missing | Hardcoded model in config |
| Training data collection | ❌ Missing | Not implemented |
| Desktop service integration | ❌ Missing | Extension is fully standalone |

### Services vs `SOVEREIGN_CODE_ARCHITECTURE.md`

| Service | PRD Status | Actual |
|---------|-----------|--------|
| model-manager | Core required | 70% — works for model listing/download |
| training-service | Core required | 85% — DB + API complete, no model integration |
| voice-service | Core required | 80% — ML pipeline works, endpoint naming issues |
| analytics-service | Required | 60% — event tracking only, no dashboards |
| knowledge-service | Required | 55% — embeddings done, no integration |
| semantic-search-service | Required | 65% — search API done, no consumers |
| code-completion-service | Required | 45% — basic proxy, no enhancement |
| orchestration-service | Required | 50% — session management only |
| federation-service | Required | 35% — peer registration only, no persistence |
| enterprise-data-service | Optional | 70% — audit logging done |
| execution-trace-service | Optional | 65% — tracing works |
| memory-service | Optional | 60% — CRUD only |
| messaging-bridge-service | Optional | 40% — webhook stub |
| org-intelligence-service | Optional | 65% — insights API |
| persona-council-service | Optional | 60% — persona definitions |
| plugin-registry-service | Optional | 60% — registry CRUD |
| pr-review-service | Optional | 70% — review API |

### Critical Architecture Gap: No Service-to-Service Communication
The PRD describes an **orchestration layer** coordinating services. In reality:
- **Zero inter-service calls exist** in the codebase
- Each service is a standalone island
- No event bus, message queue, or shared state
- Orchestration service only manages session state, doesn't orchestrate anything

---

## 4. SECURITY ISSUES

### Critical

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| S1 | **12/17 services have `allow_origins=["*"]` CORS** | All services `main.py` | Restrict to desktop app origin |
| S2 | **SSRF risk in extension**: User-configured Ollama URL used without validation | `apps/vscode-extension/src/ollamaClient.ts` | Validate URL scheme and host |
| S3 | **No rate limiting on any service** | All 17 services | Add FastAPI rate limiting middleware |
| S4 | **Execution-trace sandbox risk**: User code runs in subprocess with no sandboxing | `services/execution-trace-service/` | Add resource limits and sandboxing |
| S5 | **No request timeouts on most fetches** | Desktop service clients | Add AbortController with timeout |

### Moderate

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| S6 | **No response validation on API calls** | All desktop service clients | Add Zod/schema validation |
| S7 | **8 services use in-memory-only storage** | Multiple services | Add persistence layer |
| S8 | **Federation peer registry ephemeral** | `services/federation-service/` | Add DB-backed storage |
| S9 | **No CSP headers in Electron** | `apps/desktop/src/main/main.ts` | Add Content Security Policy |
| S10 | **Hardcoded localhost URLs without env var fallback** | Multiple files | Use environment variables consistently |

### Low

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| S11 | **sandbox: false in Electron** | Electron main process | Enable sandboxing |
| S12 | **No logging/audit trail for security events** | All services | Add security event logging |
| S13 | **Unencrypted SQLite databases** | Extension RAG store, training service | Add encryption-at-rest |
| S14 | **No code signing for builds** | `scripts/deploy.ps1` | Add code signing certs |
| S15-17 | **Various missing validations** | Multiple locations | Input/output validation |

---

## 5. BUILD & DEPLOY GAPS

| Gap | Severity | Fix Needed |
|-----|----------|-----------|
| No `resources/` dir (icons) for electron-builder | 🔴 Blocker | Create directory + add icon files |
| Deploy script calls non-existent npm scripts | 🔴 Blocker | Add `dist:win/mac/linux` scripts or fix deploy.ps1 |
| Only 1 of 17 services has a Dockerfile | 🔴 Blocker for multi-service deploy | Create Dockerfiles |
| docker-compose.yml only has voice-service + redis | 🔴 Blocker | Add all required services |
| No CI/CD for desktop builds | 🟡 High | Add GitHub Actions workflow |
| No CI/CD for service deployment | 🟡 High | Add Docker build + push workflow |
| Prometheus/Grafana configs orphaned | 🟡 Medium | Integrate into docker-compose |
| No environment-specific configs (dev/staging/prod) | 🟡 Medium | Add env switching |
| macOS/Linux builds completely untested | 🟡 Medium | Test + fix platform-specific issues |

---

## 6. LAUNCH READINESS VERDICT

### What Works Today ✅
1. **Chat with Ollama** — full send → stream → display cycle
2. **Model listing** — browse available models from Ollama
3. **VS Code inline completions** — RAG-powered code suggestions
4. **Desktop UI** — 6 screens render, navigation works, design tokens applied
5. **314 unit tests passing** — good test foundation

### What's Broken / Missing for MVP ❌
1. Voice features broken (endpoint mismatch)
2. Cannot build installers (missing resources)
3. Model download UI non-functional
4. No chat history persistence
5. No streaming interrupt
6. 15 of 17 services not production-deployable

### Verdict: **NOT READY TO SHIP**
**But the core value proposition (local AI coding assistant + VS Code extension) CAN ship with focused fixes.**

---

## 7. DEVELOPMENT PLAN — Prioritized Sprints

### 🔴 Sprint 0 — Ship Blockers (P0 fixes)
> **Goal**: Make the product buildable and legally distributable

| Task | Bug/Gap | Effort |
|------|---------|--------|
| Create `apps/desktop/resources/` with app icons (ico/icns/png) | B2 | Small |
| Add LICENSE file to repo root | B4 | Trivial |
| Fix `scripts/deploy.ps1` to use correct npm scripts (`build:win` etc) | B3 | Small |
| Fix voice endpoint: add `/synthesize` JSON endpoint to voice-service OR update desktop to call `/speak` with FormData | B1 | Medium |

**Exit Criteria**: `npm run build:win` succeeds and produces .exe installer

---

### 🟡 Sprint 1 — Core Bug Fixes (P1)
> **Goal**: Make existing features reliable

| Task | Bug | Effort |
|------|-----|--------|
| Add streaming error recovery + retry button in Chat | B5 | Medium |
| Fix training client to throw on error instead of returning fake success | B6 | Small |
| Clear voice error state on subsequent success | B7 | Small |
| Fix model download polling: add cleanup on unmount, guard concurrent polls | B8 | Medium |
| Add RAG indexer readiness gate — block completions until index is ready or use fallback | B9 | Medium |
| Handle SQLite init failure gracefully in extension — show warning, disable RAG features | B10 | Small |
| Add pagination to ChunkStore.getAllChunks() | B11 | Medium |
| Guard training telemetry behind service-available check | B12 | Small |
| Add error UI to Models screen for download failures | B13 | Small |
| Add degraded-state indicator for Ollama connection | B14 | Small |
| Fix training interval cleanup on unmount | B15 | Small |
| Add abort timeout to all HTTP fetches (5s default) | S5 | Medium |

**Exit Criteria**: All 314 existing tests still pass + new tests for each fix

---

### 🟢 Sprint 2 — MVP Feature Completion
> **Goal**: Ship features users expect from a coding assistant

| Task | Feature | Effort |
|------|---------|--------|
| Implement model download UI (connect button to model-manager POST /download) | Missing | Medium |
| Add streaming stop/interrupt button | Missing | Medium |
| Add persistent chat history (localStorage or IndexedDB) | Missing | Large |
| Implement model delete via UI | Missing | Small |
| Add request timeout to all service clients | S5 | Medium |
| Restrict CORS to desktop app origin on model-manager, training, voice services | S1 (partial) | Small |
| Add SSRF validation to extension Ollama URL config | S2 | Small |
| Add Content Security Policy to Electron | S9 | Medium |
| Implement VS Code extension chat sidebar panel | Missing | Large |
| Add model selection command to VS Code extension | Missing | Medium |

**Exit Criteria**: A user can install → chat → download models → get VS Code completions end-to-end

---

### 🔵 Sprint 3 — Production Hardening
> **Goal**: Make it reliable enough for paying users

| Task | Category | Effort |
|------|----------|--------|
| Create Dockerfiles for model-manager, training-service, orchestration-service | Deploy | Medium |
| Extend docker-compose.yml with core services | Deploy | Medium |
| Add GitHub Actions CI for desktop builds (Win/Mac/Linux matrix) | Deploy | Large |
| Add rate limiting middleware to all services | Security | Medium |
| Implement service health dashboard (replace stub) | Feature | Large |
| Add response validation (Zod schemas) to all desktop API clients | Security | Large |
| Replace in-memory storage with SQLite/Redis for core services | Data | Large |
| Add error boundary components to all screens | Reliability | Medium |
| Integration testing: desktop ↔ all services end-to-end | Testing | Large |
| Add telemetry/analytics for crash reporting | Monitoring | Medium |

**Exit Criteria**: App is installable, services are containerized, CI pipeline runs on push

---

### 🟣 Sprint 4+ — Growth Features (Post-Launch)
> **Goal**: Features that differentiate and create moat

| Task | Category | Effort |
|------|----------|--------|
| Agent mode with actual code execution | Feature | X-Large |
| Training dashboard with real model fine-tuning | Feature | X-Large |
| Federation: multi-peer model sharing | Feature | X-Large |
| Multi-model comparison view | Feature | Large |
| Plugin system for extensibility | Feature | X-Large |
| Enterprise data integration | Feature | Large |
| Service-to-service orchestration layer | Architecture | X-Large |
| Performance monitoring dashboards (Prometheus/Grafana) | Ops | Large |

---

## APPENDIX: Service Implementation Matrix

| Service | Completeness | Production-Ready? | Critical Gaps |
|---------|-------------|-------------------|---------------|
| model-manager | 70% | ⚠️ Almost | No persistence for download history |
| training-service | 85% | ⚠️ Almost | No actual model training integration |
| voice-service | 80% | ⚠️ Almost | Endpoint naming mismatch with desktop |
| analytics-service | 60% | ❌ | No dashboard, in-memory only |
| enterprise-data-service | 70% | ❌ | No external DB integration |
| execution-trace-service | 65% | ❌ | Sandbox security risk |
| knowledge-service | 55% | ❌ | No consumers wired |
| memory-service | 60% | ❌ | In-memory only |
| messaging-bridge-service | 40% | ❌ | Webhook stub only |
| orchestration-service | 50% | ❌ | No actual orchestration |
| org-intelligence-service | 65% | ❌ | In-memory only |
| persona-council-service | 60% | ❌ | No consumers |
| plugin-registry-service | 60% | ❌ | In-memory only |
| pr-review-service | 70% | ❌ | No git integration |
| semantic-search-service | 65% | ❌ | No consumers wired |
| code-completion-service | 45% | ❌ | Basic proxy only |
| federation-service | 35% | ❌ | No persistence, no real peering |

---

*Generated by 3-pass codebase review: Scan 1 (deep per-layer), Scan 2 (cross-cutting integration), Scan 3 (launch readiness).*
