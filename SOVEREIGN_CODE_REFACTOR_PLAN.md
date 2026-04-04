# Sovereign Code - Refactor Plan
**Goal**: Replace Ollama/LMStudio dependency with standalone Huggingface-based model management

---

## Phase 1: Rename Project (Sovereign Code → Sovereign Code)

### 1.1 Project Configuration Files
- [ ] `package.json` - name, description
- [ ] `package-lock.json` - regenerate
- [ ] `apps/desktop/package.json` - name
- [ ] `apps/desktop/electron-builder.json` - productName, appId
- [ ] `README.md` - all references
- [ ] `.env.example` - model provider configs

### 1.2 Source Code References
- [ ] All TSX/TS files - component names, comments
- [ ] Store names and references
- [ ] Screen titles and labels
- [ ] Documentation strings

### 1.3 Documentation
- [ ] `GETTING_STARTED.md`
- [ ] `INDEX.md`
- [ ] `docs/plans/` all files
- [ ] `RELEASE_NOTES_v1.0.0.md`

---

## Phase 2: Huggingface Integration Architecture

### 2.1 Backend Services

**New Service**: `services/model-manager/` (Python FastAPI)
```
model-manager/
  ├── main.py                    # FastAPI server (port 8002)
  ├── requirements.txt
  ├── config.py                  # HF token, cache paths
  ├── hf_client.py              # Huggingface API wrapper
  ├── model_manager.py          # Download, list, cache management
  ├── model_loader.py           # Load & run models locally
  └── routes/
      ├── models.py             # GET /models, POST /models/download
      ├── inference.py          # POST /inference (streaming)
      └── training.py           # POST /training/start, /training/status
```

**Dependencies**:
- `transformers` - HF model loading
- `torch` - inference engine
- `accelerate` - distributed/GPU support
- `bitsandbytes` - quantization
- `peft` - LoRA training
- `datasets` - dataset loading

### 2.2 Frontend Changes

**New Store**: `modelManagerStore.ts`
```typescript
type ModelInfo = {
  id: string              // huggingface_model_id
  name: string            // Display name
  size: number           // In bytes
  quantization: string   // fp32, int8, int4
  cached: boolean        // Is downloaded locally
  downloading: boolean
  downloadProgress: number
}

type ModelManagerStore = {
  models: ModelInfo[]
  activeModel: ModelInfo | null
  downloadQueue: string[]
  
  // Actions
  listModels: () => Promise<void>
  downloadModel: (modelId: string) => Promise<void>
  deleteModel: (modelId: string) => Promise<void>
  setActive: (modelId: string) => Promise<void>
  search: (query: string) => Promise<ModelInfo[]>
}
```

**New Components**:
- `ModelBrowser.tsx` - Search Huggingface
- `ModelDownloader.tsx` - Download progress UI
- `ModelCache.tsx` - Local cache management
- `QuantizationSelector.tsx` - Choose model variant

---

## Phase 3: Implementation Tasks

### 3.1 Backend Development
- [ ] Set up `services/model-manager/` with FastAPI
- [ ] Implement Huggingface API client
- [ ] Model download & caching system
- [ ] Local model inference engine (transformers)
- [ ] Streaming inference (SSE)
- [ ] Training loop (fine-tuning via PEFT)
- [ ] Error handling & retry logic

### 3.2 Frontend Development
- [ ] Create `modelManagerStore.ts` (Zustand)
- [ ] Create `useModelManager.ts` hook
- [ ] Update `ollamaClient.ts` → `modelClient.ts`
- [ ] New UI components for model search/management
- [ ] Update Chat screen to use new model API
- [ ] Update Models screen with caching controls
- [ ] Add Training screen integration

### 3.3 Configuration
- [ ] Add `.env` variables
  - `HF_TOKEN` (Huggingface API token)
  - `MODEL_CACHE_PATH` (local storage)
  - `MAX_CACHE_GB` (quota)
  - `DEVICE` (cpu/cuda/mps)
- [ ] Model registry (popular models)
- [ ] Default quantization profiles

### 3.4 Testing
- [ ] Unit tests for model manager
- [ ] Integration tests with HF API mock
- [ ] Download/cache tests
- [ ] Inference tests
- [ ] Training tests

---

## Phase 4: User Experience

### 4.1 Models Screen UX
```
┌─────────────────────────────┐
│ Search Huggingface          │  [Download] [Browse]
│ [advanced filters]          │
├─────────────────────────────┤
│ DOWNLOADED:                 │
│ ✓ meta-llama/Llama-2-7b    │ [Use] [Delete]
│ ✓ mistralai/Mistral-7B     │ [Use] [Delete]
│                             │
│ AVAILABLE TO DOWNLOAD:      │
│ ○ NousResearch/Nous-Hermes │ [Download] [i]
│ ○ TheBloke/neural-chat-7B  │ [Download] [i]
└─────────────────────────────┘
```

### 4.2 Download Management
- Progress bar with speed/ETA
- Pause/resume capability
- Multiple concurrent downloads
- Integrity verification

### 4.3 Training Integration
- Fine-tune on downloaded models
- LoRA rank/alpha selection
- Dataset loading (CSV/JSON)
- Training progress tracking
- Model save/export

---

## Phase 5: Migration Path

### 5.1 Backward Compatibility
- [ ] Keep Ollama detection (optional fallback)
- [ ] Support both modes initially
- [ ] Configuration option to choose provider

### 5.2 Deprecation
- [ ] Mark Ollama integration as "legacy"
- [ ] Document migration path
- [ ] Plan removal timeline

---

## Estimated Effort

| Phase | Effort | Days |
|-------|--------|------|
| Phase 1 (Rename) | 2-3h | 0.5 |
| Phase 2 (Architecture) | 6-8h | 1 |
| Phase 3 (Development) | 40-60h | 5-7 |
| Phase 4 (UX Refinement) | 8-10h | 1 |
| Phase 5 (Migration) | 4-6h | 0.5 |
| **Total** | **60-90h** | **8-10 days** |

---

## Dependencies to Add

```json
{
  "backend": {
    "transformers": "^4.36.0",
    "torch": "^2.1.0",
    "accelerate": "^0.24.0",
    "peft": "^0.7.0",
    "datasets": "^2.14.0",
    "bitsandbytes": "^0.41.0",
    "huggingface-hub": "^0.17.0",
    "tqdm": "^4.66.0"
  },
  "frontend": {
    "zustand": "^4.5.0"
  }
}
```

---

## Success Criteria

✅ Project renamed to "Sovereign Code"  
✅ Can download models from Huggingface  
✅ Can manage multiple models locally  
✅ Can run inference without Ollama  
✅ Can fine-tune models  
✅ UI supports search, download, cache management  
✅ All 314+ tests passing  
✅ Windows EXE still works standalone  
✅ Documentation updated  
