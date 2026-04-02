# Sovereign Coder v1.0.0 — Release Notes

**Release Date**: 2026-04-02  
**Build Status**: ✅ Production Ready  
**Test Status**: ✅ 314 tests passing (0 failed, 10 skipped)  
**Build Size**: 546 kB minified  

---

## What's Included

### 🎯 Core Features

#### 1. Unified Desktop Application
- **Framework**: Electron 30 + React 18 + TypeScript 5.4
- **UI Library**: Radix UI + Lucide React icons
- **Styling**: Tailwind CSS v4 with custom design tokens
- **State**: Zustand-backed stores for navigation, system, models, chat, voice, command palette

#### 2. Six Navigation Screens
- **Dashboard**: Active model display, system health, quick actions
- **Chat**: Local LLM chat interface with real-time streaming
- **Models**: Browse, select, and manage Ollama models
- **Training**: Collect completion pairs, manage training datasets
- **Voice** (Optional): Microphone input, text-to-speech output
- **Settings**: System configuration and preferences

#### 3. Training Infrastructure
- **Backend**: FastAPI service (Python) on port 8001
- **Capabilities**: Collect completions, trajectories, corrections
- **Data Format**: SQLAlchemy ORM, JSON export support
- **Integration**: Async logging from chat completions (non-blocking)

#### 4. Voice Integration (Optional)
- **Backend**: FastAPI service (Python) on port 8000
- **ASR**: Whisper speech-to-text (openai/whisper-base)
- **TTS**: Google Text-to-Speech synthesis
- **UI Components**: VoicePanel, VoiceInput, VoiceOutput, Waveform visualizer

#### 5. Local LLM Support
- **Integration**: Ollama API (port 11434)
- **Supported Models**: llama2, mistral, neural-chat, and 50+ others
- **No Cloud**: All processing stays local
- **Streaming**: Real-time token streaming in chat

#### 6. System Monitoring
- **GPU Metrics**: VRAM usage, temperature (NVIDIA via nvidia-smi)
- **Throughput**: Tokens per second (tok/s) during inference
- **Health Indicators**: Color-coded status dots for system health
- **Persistent Status Bar**: Always-visible system metrics

---

## Architecture

```
Sovereign Coder v1.0.0
│
├─── apps/desktop/ (Electron + React)
│    ├─── src/main/
│    │    └─── main.ts (Electron main process, IPC bridge)
│    ├─── src/preload/
│    │    └─── index.ts (IPC preload script)
│    ├─── src/renderer/ (React frontend)
│    │    ├─── components/ (50+ components)
│    │    ├─── screens/ (6 navigation screens)
│    │    ├─── store/ (7 Zustand stores)
│    │    ├─── hooks/ (Custom React hooks)
│    │    ├─── services/ (API clients)
│    │    └─── styles/ (Tailwind + design tokens)
│    ├─── vite.config.ts (electron-vite)
│    ├─── package.json (Electron + React dependencies)
│    └─── vitest.config.ts (Unit test configuration)
│
├─── services/training-service/ (Python FastAPI)
│    ├─── main.py (FastAPI app entry point)
│    ├─── training/ (Business logic)
│    ├─── data/ (SQLAlchemy models)
│    └─── requirements.txt (Python dependencies)
│
├─── services/voice-service/ (Python FastAPI, optional)
│    ├─── main.py (FastAPI app entry point)
│    ├─── voice_service/ (Whisper + TTS logic)
│    └─── requirements.txt (Python dependencies)
│
├─── docs/plans/ (Implementation documentation)
│    ├─── 2026-04-01-ui-ux-design.md
│    ├─── 2026-04-01-frontend-phase1-implementation-plan.md
│    ├─── 2026-04-02-desktop-app-implementation-plan.md
│    ├─── 2026-04-02-phase2-training-implementation-plan.md
│    └─── 2026-04-02-vibevoice-implementation-plan.md
│
├─── SETUP_GUIDE.md (Installation & setup instructions)
├─── LIVE_INTEGRATION_TESTING_GUIDE.md (E2E testing)
├─── README.md (Updated with Sovereign Coder info)
└─── CLAUDE.md (Project guidelines & design tokens)
```

---

## Installation & Setup

### Quick Start (2 minutes)

**Prerequisites:**
- Node.js >= 18
- Python >= 3.10  
- Ollama installed (https://ollama.ai)

**Installation:**
```bash
# Clone and enter repository
git clone https://github.com/YOUR_ORG/claude-code-source-code.git
cd claude-code-source-code

# Install Node dependencies
cd apps/desktop
npm install

# Configure (if needed)
# Copy .env.example to .env and set service URLs
cp .env.example .env
```

**Start Services** (4 terminals):

Terminal 1 — Ollama:
```bash
ollama serve              # Port 11434
ollama pull mistral       # Download model
```

Terminal 2 — Training Service:
```bash
cd services/training-service
pip install -r requirements.txt
python -m uvicorn main:app --port 8001
```

Terminal 3 — Voice Service (optional):
```bash
cd services/voice-service
pip install -r requirements.txt
python -m uvicorn main:app --port 8000
```

Terminal 4 — Desktop App:
```bash
cd apps/desktop
npm run dev               # Opens http://localhost:5173
```

### Detailed Setup

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for comprehensive installation and configuration.

---

## Build & Deployment

### Development Build
```bash
cd apps/desktop
npm run dev              # Start dev server with hot reload
npm test                 # Run 314 unit tests
```

### Production Build
```bash
cd apps/desktop
npm run build            # Compile to out/ directory
npm run dist:win         # Create Windows installer
npm run dist:mac         # Create macOS package  
npm run dist:linux       # Create Linux AppImage
```

**Build Output:**
- `out/main/index.js` (4.29 kB) — Electron process
- `out/preload/index.mjs` (0.25 kB) — IPC bridge
- `out/renderer/assets/*.css` (33.50 kB) — Styles
- `out/renderer/assets/*.js` (508.20 kB) — React app
- **Total: 546 kB minified**

---

## Testing

### Unit Tests
```bash
cd apps/desktop
npm test                         # Run all 314 tests
npm test -- Training.test.tsx    # Run specific test file
```

**Test Coverage:**
- ✅ 50+ component tests
- ✅ 7 store tests
- ✅ 15+ hook tests
- ✅ Service integration tests
- ✅ All screens and features

### Integration Testing

See [LIVE_INTEGRATION_TESTING_GUIDE.md](LIVE_INTEGRATION_TESTING_GUIDE.md) for step-by-step E2E testing with all services running.

**Quick Integration Check:**
```bash
# In new terminal, verify services running
curl http://localhost:11434/api/tags         # Ollama
curl http://localhost:8001/health            # Training service
curl http://localhost:8000/health            # Voice service (optional)
curl http://localhost:5173                   # Desktop app
```

---

## Configuration

### Environment Variables

Create `apps/desktop/.env` (or copy from `.env.example`):

```env
# Service URLs
VITE_TRAINING_SERVICE_URL=http://localhost:8001
VITE_VOICE_SERVICE_URL=http://localhost:8000
VITE_OLLAMA_API_URL=http://localhost:11434

# Optional: Analytics
VITE_ANALYTICS_ENABLED=false

# Optional: Feature flags
VITE_VOICE_FEATURES_ENABLED=true
VITE_TRAINING_FEATURES_ENABLED=true
```

### Design Tokens

Sovereign Coder uses Tailwind CSS v4 with custom design tokens. To modify colors:

**File:** `apps/desktop/src/renderer/styles/tokens.css`

```css
@theme {
  /* Sovereign Violet accent */
  --color-accent-500: #8B5CF6;
  --color-accent-400: #A78BFA;
  --color-accent-600: #7C3AED;
  
  /* Background levels (dark theme) */
  --color-bg-base:      #0D0D0D;
  --color-bg-surface-1: #161616;
  --color-bg-surface-2: #1E1E1E;
  --color-bg-surface-3: #252525;
  --color-bg-elevated:  #2D2D2D;
  
  /* ... more tokens */
}
```

See `CLAUDE.md` (Part 2.2) for full design system documentation.

---

## Known Limitations

### v1.0.0 Scope

✅ **Implemented:**
- Desktop application UI/UX complete
- Local LLM chat with streaming
- Training data collection framework
- Voice I/O infrastructure
- System health monitoring
- 314 automated tests

⏳ **Not Yet Implemented:**
- Cloud synchronization (intentionally out of scope — local-first design)
- Multi-user collaboration
- Model fine-tuning UI
- Federated learning (roadmap for v2.0)
- Mobile applications
- VS Code extension (v2.0)

### Platform Support

- ✅ **Windows 10/11** — Full support via Electron
- ✅ **macOS 11+** — Full support (Intel & Apple Silicon)
- ✅ **Linux (Ubuntu 20.04+)** — Full support
- ❌ **Web** — Not planned (desktop-first design)

### GPU Support

- ✅ **NVIDIA GPUs** — Full CUDA support
- ✅ **AMD GPUs** — Partial (via CPU fallback)
- ✅ **Apple Silicon** — Partial (via CPU fallback)
- ⏳ **Other GPUs** — Roadmap for future versions

---

## Troubleshooting

### Common Issues

**"Desktop app loads but shows blank window"**
→ See [LIVE_INTEGRATION_TESTING_GUIDE.md](LIVE_INTEGRATION_TESTING_GUIDE.md) section "Troubleshooting"

**"Chat doesn't respond"**
→ Verify Ollama is running: `curl http://localhost:11434/api/tags`

**"Training service connection error"**
→ Check port 8001 is open: `netstat -ano | findstr :8001`

**"Voice features missing"**
→ Voice service is optional. Verify port 8000 if needed.

**"Port already in use"**
→ See detailed solutions in [LIVE_INTEGRATION_TESTING_GUIDE.md](LIVE_INTEGRATION_TESTING_GUIDE.md) (Port Conflicts section)

### Debug Mode

Enable verbose logging:

```bash
# Desktop app
npm run dev -- --inspect=9229  # Node inspector

# Training service
export LOGLEVEL=DEBUG
python -m uvicorn main:app --port 8001 --log-config logging.conf
```

---

## Performance Specs

### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | 8+ cores |
| RAM | 8 GB | 16+ GB |
| Storage | 10 GB | 20+ GB |
| GPU | None | NVIDIA RTX 3060+ |

### Performance Targets

**Chat Response Latency:**
- First token: 500-2000ms (varies by model)
- Full response (50 tokens): 5-20 seconds

**Throughput:**
- Tokens per second: 20-80 tok/s (varies by hardware)
- GPU systems: 2-5x faster than CPU

**Build & Test:**
- Build time: ~2-5 seconds
- Test suite: ~3.5 seconds (314 tests)

---

## Roadmap

### v1.0.x (Q2 2026)
- Security audit and hardening
- Performance optimization
- Bug fixes and stability improvements
- Extended documentation

### v1.1.x (Q3 2026)
- Model fine-tuning UI
- Advanced training analytics
- Custom prompt templates
- Integration with Hugging Face Hub

### v2.0 (Q4 2026)
- Federated learning (multiple devices)
- VS Code extension
- Multi-user collaboration
- Cloud backup (opt-in, encrypted)
- Advanced voice features (real-time transcription)

---

## Documentation

| Document | Purpose |
|----------|---------|
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Installation, configuration, troubleshooting |
| [LIVE_INTEGRATION_TESTING_GUIDE.md](LIVE_INTEGRATION_TESTING_GUIDE.md) | E2E testing with all services running |
| [CLAUDE.md](CLAUDE.md) | Project guidelines, design system, architecture |
| [README.md](README.md) | Project overview and quick links |
| [docs/plans/](docs/plans/) | Detailed implementation specifications |

---

## Support & Contributions

### Getting Help
1. Check [SETUP_GUIDE.md](SETUP_GUIDE.md) for common setup issues
2. See [LIVE_INTEGRATION_TESTING_GUIDE.md](LIVE_INTEGRATION_TESTING_GUIDE.md) for integration problems
3. Check browser console (F12) for JavaScript errors
4. Check service logs for Python backend issues

### Reporting Issues
When reporting bugs, include:
- **Environment**: OS, Node version, Python version, GPU type
- **Error message**: Full error text from console or logs
- **Steps to reproduce**: Exact commands and actions taken
- **Expected vs. actual**: What should happen vs. what did happen

### Contributing
See [CLAUDE.md](CLAUDE.md) Part 2 for contribution guidelines and coding standards.

---

## License

This project contains two license scopes:

1. **`src/` Directory** — Research/Reference Only
   - Original Claude Code v2.1.88 source (Anthropic IP)
   - For research and educational purposes only
   - Commercial use strictly prohibited

2. **`apps/desktop/` and `services/` Directories** — Open Development
   - Sovereign Coder desktop application
   - Licensed under [YOUR_LICENSE_HERE]
   - See LICENSE file for details

---

## Acknowledgments

Built with:
- **Electron** (cross-platform desktop)
- **React** (UI framework)
- **TypeScript** (type safety)
- **Tailwind CSS** (styling)
- **Radix UI** (accessible primitives)
- **Zustand** (state management)
- **FastAPI** (Python backend)
- **Ollama** (local LLMs)
- **Whisper** (speech-to-text)

---

## Quick Links

- 📚 [Setup Guide](SETUP_GUIDE.md)
- 🧪 [Integration Testing](LIVE_INTEGRATION_TESTING_GUIDE.md)
- 📖 [Architecture & Guidelines](CLAUDE.md)
- 🏗️ [Implementation Plans](docs/plans/)
- 🐛 [Issue Tracking](https://github.com/YOUR_ORG/claude-code-source-code/issues)
- 💬 [Discussions](https://github.com/YOUR_ORG/claude-code-source-code/discussions)

---

**Version: 1.0.0**  
**Status: ✅ Production Ready**  
**Last Updated: 2026-04-02**  
**Build Date: April 2, 2026**  

🚀 Thank you for using Sovereign Coder!
