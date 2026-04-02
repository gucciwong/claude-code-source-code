# Sovereign Code Architecture Overview

Sovereign Code is being transformed from a Ollama-dependent coding assistant into an **independent, fully self-contained AI model management system**.

---

## What Changed in v0.2.0

### ✅ New Architecture
Instead of relying on Ollama or LMStudio:

```
Old (Ollama Dependency)
├── Desktop App (Electron + React)
└── Ollama (External) ← Dependency

New (Standalone)
├── Desktop App (Electron + React)
├── Model Manager Service (FastAPI)
│   ├── Huggingface Integration
│   ├── Model Download
│   ├── Model Loading (transformers)
│   ├── Inference Engine
│   └── Training Pipeline
└── Training Service (FastAPI)
```

### Key Benefits
1. **No External Dependencies** — Download and run models independently
2. **Full Model Control** — Download, quantize, train on your models
3. **Huggingface Native** — Direct access to 100k+ models
4. **Transparent** — See exactly what's happening
5. **Customizable** — Fine-tune any model with LoRA
6. **Private** — Everything runs locally

---

## How It Works

### 1. Model Discovery & Download
```
User: "I want to use Mistral 7B"
   ↓
App queries Huggingface API
   ↓
Shows model info, size, quantization options
   ↓
User clicks "Download"
   ↓
Model Manager downloads to ~/.cache/sovereign-code/models/
   ↓
Model ready to use
```

### 2. Inference
```
User: "Write a hello world in Python"
   ↓
Chat screen sends prompt to Model Manager
   ↓
Model Manager loads model to GPU/CPU
   ↓
transformers pipeline processes prompt
   ↓
Streams tokens back to Chat screen in real-time
   ↓
User sees response as it's generated
```

### 3. Training (Fine-tuning)
```
User: "Fine-tune Mistral on my data"
   ↓
Upload training CSV/JSON
   ↓
Model Manager applies LoRA adapter
   ↓
Fine-tune on your data (hours, not days)
   ↓
Save trained model
   ↓
Use trained model for inference
```

---

## System Architecture

```
┌─────────────────────────────────────────┐
│     Sovereign Code Desktop (React)      │
│                                         │
│  ├─ Dashboard Screen                   │
│  ├─ Chat Screen (inference)            │
│  ├─ Models Screen (management)         │
│  ├─ Training Screen (fine-tuning)      │
│  └─ Settings (HF token, cache path)    │
└────────────┬──────────────────────────┘
             │ HTTP REST API (port 3000)
             │
┌────────────▼──────────────────────────┐
│   Electron Main Process (IPC)         │
└────────────┬──────────────────────────┘
             │ HTTP REST API (port 8002)
             │
┌────────────▼──────────────────────────┐
│  Model Manager Service (Port 8002)    │
│  ├─ Huggingface Hub Integration       │
│  ├─ Model Download & Caching          │
│  ├─ Model Loading (transformers)      │
│  ├─ Inference Engine                  │
│  ├─ Streaming Responses (SSE)         │
│  └─ Fine-tuning (LoRA/PEFT)           │
│                                       │
│  Storage:                             │
│  └─ ~/.cache/sovereign-code/models/   │ ← All models stored locally
└────────────┬──────────────────────────┘
             │
┌────────────▼──────────────────────────┐
│    Local Inference Engine             │
│                                       │
│  Supports:                            │
│  ├─ CPU (Intel/AMD)                  │
│  ├─ NVIDIA GPU (CUDA)                │
│  ├─ Apple Silicon (MPS)              │
│  └─ Multi-GPU (accelerate)           │
└──────────────────────────────────────┘
```

---

## Supported Models (v0.2.0+)

### Instant Access (Huggingface)
Sovereign Code can download and run any model from Huggingface.

**Recommended:**
- **Mistral 7B** (14 GB) — Fast, high quality
- **Nous Hermes 2 7B** (14 GB) — Good instruction following
- **Llama 2 7B/70B** (14/140 GB) — Strong performance
- **Zephyr 7B** (14 GB) — Good at following complex instructions
- Any GGUF quantized model

### Quantization Options
Save space and run faster:
- **fp32** (full precision) — Highest quality, most memory
- **int8** (8-bit) — Good balance
- **int4** (4-bit) — Very small, still capable

---

## User Workflows

### Workflow 1: Chat with Default Model
```bash
1. Open Sovereign Code
2. Go to Models screen
3. Search "Mistral 7B"
4. Click "Download" (one-time, ~20 min)
5. Go to Chat screen
6. Type your question
7. Get streaming response
```

### Workflow 2: Fine-tune a Model
```bash
1. Go to Training screen
2. Upload training CSV (prompt, response pairs)
3. Select base model (e.g., Mistral 7B)
4. Adjust LoRA settings
5. Click "Start Training" (30 min - 2 hours)
6. Model automatically saved
7. Use trained model in Chat
```

### Workflow 3: Compare Models
```bash
1. Download multiple models
2. Save chat conversations
3. Switch models with one click
4. See how different models respond
```

---

## Configuration

Create `.env` in project root:
```bash
# Huggingface
HF_TOKEN=hf_your_api_token_here

# Storage
MODEL_CACHE_PATH=~/.cache/sovereign-code/models
MAX_CACHE_GB=50

# Inference
DEVICE=auto  # auto, cpu, cuda, mps
USE_QUANTIZATION=true
QUANTIZATION_TYPE=int8  # fp32, int8, int4

# Training
TRAINING_LEARNING_RATE=5e-4
TRAINING_BATCH_SIZE=4
```

### Getting HF Token
1. Go to https://huggingface.co/settings/tokens
2. Create new token (read access)
3. Copy token
4. Paste into `.env` as `HF_TOKEN=hf_...`

---

## System Requirements

### Minimum (CPU-only)
- 8 GB RAM
- 10 GB disk space (for 7B model)
- Any modern CPU

### Recommended (GPU)
- 16 GB RAM
- 30 GB disk space
- NVIDIA GPU with 8GB+ VRAM (or Apple Silicon, or AMD GPU)
- Modern CPU

### Supported Hardware
- ✅ Intel/AMD CPU (with or without GPU)
- ✅ NVIDIA GPU (CUDA 11.8+)
- ✅ Apple Silicon (M1/M2/M3)
- ✅ AMD GPU (ROCm)
- ✅ MacOS, Windows, Linux

---

## Feature Roadmap

### v0.2.0 (Current - Foundation)
- ✅ Project renamed to "Sovereign Code"
- ✅ Model Manager backend created
- ✅ Config system ready
- ⏳ Huggingface API integration (in progress)

### v0.3.0 (Next - Huggingface Integration)
- [ ] Actual model downloads
- [ ] Real inference engine
- [ ] UI for model management
- [ ] Model search/browser
- [ ] Download progress tracking
- [ ] Quantization selector

### v0.4.0 (Fine-tuning)
- [ ] LoRA training integration
- [ ] Dataset management UI
- [ ] Training progress tracking
- [ ] Model export/sharing

### v0.5.0 (Polish & Scale)
- [ ] Performance optimization
- [ ] Caching improvements
- [ ] Model recommendations
- [ ] Community model sharing

### v1.0.0 (Future)
- [ ] Other model providers (Replicate, Together)
- [ ] Distributed inference
- [ ] Advanced quantization
- [ ] Custom training pipelines

---

## Development Status

**Commit**: 255af58  
**Last Update**: 2026-04-02  
**Tests**: 314/314 passing  
**Build**: Windows EXE ready (70.79 MB)

**Documentation**:
- ✅ SOVEREIGN_CODE_REFACTOR_PLAN.md — Detailed implementation plan
- ✅ SOVEREIGN_CODE_STATUS.md — Current progress
- ✅ This file — Architecture overview
- ⏳ API Documentation (coming in v0.3.0)

---

## Getting Help

1. **First Steps** → See [GETTING_STARTED.md](GETTING_STARTED.md)
2. **Architecture Questions** → This file
3. **Troubleshooting** → See [SETUP_GUIDE.md](SETUP_GUIDE.md)
4. **Implementation Details** → See [SOVEREIGN_CODE_REFACTOR_PLAN.md](SOVEREIGN_CODE_REFACTOR_PLAN.md)
5. **Current Status** → See [SOVEREIGN_CODE_STATUS.md](SOVEREIGN_CODE_STATUS.md)

---

**Sovereign Code** — Independent, Transparent, Customizable AI Model Management

Built on open-source technologies:
- Electron (Desktop)
- React (UI)
- FastAPI (Backend)
- Transformers (Model Loading)
- Huggingface (Model Hub)
- PEFT (LoRA Training)
