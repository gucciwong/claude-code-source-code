# Live Integration Testing Guide

## Overview

This guide documents how to perform end-to-end (E2E) testing of the Sovereign Coder platform by starting all services and verifying they work together. This is the final verification step before production deployment.

## Architecture Overview

The platform consists of three integrated components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Desktop App                       │
│                   (apps/desktop/)                             │
│  React UI + TypeScript + Tailwind                             │
│  Port: 9080 (dev), 9081 (production)                          │
└───┬──────────────────────────────────────────────────────┬───┘
    │                                                      │
    │            HTTP Requests                            │
    │                                                      │
┌───▼──────────────────┐                    ┌──────────────▼──┐
│   Training Service   │                    │  Voice Service  │
│ (services/          │                    │ (services/      │
│  training-service/) │                    │  voice-service/)│
│                      │                    │                 │
│  FastAPI            │                    │ FastAPI         │
│  Port: 8001         │                    │ Port: 8000      │
│                      │                    │                 │
│  - Whisper ASR      │                    │ - TTS synthesis │
│  - Event logging    │                    │ - Audio process │
│  - Stats tracking   │                    │ - Audio capture │
└────────┬─────────────┘                    └────────┬────────┘
         │                                           │
         │         REST APIs + Webhooks              │
         │                                           │
         └────────── ports 8000 & 8001 ──────────────┘
                        (HTTP)
                        
Ollama (Local LLM)
Port: 11434
- Downloaded models from ollama.ai
- No integration needed; used by chat service
```

## Prerequisites

Before starting integration testing, ensure:

### System Requirements
- ✅ Node.js >= 18 (for desktop app)
- ✅ Python >= 3.10 (for backend services)
- ✅ 8GB RAM (minimum, 16GB recommended)
- ✅ Git
- ✅ Ollama installed and configured (https://ollama.ai)

### Project Structure
```
sovereign-coder/
├── apps/
│   └── desktop/                 ← React + Electron app
│       ├── src/
│       ├── package.json
│       └── npm scripts
├── services/
│   ├── training-service/        ← FastAPI training backend
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   └── training/
│   └── voice-service/           ← FastAPI voice backend
│       ├── main.py
│       ├── requirements.txt
│       └── voice_service/
├── SETUP_GUIDE.md              ← Installation instructions
└── LIVE_INTEGRATION_TESTING_GUIDE.md  ← This file
```

## Setup Phase

### Step 1: Verify Environment

```powershell
# Check Node.js
node --version    # Should be >= 18.x.x

# Check Python
python --version  # Should be >= 3.10.x

# Check Ollama (must be installed first)
ollama --version  # Should show "ollama version X.X.X"

# Optional: Verify git
git --version
git status                # Should show clean working directory
```

### Step 2: Install Python Dependencies

Both backend services use Python. Install dependencies in each:

```powershell
# Training Service
cd services/training-service
python -m venv venv                    # Create virtual environment
.\venv\Scripts\Activate.ps1            # Activate on Windows
pip install -r requirements.txt         # Install dependencies

# Voice Service
cd ../voice-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Troubleshooting:**
- If `venv` creation fails: `python -m venv --upgrade-embed-wheels venv`
- If pip is slow: Add `--retries 5` flag
- For offline installation: See each service's QUICKSTART.md

### Step 3: Install Node Dependencies

```powershell
# Desktop App
cd apps/desktop
npm install         # Install all React + Electron dependencies

# Verify installation
npm list | head -20  # Show dependency tree (first 20 lines)
```

**Expected packages:**
- `electron@30.x.x`
- `react@18.x.x`
- `zustand@4.x.x`
- `@radix-ui/react*` (multiple entries)

## Startup Phase

### Terminal 1: Ollama Local LLM Server

```powershell
# Start Ollama on port 11434
ollama serve

# Expected output:
# Listening on 127.0.0.1:11434
```

**To download a model (if not already done):**
```powershell
# In another terminal
ollama pull llama2           # Downloads Llama 2 7B model
ollama pull mistral          # Or: Mistral 7B
ollama pull neural-chat      # Or: NeuralChat
```

**Verification:**
```powershell
# In another terminal, once serve is running
curl http://localhost:11434/api/tags

# Should show JSON with list of downloaded models
```

### Terminal 2: Training Service

```powershell
cd services/training-service
.\venv\Scripts\Activate.ps1              # Activate venv

# Option A: Development mode (with auto-reload)
python -m uvicorn main:app --reload --port 8001 --host 127.0.0.1

# Option B: Production mode
python -m uvicorn main:app --port 8001 --host 127.0.0.1 --workers 2

# Expected output:
# Uvicorn running on http://127.0.0.1:8001 (Press CTRL+C to quit)
```

**Verification** (in new terminal):
```powershell
curl http://localhost:8001/health

# Should respond with JSON:
# {"status":"ok","version":"0.1.0","asr_loaded":true,"tts_loaded":false}
```

**If port 8001 is already in use:**
```powershell
# Find what's using port 8001
Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue | 
  Select-Object OwningProcess | 
  ForEach-Object { Get-Process -Id $_.OwningProcess }

# Kill the process (if safe)
Stop-Process -Name python -Force

# Or use a different port
python -m uvicorn main:app --reload --port 8002 --host 127.0.0.1
# Then update VITE_TRAINING_SERVICE_URL in apps/desktop/.env
```

### Terminal 3: Voice Service (Optional)

The voice service is optional. It enables speech-to-text and text-to-speech capabilities.

```powershell
cd services/voice-service
.\venv\Scripts\Activate.ps1

# Development mode
python -m uvicorn main:app --reload --port 8000 --host 127.0.0.1

# Expected output:
# Uvicorn running on http://127.0.0.1:8000
```

**Verification:**
```powershell
curl http://localhost:8000/health

# Should respond with:
# {"status":"ok","models_loaded":true}
```

### Terminal 4: Desktop App

```powershell
cd apps/desktop

# Verify .env configuration
cat .env          # Should show VITE_TRAINING_SERVICE_URL=http://localhost:8001

# Start development server (with MCP enabled)
npm run dev

# Expected output:
# ✓ ready in XXXms
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

**First-time setup:**
- Electron will start and show empty window after ~5 seconds
- Check browser dev tools for errors: Press F12
- Look for "Failed to fetch" errors which indicate service connectivity issues

## Verification Phase

### 1. Dashboard Health Check

**In the desktop app (http://localhost:5173):**

1. Wait for main window to fully load (should see dark theme UI)
2. Check the **Status Bar** at the bottom:
   ```
   [Lock] Running Locally | Model: None | GPU: Detecting... | ...
   ```
3. Verify status indicators:
   - ✅ "Running Locally" badge visible
   - ✅ Model selector shows available
   - ✅ GPU/VRAM info appears (once Ollama model loads)

**Expected UI elements:**
- Sidebar with navigation (Dashboard, Chat, Models, Training, Voice, Settings)
- Main dashboard with "Active Model" hero section
- Status bar with system health info
- Command Palette icon (⌘K)

### 2. Model Integration Test

1. Go to **Models** screen
2. You should see a list of models:
   - ✅ Local available models (from `ollama pull`)
   - ✅ Model size and parameters shown
   - Status indicator next to each model
3. **Select a model:**
   - Click any model name
   - Desktop app calls Ollama to load it
   - Wait for "Loading..." indicator
   - Once loaded, should see in status bar: `Model: llama2` (or selected model)

**If models don't appear:**
```powershell
# Verify Ollama is running
curl http://localhost:11434/api/tags

# If empty, download a model
ollama pull mistral
```

### 3. Chat Integration Test

1. Go to **Chat** screen
2. Type a test message: `"Hello! What is 2 + 2?"`
3. Press Enter
4. Wait for response (should take 5-10 seconds for first token)

**Behind the scenes:**
- ✅ Message sent to Ollama on port 11434
- ✅ Ollama generates response using active model
- ✅ Response streamed back and displayed in real-time
- ✅ After response completes, Training event logged to port 8001 (async, non-blocking)

**Expected behavior:**
- Response appears word-by-word as it's generated
- Chat message shows user message + AI response
- No errors in browser console (F12 → Console tab)

**If Ollama connection fails:**
```powershell
# Verify Ollama is running
curl http://localhost:11434/api/generate -Method POST `
  -Body '{"model":"mistral","prompt":"test","stream":false}' `
  -ContentType 'application/json' | ConvertFrom-Json
```

### 4. Training Service Integration Test

1. Go to **Training** screen
2. Look for **Data Collection** section showing stats:
   - "847 completion pairs"
   - "12 trajectories"
   - "203 corrections"
3. These are mock/demo values; after sending chat messages, the event count should increment

**Verify in browser console (F12 → Console):**

After sending a chat message, should see something like:
```
[Training] Service available: true
[Training] Logged completion: { event_id: "abc123...", timestamp: 2026-04-02T... }
```

Or if service is unavailable:
```
[Training] Service unavailable (skipping training logging)
```

**To verify service received the event:**

```powershell
# Check training stats via API
curl http://localhost:8001/api/v1/training/stats | ConvertFrom-Json | Select-Object total_events, completion_accepted

# Should show incrementing numbers after each chat message
```

### 5. Voice Integration Test (Optional)

If voice service is running on port 8000:

1. Go to **Voice** screen (if available)
2. **Transcription test:**
   - Click microphone icon
   - Speak: "Hello, this is a test"
   - Release mic button
   - Should see transcribed text appear
3. **Text-to-speech test:**
   - Type or select text
   - Click speaker icon
   - Should hear audio playback

**If voice features don't appear:**
- Voice service may not be running (port 8000)
- Check browser console for "Failed to fetch" errors
- Voice is optional; app works without it

### 6. System Health Indicators

In status bar, verify these appear correctly:

```
[Lock] Running Locally   <- Always visible
| Model: mistral        <- Model name (clickable)
| GPU: 18.2/24 GB       <- VRAM usage (if GPU available)
| 72°C                  <- GPU temperature
| 45 tok/s              <- Throughput (appears during response)
```

**If GPU info doesn't show:**
- GPU not available (system has no NVIDIA GPU)
- This is OK; app still works with CPU
- Lookfor CPU temperature or utilization info instead

## Troubleshooting

### Issue: Desktop app loads but shows blank window

**Checklist:**
1. Check browser console (F12):
   - Any JavaScript errors?
   - Any "Failed to fetch" warnings?
2. Verify services are running:
   ```powershell
   curl http://localhost:8001/health  # Training service
   curl http://localhost:8000/health  # Voice service
   curl http://localhost:11434/api/tags  # Ollama
   ```
3. Check Electron process output (Terminal 4):
   - Any error messages?
   - Should see "ready in XXms"

**Solution:** Restart desktop app with `npm run dev` after confirming services are running.

### Issue: Chat doesn't respond

**Checklist:**
1. Is Ollama running on port 11434?
2. Does the selected model exist? (Go to Models screen)
3. Check browser console for errors
4. Try a simpler prompt: "hi" or "1+1"

**Solution:**
```powershell
# Verify Ollama and model
curl http://localhost:11434/api/tags | ConvertFrom-Json
curl http://localhost:11434/api/generate -Method POST `
  -Body '{"model":"mistral","prompt":"test","stream":false}' `
  -ContentType 'application/json'
```

### Issue: Training service returns error

**Common errors:**
```
ModuleNotFoundError: No module named 'fastapi'
→ Run: pip install -r requirements.txt

ConnectionError: [Errno 111] Connection refused
→ Training service not running or wrong port

CORS error in browser console
→ Verify VITE_TRAINING_SERVICE_URL in .env matches service port
```

**Solution:**
1. Activate virtual environment: `.\venv\Scripts\Activate.ps1`
2. Reinstall dependencies: `pip install -r requirements.txt`
3. Restart service with correct port: `python -m uvicorn main:app --port 8001`

### Issue: Port conflicts

```powershell
# Find what's using a port
Get-NetTCPConnection -LocalPort <PORT> | Select-Object OwningProcess, State

# If it's a Python service you started, press Ctrl+C in that terminal
# If it's something else, either:
#   - Change the port in the service startup command
#   - Update the .env file in apps/desktop/
#   - Or: Stop-Process -Id <PID> -Force
```

### Issue: Python venv activation fails

**On Windows with execution policy:**
```powershell
# If you get "cannot be loaded because running scripts is disabled"
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\venv\Scripts\Activate.ps1

# Or use: python -m venv venv (creates new venv)
```

## Performance Benchmarking

Once all services are running, measure performance:

### Latency Metrics

```powershell
# Time to first token (TFT) in chat response
# Manually: Send message and time response start

# Time for full response completion
# Manually note: Message sent → First token → Last token

# Expected times (on mid-range GPU):
# TFT: 500-2000ms
# Full response (10 tokens): 1-5s
# Full response (50 tokens): 5-20s
```

### Throughput Metrics

```powershell
# Tokens per second (tok/s)
# Visible in status bar during response, or check logs:

curl http://localhost:8001/api/v1/training/stats | ConvertFrom-Json | Select-Object throughput_tokens_per_sec
```

### System Metrics

```powershell
# GPU utilization
nvidia-smi           # If NVIDIA GPU installed

# CPU usage
Get-Process python | Select-Object ProcessName, CPU, Memory

# Memory usage
[System.Diagnostics.ProcessStartInfo]::new("systeminfo")
# Look for "Total Physical Memory"
```

### Network Metrics

```powershell
# Check network traffic between services
Invoke-WebRequest http://localhost:8001/metrics  # If Prometheus enabled
```

## Success Criteria

The integration is considered SUCCESSFUL if:

- ✅ Desktop app starts without errors
- ✅ Ollama responds on port 11434
- ✅ Training service responds on port 8001
- ✅ Chat sends message and receives response
- ✅ Response appears word-by-word (streaming)
- ✅ Training event is logged (no errors in console)
- ✅ Status bar shows system metrics
- ✅ Voice service responds on port 8000 (if running)
- ✅ No CORS errors in browser console
- ✅ All navigation works (click through screens)

## Deployment Readiness

Once integration testing passes, the system is ready for:

1. **Docker Deployment** (see `docker-compose.yml`)
2. **Package Creation** (Windows/macOS/Linux installers)
3. **Release Publication** (GitHub Releases)
4. **User Documentation** (Installation guides)

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for deployment instructions.

## Next Steps

After successful integration testing:

### 1. Automated Testing
Run the full test suite to catch any regressions:
```powershell
cd apps/desktop
npm test                    # Desktop app unit tests
npm run test:e2e           # E2E tests (if configured)
```

### 2. Performance Testing
After code optimizations, re-run latency/throughput benchmarks.

### 3. Security Audit
Before deployment:
- Verify no credentials are hardcoded
- Check environment variable handling
- Run security linter: `npm audit`

### 4. Release Packaging
Create distribution packages:
```powershell
cd apps/desktop
npm run dist:win           # Windows installer
npm run dist:mac           # macOS package
npm run dist:linux         # Linux AppImage
```

---

## Quick Reference

| Component | Port | Status Check | Start Command |
|-----------|------|---------------|----------------|
| Ollama | 11434 | `curl http://localhost:11434/api/tags` | `ollama serve` |
| Training Service | 8001 | `curl http://localhost:8001/health` | `python -m uvicorn main:app --port 8001` |
| Voice Service | 8000 | `curl http://localhost:8000/health` | `python -m uvicorn main:app --port 8000` |
| Desktop App | 5173 | Open browser to `http://localhost:5173` | `npm run dev` |

---

**Last Updated**: 2026-04-02
**Version**: 1.0.0
**Status**: Production Ready

