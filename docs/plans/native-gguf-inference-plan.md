# Native GGUF Inference — No Ollama Required

> **Goal**: Enable Sovereign Code to load and run GGUF models directly, without requiring Ollama, LM Studio, or any external inference runtime.

**Status**: Planned  
**Priority**: High  
**Estimated Phases**: 6  

---

## Current State

All inference in Sovereign Code currently routes through **Ollama** at `localhost:11434`. There is **zero** abstraction between the app and Ollama — every component makes direct HTTP calls to Ollama endpoints.

### Ollama API Surface Used

| Endpoint | Method | Used By |
|----------|--------|---------|
| `/api/tags` | GET | Desktop (ollamaClient, useOllamaStatus), VSCode ext, model-manager |
| `/api/pull` | POST | model-manager (download queue) |
| `/api/show` | POST | Desktop Models screen |
| `/api/delete` | DELETE | Desktop Models screen, modelsStore |
| `/api/generate` | POST | VSCode extension (single inference) |
| `/api/chat` | POST | VSCode extension (chat) |
| `/v1/chat/completions` | POST | Desktop Chat screen (streaming) |
| `/api/embeddings` | POST | VSCode extension RAG embedder |

### Files With Ollama Coupling

**Desktop App** (`apps/desktop/src/renderer/`):
- `services/ollamaClient.ts` — HTTP wrapper, hardcoded `http://localhost:11434`
- `screens/Chat.tsx` — Streams via `streamChat()` → `/v1/chat/completions`
- `screens/Models.tsx` — `POST /api/show`, `DELETE /api/delete`
- `screens/Developer.tsx` — Hardcoded `OLLAMA_PORT = 11434`
- `store/modelsStore.ts` — `OllamaModel` interface, `DELETE /api/delete`
- `store/systemStore.ts` — `ollamaOnline` flag, `activeModel`, VRAM metrics
- `hooks/useOllamaStatus.ts` — Polls `/api/tags` every 5s
- `.env.example` — `VITE_OLLAMA_URL`

**VS Code Extension** (`apps/vscode-extension/src/`):
- `ollamaClient.ts` — `/api/generate`, `/api/tags`, `/api/chat`
- `completionProvider.ts` — Config `ollamaUrl`
- `chatViewProvider.ts` — Config `ollamaUrl`
- `extension.ts` — Config + health check
- `rag/embedder.ts` — `POST /api/embeddings`
- `rag/retriever.ts`, `rag/indexer.ts` — Takes `ollamaUrl` parameter
- `statusBar.ts` — "Ollama not reachable" tooltip
- `package.json` — Config keys: `ollamaUrl`, `ollamaModel`, `embeddingModel`

**Backend** (`services/model-manager/`):
- `main.py` — `OLLAMA_MODEL_MAP`, `/api/pull` download, `/api/tags` listing, health check

### Coupling Analysis

| Component | Tightness | Refactor Effort |
|-----------|-----------|----------------|
| model-manager service | Extremely tight | Very high |
| Desktop Chat screen | Extremely tight | High |
| Desktop Models screen | Very tight | High |
| VS Code extension | Tight | High |
| VS Code RAG system | Medium | Low |
| Status monitoring | Tight | Medium |
| Telemetry pipeline | Medium | Low |

---

## Architecture

### Key Insight

The Desktop Chat screen already uses the **OpenAI-compatible** `/v1/chat/completions` endpoint with SSE streaming. The `llama-cpp-python` library exposes the exact same OpenAI-compatible API. This means chat inference can switch backends with minimal frontend changes.

### Target Architecture

```
┌──────────────────────────────────────────────────┐
│                   Frontend                        │
│  (Desktop App / VS Code Extension)                │
│                                                    │
│  InferenceClient  ←── configured by user setting  │
│    ├─ getModels()                                 │
│    ├─ streamChat()                                │
│    ├─ generate()                                  │
│    ├─ getEmbedding()                              │
│    └─ isOnline()                                  │
└────────────────┬─────────────────────────────────┘
                 │ HTTP (OpenAI-compatible)
                 ▼
┌──────────────────────────────────────────────────┐
│        Inference Backend (one of):                │
│                                                    │
│  ┌─────────────┐   ┌──────────────────────────┐  │
│  │   Ollama     │   │  Native GGUF Server      │  │
│  │  :11434      │   │  (llama-cpp-python)      │  │
│  │  (existing)  │   │  :8100                   │  │
│  └─────────────┘   └──────────────────────────┘  │
└──────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│        Model Manager Service :8007                │
│  - GGUF file import (local path or HF download)  │
│  - Model registry (JSON manifest)                │
│  - Download queue (Ollama pull OR direct GGUF)   │
│  - Active model management                        │
└──────────────────────────────────────────────────┘
```

### Why `llama-cpp-python`

- **Pure Python + C++ binding** — no external daemon needed
- **OpenAI-compatible server mode** — `python -m llama_cpp.server` exposes `/v1/chat/completions`, `/v1/completions`, `/v1/embeddings`
- **GGUF native** — loads `.gguf` files directly from disk
- **GPU support** — CUDA, Metal, Vulkan via build flags
- **Lightweight** — single pip install, ~50MB
- **Streaming** — SSE streaming out of the box
- **Embeddings** — Built-in `/v1/embeddings` endpoint

---

## Implementation Plan

### Phase 1: Inference Abstraction Layer (Frontend)

**Goal**: Decouple frontend from Ollama by introducing a backend-agnostic `InferenceClient` interface.

#### 1.1 Desktop App — `InferenceClient` Interface

Create `apps/desktop/src/renderer/services/inferenceClient.ts`:

```typescript
export interface InferenceBackend {
  readonly name: 'ollama' | 'native-gguf'
  readonly baseUrl: string

  getModels(): Promise<ModelInfo[]>
  isOnline(): Promise<boolean>
  streamChat(
    model: string,
    messages: { role: string; content: string }[],
    signal?: AbortSignal
  ): AsyncGenerator<string>
  deleteModel?(modelName: string): Promise<void>
  getModelDetails?(modelName: string): Promise<Record<string, unknown>>
}

export interface ModelInfo {
  name: string
  size: number
  digest: string
  modified_at: string
  source: 'ollama' | 'gguf-local'
  ggufPath?: string
}
```

#### 1.2 Wrap Existing Ollama Client

Refactor `ollamaClient.ts` to implement `InferenceBackend`:

```typescript
export class OllamaBackend implements InferenceBackend {
  readonly name = 'ollama' as const
  readonly baseUrl: string

  constructor(baseUrl = 'http://localhost:11434') {
    this.baseUrl = baseUrl
  }

  // Move existing ollamaClient methods here unchanged
  async getModels() { /* existing /api/tags logic */ }
  async isOnline() { /* existing /api/tags check */ }
  async *streamChat(...) { /* existing /v1/chat/completions logic */ }
  async deleteModel(name: string) { /* existing DELETE /api/delete */ }
  async getModelDetails(name: string) { /* existing POST /api/show */ }
}
```

#### 1.3 Create Native GGUF Backend Stub

```typescript
export class NativeGgufBackend implements InferenceBackend {
  readonly name = 'native-gguf' as const
  readonly baseUrl: string

  constructor(baseUrl = 'http://localhost:8100') {
    this.baseUrl = baseUrl
  }

  // Delegates to the llama-cpp-python server (Phase 2)
  async getModels() { /* GET /v1/models */ }
  async isOnline() { /* GET /health */ }
  async *streamChat(...) { /* POST /v1/chat/completions — same SSE format */ }
}
```

#### 1.4 Backend Selector Store

Add to `systemStore.ts`:

```typescript
inferenceBackend: 'ollama' | 'native-gguf'  // persisted in localStorage
```

#### 1.5 Update Consumers

Replace all direct `ollamaClient` imports with `getActiveBackend()`:

- `screens/Chat.tsx` — Use `backend.streamChat()` instead of `streamChat()`
- `screens/Models.tsx` — Use `backend.getModels()`, `backend.deleteModel()`
- `hooks/useOllamaStatus.ts` → rename to `useInferenceStatus.ts`, use `backend.isOnline()`
- `store/modelsStore.ts` — Use `backend.getModels()`

**Files to modify**: ~8 files  
**Tests to add**: Unit tests for `OllamaBackend`, `NativeGgufBackend`, backend factory  
**Verification**: All existing tests pass. Chat still works with Ollama backend selected.

---

### Phase 2: Native GGUF Inference Server

**Goal**: Build a Python service that loads `.gguf` files and serves OpenAI-compatible inference.

#### 2.1 Create Service Directory

```
services/
  native-inference-service/
    main.py          # FastAPI wrapper around llama-cpp-python
    requirements.txt # llama-cpp-python, fastapi, uvicorn
    config.py        # GGUF model registry, port, GPU settings
    Dockerfile       # Optional containerized deployment
    tests/
      test_main.py
```

#### 2.2 Service Implementation (`main.py`)

```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from llama_cpp import Llama
from llama_cpp.server.app import create_app as create_llama_app
import os, json

app = FastAPI(title="Native GGUF Inference", version="0.1.0")

# CORS for desktop app
app.add_middleware(CORSMiddleware, allow_origins=[
    "http://localhost:3000", "http://localhost:5173", "http://localhost:5175"
], allow_methods=["*"], allow_headers=["*"])

# Model registry (JSON file on disk)
REGISTRY_PATH = os.getenv("GGUF_REGISTRY", "./gguf-registry.json")
MODELS_DIR = os.getenv("GGUF_MODELS_DIR", "./models")

# Active model instance
_active_llm: Llama | None = None
_active_model_name: str | None = None

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "backend": "llama-cpp-python",
        "active_model": _active_model_name,
        "model_loaded": _active_llm is not None,
    }

@app.get("/v1/models")
async def list_models():
    """List all registered GGUF models."""
    registry = _load_registry()
    return {"data": [{"id": m["name"], "object": "model", **m} for m in registry]}

@app.post("/v1/models/load")
async def load_model(request: Request):
    """Load a specific GGUF file into memory."""
    body = await request.json()
    gguf_path = body.get("gguf_path")
    n_ctx = body.get("n_ctx", 4096)
    n_gpu_layers = body.get("n_gpu_layers", -1)  # -1 = all layers on GPU
    # ... validate path, load Llama(model_path=gguf_path, ...), set _active_llm

@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    """OpenAI-compatible chat completions with SSE streaming."""
    # Parse request, call _active_llm.create_chat_completion(stream=True)
    # Return SSE stream in OpenAI format (same as Ollama's /v1/chat/completions)

@app.post("/v1/embeddings")
async def embeddings(request: Request):
    """OpenAI-compatible embeddings endpoint."""
    # Call _active_llm.create_embedding()

@app.post("/v1/models/register")
async def register_model(request: Request):
    """Register a local GGUF file in the model registry."""
    body = await request.json()
    gguf_path = body.get("gguf_path")  # absolute path to .gguf file
    name = body.get("name")            # display name
    # Validate file exists, add to registry JSON
```

#### 2.3 Configuration (`config.py`)

```python
NATIVE_INFERENCE_PORT = int(os.getenv("NATIVE_INFERENCE_PORT", "8100"))
GGUF_MODELS_DIR = os.getenv("GGUF_MODELS_DIR", "./models")
N_CTX = int(os.getenv("N_CTX", "4096"))
N_GPU_LAYERS = int(os.getenv("N_GPU_LAYERS", "-1"))
N_THREADS = int(os.getenv("N_THREADS", "0"))  # 0 = auto
```

#### 2.4 Alternative: Embedded `llama-cpp-python` Server

Instead of writing a custom FastAPI app, we can use the built-in server:

```bash
python -m llama_cpp.server \
  --model ./models/qwen3.5-9b-claude.gguf \
  --host 0.0.0.0 --port 8100 \
  --n_ctx 4096 --n_gpu_layers -1
```

This gives us `/v1/chat/completions`, `/v1/completions`, `/v1/embeddings` for free. Our custom FastAPI wrapper adds model management (registry, load/unload, list) on top.

**Tests to add**: Health endpoint, model registration, chat completions (mocked), embeddings (mocked)  
**Verification**: Service starts, `/health` returns OK, `/v1/models` lists registered models.

---

### Phase 3: Model Manager Integration

**Goal**: Extend model-manager to support direct GGUF file imports alongside Ollama pulls.

#### 3.1 Add GGUF Import Endpoint

In `services/model-manager/main.py`:

```python
@app.post("/api/v1/models/import-gguf")
async def import_gguf(request: Request):
    """Register a local GGUF file for native inference (no Ollama needed)."""
    body = await request.json()
    gguf_path = body.get("gguf_path")  # e.g. "D:/models/qwen3.5-9b.gguf"
    display_name = body.get("name")
    # 1. Validate file exists and is a valid GGUF
    # 2. Register with native-inference-service
    # 3. Add to local model list
```

#### 3.2 Add GGUF Download from HuggingFace

```python
@app.post("/api/v1/models/{model_id:path}/download-gguf")
async def download_gguf(request: Request, model_id: str, filename: str = ""):
    """Download a specific GGUF file from HuggingFace directly (no Ollama)."""
    # 1. Resolve HF URL: {HF_ENDPOINT}/{model_id}/resolve/main/{filename}
    # 2. Stream download with progress tracking (reuse download_queue)
    # 3. On completion, register with native-inference-service
```

#### 3.3 Update `/api/v1/models` Listing

Merge models from both sources:
- Ollama-managed models (existing)
- GGUF-registered models (new — from native-inference-service registry)

#### 3.4 Backend Selection State

```python
# New endpoint
@app.get("/api/v1/inference/backends")
async def list_backends():
    """List available inference backends and their status."""
    ollama_online = _check_ollama()
    native_online = _check_native_service()
    return {
        "backends": [
            {"name": "ollama", "url": OLLAMA_BASE, "online": ollama_online},
            {"name": "native-gguf", "url": NATIVE_INFERENCE_URL, "online": native_online},
        ],
        "active": current_backend,
    }
```

**Files to modify**: `services/model-manager/main.py`  
**Tests to add**: GGUF import endpoint, GGUF download endpoint, merged model listing  
**Verification**: Import a local `.gguf` file, see it in model list.

---

### Phase 4: Desktop App UI Updates

**Goal**: Add UI for backend selection and GGUF file import.

#### 4.1 Settings Screen — Backend Selector

Add a "Backend" section to Settings:

```
┌─ Inference Backend ──────────────────────────┐
│  ○ Ollama (localhost:11434)       [Online ✓] │
│  ● Native GGUF (localhost:8100)   [Online ✓] │
│                                               │
│  [Start Native Server]  [Stop Native Server]  │
└───────────────────────────────────────────────┘
```

#### 4.2 Models Screen — Import GGUF Button

Add "Import GGUF" button alongside existing model management:

```
┌─ Models ─────────────────────────────────────┐
│  [Download from Hub]  [Import Local GGUF]     │
│                                               │
│  Installed Models:                            │
│  ├─ llama3.1:8b          (Ollama)   [Delete] │
│  ├─ qwen3.5-9b-claude    (GGUF)    [Delete] │
│  └─ mistral-7b           (Ollama)   [Delete] │
└───────────────────────────────────────────────┘
```

The "Import Local GGUF" button uses Electron's `dialog.showOpenDialog` to browse for `.gguf` files, then calls the model-manager's `/api/v1/models/import-gguf` endpoint.

#### 4.3 System Store Updates

```typescript
// systemStore.ts additions
inferenceBackend: 'ollama' | 'native-gguf'
nativeServerOnline: boolean
nativeServerUrl: string
```

#### 4.4 Status Bar Update

Replace "Ollama: Online" with "Backend: Native GGUF ✓" or "Backend: Ollama ✓" based on active selection.

**Files to modify**: Models screen, Settings/Developer screen, systemStore, useInferenceStatus hook  
**Tests to add**: Backend selector component, GGUF import flow  
**Verification**: Can select native backend, import a `.gguf` file, see it listed.

---

### Phase 5: VS Code Extension Updates

**Goal**: Add native GGUF backend support to the VS Code extension.

#### 5.1 Extension InferenceClient

Refactor `apps/vscode-extension/src/ollamaClient.ts` into an `InferenceClient` interface (same pattern as desktop):

```typescript
interface InferenceClient {
  generate(model: string, prompt: string): Promise<string>
  chat(model: string, messages: Message[]): Promise<string>
  listModels(): Promise<string[]>
  getEmbeddings(model: string, text: string): Promise<number[]>
  isOnline(): Promise<boolean>
}
```

With `OllamaClient implements InferenceClient` and `NativeGgufClient implements InferenceClient`.

#### 5.2 Configuration Update

In `package.json`, add settings:

```json
"sovereignCode.inferenceBackend": {
  "type": "string",
  "enum": ["ollama", "native-gguf"],
  "default": "ollama"
},
"sovereignCode.nativeGgufUrl": {
  "type": "string",
  "default": "http://localhost:8100"
}
```

#### 5.3 RAG Embeddings

Update `rag/embedder.ts` to use `/v1/embeddings` (OpenAI-compatible) from whichever backend is active. Both Ollama and `llama-cpp-python` support this endpoint.

#### 5.4 Status Bar

Update `statusBar.ts` to show active backend name instead of just "Ollama".

**Files to modify**: ~10 files in `apps/vscode-extension/src/`  
**Tests to add**: Inference client factory, native GGUF client stub  
**Verification**: Extension connects to native GGUF backend, completions work.

---

### Phase 6: Process Management & Startup

**Goal**: Let the desktop app auto-start the native inference server.

#### 6.1 Server Lifecycle Manager

Add `apps/desktop/src/main/nativeInferenceManager.ts`:

```typescript
// Spawn/manage the llama-cpp-python server as a child process
// - Auto-start on app launch if native backend is selected
// - Health check polling
// - Graceful shutdown on app quit
// - Log capture for debugging
```

This uses Node's `child_process.spawn` to run:
```
python -m llama_cpp.server --model <path> --port 8100 --n_gpu_layers -1
```

#### 6.2 First-Run Setup

When user selects "Native GGUF" backend for the first time:
1. Check `python` is available
2. Check `llama-cpp-python` is installed (run `python -c "import llama_cpp"`)
3. If not, offer to install: `pip install llama-cpp-python`
4. For GPU: `pip install llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cu124` (CUDA) or build with Metal

#### 6.3 Docker Compose Update

Add native-inference-service to `docker-compose.yml`:

```yaml
native-inference:
  build: ./services/native-inference-service
  ports:
    - "8100:8100"
  volumes:
    - ./models:/models
  environment:
    - N_GPU_LAYERS=-1
    - N_CTX=4096
```

**Files to modify**: `main/index.ts` (or new manager file), `docker-compose.yml`  
**Tests to add**: Server lifecycle tests (start, stop, health check)  
**Verification**: Desktop app starts native server automatically. Killing app stops server.

---

## Verification Checklist

### Phase 1 Complete When:
- [ ] `InferenceBackend` interface exists with full typing
- [ ] `OllamaBackend` wraps existing logic, all existing tests pass
- [ ] `NativeGgufBackend` stub exists
- [ ] Backend selector in store, persisted to localStorage
- [ ] Chat, Models screens use interface instead of direct Ollama calls
- [ ] All 1092 existing tests still pass

### Phase 2 Complete When:
- [ ] `services/native-inference-service/` exists with FastAPI app
- [ ] `/health`, `/v1/models`, `/v1/chat/completions` endpoints work
- [ ] Can load a `.gguf` file and get streaming chat responses
- [ ] `/v1/embeddings` returns vectors
- [ ] Service tests pass

### Phase 3 Complete When:
- [ ] `/api/v1/models/import-gguf` endpoint works
- [ ] `/api/v1/models` merges Ollama + GGUF models
- [ ] `/api/v1/inference/backends` lists available backends
- [ ] Model manager tests pass

### Phase 4 Complete When:
- [ ] Backend selector visible in Desktop UI
- [ ] "Import GGUF" button opens file dialog, imports model
- [ ] Model list shows source (Ollama vs GGUF)
- [ ] Chat works with native GGUF backend selected

### Phase 5 Complete When:
- [ ] VS Code extension supports backend selection
- [ ] Completions work with native backend
- [ ] RAG embeddings work with native backend
- [ ] Extension tests pass

### Phase 6 Complete When:
- [ ] Desktop auto-starts native server when backend is selected
- [ ] Server stops cleanly on app quit
- [ ] First-run setup detects/installs llama-cpp-python
- [ ] Docker compose includes native service

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| `llama-cpp-python` GPU build complexity | Provide pre-built wheel URLs for CUDA/Metal. Fall back to CPU. |
| Large model memory usage | Expose `n_gpu_layers` slider in UI. Show VRAM usage. |
| Python not installed on user's machine | Bundle Python via PyInstaller or offer install guidance. Phase 6 handles detection. |
| Breaking existing Ollama workflow | Ollama remains the default. Native GGUF is opt-in. All existing tests must pass. |
| Slow model loading | Show loading spinner with progress. Cache loaded model across requests. |

---

## Dependencies

- **`llama-cpp-python`** >= 0.3.0 — Core inference engine
- **`fastapi`** + **`uvicorn`** — Already used by model-manager
- **Electron `dialog` API** — For GGUF file browsing (already available)
- **`child_process`** — For server lifecycle management (Node.js built-in)

---

## Suggested Sprint Breakdown

| Sprint | Phases | Duration Estimate |
|--------|--------|-----------------|
| Sprint A | Phase 1 (abstraction layer) | ~2 days |
| Sprint B | Phase 2 (native server) + Phase 3 (model-manager) | ~3 days |
| Sprint C | Phase 4 (desktop UI) + Phase 5 (vscode ext) | ~3 days |
| Sprint D | Phase 6 (process management) + integration testing | ~2 days |

**Total**: ~10 working days for full implementation.
