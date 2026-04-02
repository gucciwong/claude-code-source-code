# Sovereign Coder — Feature Gap Analysis vs PRD & LM Studio Reference
_Last updated: 2026-04-19_

---

## Executive Summary

This document is a comprehensive gap analysis comparing (a) the current `apps/desktop` codebase, (b) the Sovereign Coder PRD v2.0, and (c) the LM Studio UX reference (3 screenshots reviewed). It identifies every disconnected, hardcoded, or missing feature and provides a prioritised implementation plan.

**The single most critical gap:** There is **no HuggingFace model download entry point** anywhere in the UI. The backend service and hook both exist but were never wired to the Models screen. A user literally cannot download a model from HuggingFace inside the app today.

---

## Part 1 — Where to Download Models (Answer to: "Where is HuggingFace?")

### Current state of `Models.tsx`

The Models screen (`apps/desktop/src/renderer/screens/Models.tsx`) **only shows Ollama-installed models**. It reads from `useModelsStore` which is populated from the Ollama API (`GET http://localhost:11434/api/tags`). The store only contains: `name`, `size`, `digest`, `modified_at`.

There is no:
- HuggingFace browser / search panel
- Download button or download progress
- Any call to the Model Manager service (port 8002)

### What exists but is unused

| File | What it provides | Currently consumed by |
|------|-----------------|----------------------|
| `apps/desktop/src/renderer/hooks/useModelManager.ts` | `checkHealth()`, `getMirrorInfo()`, `getSwitchMirrorInstructions()`, `listModels()`, `downloadModel(modelId)`, `setActiveModel(modelId)` | Only `MirrorSelector.tsx` reads `getMirrorInfo` + `getSwitchMirrorInstructions` — **nothing calls `downloadModel` or `listModels`** |
| `services/model-manager/main.py` (port 8002) | `GET /health`, `GET /api/v1/mirror`, `POST /api/v1/mirror/switch`, `GET /api/v1/models` (lists cached models), `POST /api/v1/models/{model_id}/download` (triggers HF download) | The backend runs independently; no screen actually POSTs to download |

### LM Studio reference (screenshots)

LM Studio shows a full embedded HuggingFace browser:
- Left sidebar: **My Models** with categories (LLMs / Text Embedding / Multimodal) + **View All** tab
- Central panel: list of downloaded models with device indicator, parameter count, publisher
- Top-right button: **"Search models on HuggingFace"** → opens the HF browser overlay
- HF browser overlay: search bar, Staff Picks list, model cards showing: params (e.g. "24B"), arch (mistral), domain (llm), format (GGUF / MLX), capabilities (Vision, Tool Use, Reasoning), quantization selector (Q4_K_M etc.), download size, download button

### What needs to be built

Add a **"Download" tab** or **"+ Add model" button** in `Models.tsx` that opens a HuggingFace browsing panel:

```
Models screen
├── Installed  ← current view
└── Download   ← NEW: HF browser panel
     ├── Search input (calls model-manager /api/v1/search or HF API)
     ├── Staff Picks section (static curated list to start)
     ├── Model cards: name · params · arch · format · quant selector · size · ⬇ button
     └── Active downloads list with progress bars
```

---

## Part 2 — Complete Feature Gap Matrix

### 2.1 PRD Claims vs Actual Implementation

The PRD v2.0 status table marks most P0 features as "✅ Built". Below is what the code actually shows:

| PRD Feature | PRD Claim | Actual Status | File |
|-------------|-----------|---------------|------|
| Inline code autocomplete | ✅ Built | ⚠️ `CodeCompletion.tsx` exists with real hook `useCodeCompletion` — needs verification that VS Code extension bridge works end-to-end | `screens/CodeCompletion.tsx` |
| Chat (RAG + streaming) | ✅ Built | ✅ Real Ollama streaming with full telemetry & training signal collection | `screens/Chat.tsx` |
| HuggingFace model download | ✅ Built | ❌ **Backend exists, UI never built** — no HF browser in Models screen | `screens/Models.tsx` |
| HF mirror toggle (China) | ✅ Built | ⚠️ Shows CLI instructions only; does NOT call the switch endpoint | `components/common/MirrorSelector.tsx` |
| QLoRA training loop | ✅ Built | ⚠️ Training screen shows 3 hardcoded fake runs ("v1.4", "v1.3", "v1.2"); progress hardcoded to 48; GPU stats hardcoded | `screens/Training.tsx` |
| Federated learning P2P | ✅ Built | 🔵 Dual screens: `Federation.tsx` = 100% mock data; `FederationCore.tsx` = properly implemented | `screens/Federation.tsx`, `screens/FederationCore.tsx` |
| Analytics / productivity metrics | ✅ Built | ✅ Real API integration via `useAnalytics` / `useAnalyticsStore` | `screens/Analytics.tsx` |
| Local fine-tuning (LoRA) | ✅ Built | ✅ Real API integration via `useFinetune` / `useFinetuneStore` | `screens/Finetune.tsx` |
| Multi-agent orchestration | ✅ Built | ✅ Real API integration via `useOrchestration` / `useOrchestrationStore` | `screens/Orchestration.tsx` |
| Knowledge library | ✅ Built | ✅ Uses `useKnowledgeLibraryStore` with components | `screens/Knowledge.tsx` |
| Conversation memory | ✅ Built | Exists as `ConversationMemory.tsx` | `screens/ConversationMemory.tsx` |
| PR review automation | ✅ Built | Exists as `PRReview.tsx` with hook | `screens/PRReview.tsx` |
| Semantic code search | ✅ Built | Exists as `SemanticSearch.tsx` | `screens/SemanticSearch.tsx` |
| Plugin system | ✅ Built | Exists as `Plugins.tsx` | `screens/Plugins.tsx` |
| IM bridge (messaging) | ✅ Built | Exists as `Messaging.tsx` | `screens/Messaging.tsx` |
| Adversarial persona council | ✅ Built | Exists as `PersonaCouncil.tsx` | `screens/PersonaCouncil.tsx` |
| Org intelligence | ✅ Built | Exists as `OrgIntelligence.tsx` | `screens/OrgIntelligence.tsx` |
| Decision graph | ✅ Built | Exists as `DecisionGraph.tsx` | `screens/DecisionGraph.tsx` |
| Enterprise / SSO | ✅ Built | Exists as `Enterprise.tsx` | `screens/Enterprise.tsx` |
| Voice I/O | ✅ Built | Voice store + hook + components exist; panel accessible via Sidebar | `store/voiceStore.ts`, `components/voice/` |

---

### 2.2 Hardcoded Mock Data — Critical Data Quality Issues

#### `Training.tsx` — mock data throughout

```typescript
// Hardcoded — should come from training service
const [trainingRuns] = useState([
  { id: 1, version: 'v1.4', status: 'completed', sample_count: 847, training_time: '2h 14m', validation_loss: 0.342, improvement: 8.7, timestamp: '2 days ago' },
  { id: 2, version: 'v1.3', status: 'completed', ... },
  { id: 3, version: 'v1.2', status: 'failed', ... },
])
const [progress, setProgress] = useState(48)       // hardcoded to 48%
const [isRunning, setIsRunning] = useState(false)   // local state, not from service

// Hardcoded GPU stats shown when "running":
"GPU: RTX 4090 · VRAM: 22.1/24 GB · Temp: 78°C · TDP: 310W"

// The screen DOES use useTrainingService() for:
//   - isServiceAvailable
//   - eventCount (real)
//   - trainingStatus.is_training (real) — but isRunning is NOT derived from it
```

#### `Federation.tsx` — entirely disconnected from reality

```typescript
// Hardcoded — should come from federation service
const [federations] = useState([
  { id: 1, name: 'Finance AI Consortium', peers: 23, status: 'active', contribution: 18.7, reward: 145.2 },
  { id: 2, name: 'Open Source Coder Commons', peers: 67, status: 'syncing', contribution: 31.2, reward: 89.7 },
])

// No imports from useFederationCore or any real hook
// "Join Federation", "Details", "Pause", "Leave" buttons: all have no handlers
```

Note: `FederationCore.tsx` (nav item "Fed Core") is the properly implemented replacement. The old `Federation.tsx` under nav item "Federation" is legacy and shows fake data.

---

### 2.3 LM Studio UX Parity Gaps

These features exist in LM Studio but are missing or weaker in Sovereign Coder:

| LM Studio Feature | LM Studio | Sovereign Coder | Gap |
|-------------------|-----------|-----------------|-----|
| HuggingFace model browser | Full embedded browser with staff picks, search, model cards | Not present | ❌ Missing entirely |
| Model categories | LLMs / Text Embedding / Multimodal tabs in sidebar | Not present | ❌ Missing |
| Model metadata | params, arch, domain, format, capabilities badges | Only shows digest/size/modified_at | ❌ Missing |
| Quantization selector | Q4_K_M, Q5_K_M, Q8, F16 dropdown per model | Not present | ❌ Missing |
| Download progress | Progress bar with GB downloaded / total | Not present | ❌ Missing |
| Model README | Full README display in model detail | Not present | ❌ Missing |
| Staff picks / curation | Curated model list on HF browser home | Not present | ❌ Missing |
| In-app mirror toggle | N/A (LM Studio uses official HF) | CLI instructions only, no real switch | ⚠️ Partially missing |
| Developer/API docs section | Local server endpoint docs, Anthropic-compat | Not present | ❌ Missing |
| Model file management | Reveal in Finder, copy path | Not present | ❌ Missing |

---

### 2.4 Orphaned Code — Hooks That Exist But Are Never Called

| Hook | Functions | Should Be Used In |
|------|-----------|-------------------|
| `hooks/useModelManager.ts` | `listModels()`, `downloadModel(id)`, `setActiveModel(id)` | `Models.tsx` — add HF browser |
| `hooks/useModelManager.ts` | `getMirrorInfo()`, call `POST /api/v1/mirror/switch` | `MirrorSelector.tsx` — replace CLI instruction with real switch |
| `store/modelsStore.ts` | Only `OllamaModel` shape (no metadata fields) | Extend to include `params`, `arch`, `format`, `capabilities` |

---

## Part 3 — Prioritised Implementation Plan

### P0 — Unblock Basic Use (User Cannot Complete Core Task)

#### Task 1: Add HuggingFace Model Download UI to Models Screen

**Why:** A new user cannot download any model from the app today. This is the most critical missing feature and directly answers the user's question.

**Backend available:** `POST /api/v1/models/{model_id}/download` at port 8002; `GET /api/v1/models` for cached models list. `useModelManager.ts` has `downloadModel()` and `listModels()`.

**Implementation:**

1. Add a **tab row** to `Models.tsx`:
   ```
   [Installed (N)]  [Download from HuggingFace]
   ```

2. "Download" tab renders a new `<HuggingFacePanel />` component:
   - Search input with debounce → query HF API or model-manager proxy
   - Staff Picks section: hardcode a curated list of 6 popular GGUF models as starter content (Llama 3.1 8B, Mistral 7B, Qwen2, Phi-3, etc.)
   - Model card component: name, params, quantization `<select>`, download size, `⬇ Download` button
   - Active downloads section: progress bars via polling `GET /api/v1/models`

3. Wire `useModelManager.downloadModel(modelId)` to the Download button.

4. Show download status in the Installed tab once complete.

**Files to create/modify:**
- `apps/desktop/src/renderer/screens/Models.tsx` — add tabs + import panel
- `apps/desktop/src/renderer/components/models/HuggingFacePanel.tsx` — new component
- `apps/desktop/src/renderer/components/models/ModelCard.tsx` — new component
- `apps/desktop/src/renderer/components/models/DownloadProgress.tsx` — new component

**Effort:** Medium (1-2 days)

---

#### Task 2: Make Mirror Toggle Actually Switch Mirrors

**Why:** China users see "Run this command in your terminal" — a poor UX and non-functional within the app.

**Backend available:** `POST /api/v1/mirror/switch` at port 8002 with body `{ mirror_name: "mirror" | "official" }`.

**Implementation:**

Rewrite `MirrorSelector.tsx`:
1. Replace "To switch, run: `export HF_MIRROR=mirror`" with two radio buttons: `🌐 Official (HuggingFace.co)` / `🇨🇳 China Mirror (hf-mirror.com)`
2. On selection change → call `POST /api/v1/mirror/switch`
3. Show success toast + "restart service" confirmation dialog if needed

**Files to modify:**
- `apps/desktop/src/renderer/components/common/MirrorSelector.tsx`

**Effort:** Small (2-4 hours)

---

### P1 — Fix Misleading / Wrong Data

#### Task 3: Wire Training Screen to Real Service Data

**Why:** The 3 "training runs" shown (v1.4, v1.3, v1.2) are hardcoded and have never actually run. The progress bar is stuck at 48%. Users making training decisions based on this data are seeing fiction.

**Service available:** Training service at port 8001 via `useTrainingService()` — already imported in Training.tsx. `trainingStatus` contains `is_training`, `uptime_seconds`.

**Implementation:**

1. Add `runs` field to training service response OR poll `GET /api/v1/training/history` 
2. Replace `const [trainingRuns] = useState([...hardcoded...])` with data from store
3. Derive `isRunning` from `trainingStatus?.is_training ?? false`
4. Derive `progress` from `trainingStatus?.progress ?? 0`
5. Remove the hardcoded "RTX 4090 · VRAM: 22.1/24 GB" string — replace with live `useSystemStore` GPU stats

**Files to modify:**
- `apps/desktop/src/renderer/screens/Training.tsx`
- Potentially `apps/desktop/src/renderer/hooks/useTrainingService.ts` (add history fetch)

**Effort:** Small-Medium (4-6 hours)

---

#### Task 4: Remove or Fix Legacy Federation Screen

**Why:** `Federation.tsx` (accessible via "Federation" nav item) shows 2 hardcoded fake federations ("Finance AI Consortium", "Open Source Coder Commons") with no real handlers. `FederationCore.tsx` is the properly-built replacement accessible via "Fed Core" nav item.

**Options:**
- **Option A (recommended):** Replace `Federation.tsx` with a thin redirect component that navigates to `federationcore` — or merge the two nav items
- **Option B:** Rewrite `Federation.tsx` to use `useFederationCore` hook data
- **Option C:** Remove `Federation` from the nav sidebar, keeping only `FederationCore`

**Files to modify:**
- `apps/desktop/src/renderer/screens/Federation.tsx` — rewrite or redirect
- `apps/desktop/src/renderer/components/layout/Sidebar.tsx` — remove duplicate nav item

**Effort:** Small (2-3 hours)

---

### P2 — LM Studio UX Parity Improvements

#### Task 5: Model Metadata Display

**Why:** LM Studio shows params (7B/13B), architecture (llama/mistral), format (GGUF/GGML/MLX), and capabilities badges. Sovereign Coder's model detail only shows digest/size/modified date.

**Implementation:**

1. Extend `OllamaModel` type in `modelsStore.ts` to include optional: `parameter_size`, `architecture`, `format`, `capabilities`
2. Fetch extended model info from `GET http://localhost:11434/api/show` on model selection
3. Display in model detail panel: parameter count badge, architecture tag, capability chips (Vision, Code, Reasoning)

**Files to modify:**
- `apps/desktop/src/renderer/store/modelsStore.ts`
- `apps/desktop/src/renderer/screens/Models.tsx`

**Effort:** Small (3-4 hours)

---

#### Task 6: Add Developer / Local API Docs Section

**Why:** LM Studio's third screenshot shows a Developer section with live server endpoint documentation, client code examples (curl/Python), and Anthropic-compatible endpoint reference. This helps developers integrate with the local inference server.

**Implementation:**

Add a new "API" tab or section to the Dashboard or a new `Developer` screen showing:
- Current model endpoint: `http://localhost:11434/v1`
- Anthropic-compatible endpoint if enabled
- Ready-to-copy curl examples
- Python/Node SDK snippets

**Effort:** Small (2-4 hours)

---

### P3 — Polish and Completeness

#### Task 7: Model Categories in Sidebar

Add category filters in the Models screen left panel: All / LLMs / Embedding / Multimodal. Filter based on model name heuristics or metadata tags.

**Effort:** Small

#### Task 8: Download Progress Tracking

Add real-time progress for active HuggingFace downloads in both the Download panel and the model list. Poll `GET /api/v1/models` and show bytes-downloaded/total.

**Effort:** Small-Medium

#### Task 9: Quantization Selector

When initiating a HuggingFace download, show a dropdown of available quantization levels (Q4_K_M, Q5_K_M, Q8_0, F16) and pass the selected quant to the download endpoint.

**Effort:** Small

---

## Part 4 — What IS Working Well

Before the to-do list takes over: these areas are properly implemented and should not be broken during gap remediation:

| Screen | Status | Notes |
|--------|--------|-------|
| Chat | ✅ Real | Ollama streaming, telemetry, training signal collection |
| Analytics | ✅ Real | `useAnalytics` + `useAnalyticsStore` connected to analytics service |
| Finetune | ✅ Real | `useFinetune` + `useFinetuneStore` with jobs, checkpoints, loss curve |
| Orchestration | ✅ Real | `useOrchestration` with session create/manage |
| FederationCore | ✅ Real | `useFederationCore` with peer register/unregister, round start |
| Knowledge | ✅ Real | `useKnowledgeLibraryStore` with snippet browser, decision log, domain expertise |
| Dashboard | ✅ Real | Reads from `useSystemStore` (GPU/VRAM/tok/s) and `useModelsStore` |
| Error boundaries | ✅ Fixed | `ErrorBoundary` wraps all screens and `MainContent` |

---

## Implementation Sequence (Recommended)

```
Week 1:
  Day 1-2:  Task 1 — HuggingFace Model Browser Panel (P0)
  Day 2:    Task 2 — Mirror Toggle real API call (P0)
  Day 3:    Task 3 — Training real data (P1)
  Day 3:    Task 4 — Remove legacy Federation screen (P1)

Week 2:
  Day 4-5:  Task 5 — Model metadata from Ollama (P2)
  Day 5:    Task 6 — Developer/API docs section (P2)

Week 3:
  Days 6-7: Tasks 7-9 — Categories, download progress, quant selector (P3)
```

---

## Appendix: File Map for HuggingFace Feature (Task 1)

```
apps/desktop/src/renderer/
  screens/
    Models.tsx                          — ADD: tab row, import HuggingFacePanel
  components/
    models/                             — CREATE this directory
      HuggingFacePanel.tsx             — Browse/search/download HF models
      ModelCard.tsx                    — Individual model card in browser
      DownloadProgress.tsx             — Progress bar for active downloads
      StaffPicks.ts                    — Static curated model list (starter data)
  hooks/
    useModelManager.ts                 — ALREADY EXISTS — just wire to Models.tsx
  store/
    modelsStore.ts                     — EXTEND OllamaModel with optional metadata
```

---

_End of gap analysis — 2026-04-19_
