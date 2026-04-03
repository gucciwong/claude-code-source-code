> Plan Status: Closed on 2026-04-04. This file is a historical planning artifact; execution tracking is consolidated in docs/plans/2026-04-04-plan-closure-report.md.

# VibeVoice Integration Design
**Sovereign Coder Voice-as-Interface Layer**

**Date:** 2026-04-02  
**Status:** Design Review  
**Author:** Sovereign Coder Brainstorm  

---

## 1. Executive Summary

Integrate Microsoft's **VibeVoice** (open-source voice AI) into Sovereign Coder to enable:
- **Voice commands** → Natural language to code (speech → ASR → prompt → code generation)
- **Voice output** → Read code suggestions, errors, chat responses aloud (TTS)
- **Hands-free coding** → Accessibility + improved developer flow state
- **100% local** → All voice processing runs offline (privacy-first)

**Scope:** Phase 1B feature (after Models Hub completion)  
**Integration Points:** VSCode Extension + Desktop App  
**Complexity:** Medium-High (audio pipeline + UI state management)  

---

## 2. Problem Statement

### Current State
- Sovereign Coder has excellent **text-based** interface (inline completions, chat)
- No voice interaction layer → excludes accessibility users, requires typing
- Competitors (GitHub Copilot, Cursor) have basic voice but **cloud-based** → privacy leak

### Solution
- **VibeVoice** = Microsoft's open-source voice models (ASR + TTS)
- **Offline-first** = All processing on device (aligns with Sovereign Coder DNA)
- **Two-way dialogue** = Speak intent, hear responses (natural coding rhythm)

### Target Users
1. **Accessibility-first** — Screen reader users, RSI/accessibility needs
2. **Flow-state developers** — Want hands-free, natural dialogue
3. **Privacy-conscious enterprises** — Require on-premise voice processing
4. **Technical leads** — Document code via voice, hands-free code review

---

## 3. VibeVoice Models Selection

### 3.1 Recommended Models

| Model | Use Case | Specs | Latency | Notes |
|-------|----------|-------|---------|-------|
| **VibeVoice-ASR-7B** | User voice commands | 7B params, 64K context | ~2-5s per 60s audio | 50+ languages, speaker tracking, timestamps |
| **VibeVoice-Realtime-0.5B** | Agent/code responses (TTS) | 0.5B params, streaming | ~300ms first token | Real-time streaming, lightweight, natural |
| **VibeVoice-TTS-1.5B** | Long-form output (optional) | 1.5B params, 90-min | ~5-10s per 60s | For documentation reading, multi-speaker |

### 3.2 Model Deployment Strategy

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│   VRAM Budget Analysis (Consumer GPU)                      │
│                                                            │
│   Inference Model (e.g., Llama 3 8B)   │   ~6GB VRAM     │
│   VibeVoice-ASR-7B (cached)             │   ~8GB VRAM     │
│   VibeVoice-Realtime-0.5B (TTS)         │   ~1GB VRAM     │
│   ─────────────────────────────────────────────────────    │
│   Total (sequential, not concurrent)    │   ~15GB VRAM    │
│                                                            │
│   ✓ Fits RTX 4060 (8GB) with optimization               │
│   ✓ Fits RTX 4080 (12GB) comfortably                    │
│   ✓ Fits RTX 4090 (24GB) with headroom                 │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Strategy:**
- Load **ASR** on-demand when user toggles voice input (cache after first load)
- Load **Realtime TTS** always (lightweight 0.5B, ~1GB VRAM)
- Fall back to text-only if VRAM insufficient (graceful degradation)

---

## 4. Architecture Overview

### 4.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    SOVEREIGN CODER + VIBEVOICE                      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    USER INTERFACE LAYER                      │  │
│  │  ┌──────────────────┐          ┌──────────────────────┐     │  │
│  │  │  VSCode Editor   │          │  Desktop App Chat    │     │  │
│  │  │  + Voice Toggle  │          │  + Voice Input       │     │  │
│  │  └────────┬─────────┘          └──────────┬───────────┘     │  │
│  │           │                               │                 │  │
│  │           └───────────────┬───────────────┘                 │  │
│  │                           │                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                             │                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  VOICE ORCHESTRATION LAYER                   │  │
│  │  ┌─────────────────────────────────────────────────────┐    │  │
│  │  │  VoiceController (Zustand Store + Event Emitter)   │    │  │
│  │  │  - Recording state (idle, recording, processing)   │    │  │
│  │  │  - Audio input management (Web Audio API)          │    │  │
│  │  │  - ASR/TTS pipeline coordination                   │    │  │
│  │  └─────────────────────────────────────────────────────┘    │  │
│  │                                                              │  │
│  │  ┌──────────────────┐       ┌──────────────────────┐       │  │
│  │  │  Audio Capture   │       │  Audio Playback      │       │  │
│  │  │  (Web Audio API) │       │  (Web Audio API)     │       │  │
│  │  └────────┬─────────┘       └─────────┬────────────┘       │  │
│  │           │                           │                    │  │
│  └─────────────────────────────────────────────────────────────┘  │
│           │                               │                       │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              VOICE PROCESSING LAYER (Python)               │   │
│  │                                                            │   │
│  │  ┌──────────────────┐       ┌──────────────────────┐      │   │
│  │  │ ASR Pipeline     │       │ TTS Pipeline         │      │   │
│  │  │ (VibeVoice-ASR)  │       │ (VibeVoice-Realtime) │      │   │
│  │  │ audio → text     │       │ text → audio stream  │      │   │
│  │  │ (60min support)  │       │ (300ms latency)      │      │   │
│  │  └────────┬─────────┘       └─────────┬────────────┘      │   │
│  │           │                           │                    │   │
│  └─────────────────────────────────────────────────────────────┘  │
│        │                                   │                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │         INFERENCE LAYER (Ollama Backend)                   │   │
│  │                                                            │   │
│  │  ASR Output        RAG Pipeline        LLM Inference      │   │
│  │  (text)    →  (chunking + search)  →  (code generation)  │   │
│  │                                              ↓             │   │
│  │                                         Generated Code    │   │
│  │                                              ↓             │   │
│  │                                         TTS Input         │   │
│  │                                              ↓             │   │
│  │                                         Audio Stream       │   │
│  │                                                            │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow (User Speaks → Code Generated → Spoken Response)

```
User speaks:
"Add a function to validate email addresses"
        │
        ↓
┌──────────────────────────────────────┐
│  Web Audio API (VSCode/Desktop)      │
│  - Capture PCM audio stream          │
│  - Send to Python voice service      │
└─────────────┬────────────────────────┘
              │
              ↓
┌──────────────────────────────────────┐
│  VibeVoice-ASR (Python backend)      │
│  - Load model (7B, cached)           │
│  - Transcribe audio                  │
│  - Return: text + speaker + timestamp│
└─────────────┬────────────────────────┘
              │
              ↓ "Add a function to validate email addresses"
┌──────────────────────────────────────┐
│  RAG + LLM Pipeline (Ollama)         │
│  - Chunk user query                  │
│  - Search embeddings for context     │
│  - Generate code via LLM             │
└─────────────┬────────────────────────┘
              │
              ↓ function validateEmail(email) { ... }
┌──────────────────────────────────────┐
│  VibeVoice-Realtime TTS (Python)     │
│  - Load model (0.5B, always cached)  │
│  - Stream text→audio                 │
│  - Return audio chunks               │
└─────────────┬────────────────────────┘
              │
              ↓ PCM audio stream
┌──────────────────────────────────────┐
│  Web Audio API (VSCode/Desktop)      │
│  - Playback audio to user speaker    │
│  - Show generated code in editor     │
└──────────────────────────────────────┘
```

---

## 5. Component Design

### 5.1 VSCode Extension Voice Layer

**New File:** `apps/vscode-extension/src/voiceInterface/VoiceController.ts`

```typescript
interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  audioBuffer: Float32Array | null;
  errorMessage: string | null;
}

class VoiceController {
  // Toggle recording on/off (keybind: Ctrl+Shift+V)
  toggleRecording(): Promise<void>
  
  // Send audio to ASR backend
  transcribeAudio(audioBuffer: Float32Array): Promise<string>
  
  // Stream TTS output to speaker
  playText(text: string, onChunk?: (audio: Float32Array) => void): Promise<void>
  
  // Integrated flow: voice → code → speech
  voiceCommand(audioBuffer: Float32Array): Promise<GeneratedCode>
}
```

**Integration:**
- Register keybinding: `ctrl+shift+v` → start/stop recording
- Status bar indicator: 🎤 "Recording..." (red pulsing indicator)
- Inline feedback: Show transcribed text in editor (italic gray text)
- Insert generated code at cursor + play TTS response

### 5.2 Desktop App Voice Chat Component

**New File:** `apps/desktop/src/renderer/components/VoiceChatPanel.tsx`

```typescript
// Feature parity with Models Hub (already shipping)
<VoiceChatPanel>
  ┌─────────────────────────────────────┐
  │ Voice Chat Interface                │
  ├─────────────────────────────────────┤
  │ [🎤 Start Recording] [⏹ Stop]       │
  │                                     │
  │ Transcription (live):               │
  │ "Add validation function..."        │
  │                                     │
  │ Generated Code:                     │
  │ function validateEmail(email) { }   │
  │                                     │
  │ [🔊 Play Response] [📋 Copy Code]  │
  └─────────────────────────────────────┘
```

**Stores:**
- `voiceStore` (Zustand) — recording, transcription, playback state
- Dispatch to `chatStore` for history

### 5.3 Python Backend Service

**New Directory:** `services/voice-service/`

```
services/voice-service/
  main.py                    # FastAPI server
  asr_pipeline.py           # VibeVoice ASR integration
  tts_pipeline.py           # VibeVoice Realtime TTS
  model_loader.py           # Lazy-load models with caching
  requirements.txt          # torch, transformers, vibevoice, fastapi
```

**FastAPI endpoints:**
- `POST /api/voice/transcribe` — audio → text (ASR)
- `POST /api/voice/speak` — text → audio stream (TTS)
- `POST /api/voice/command` — full pipeline (audio → code → audio)
- `GET /api/voice/status` — model loaded, VRAM available, etc.

---

## 6. Integration Points

### 6.1 With Existing RAG System
- ASR output → query embeddings (same chunker used for code context)
- Improve RAG accuracy by preferring user intent over exact query match
- Store voice sessions in RAG vector store (future: speaker-specific context)

### 6.2 With OllamaClient
- Use existing `streamChat()` for LLM inference
- ASR text feeds into chat as user message
- TTS speaks the assistant's response

### 6.3 With Models Hub
- Display active model + voice models status in Status Bar
- Show VRAM allocation: "Model: llama2 (6GB) + Voice (1.5GB)"
- Allow users to unload voice models to free VRAM (graceful degradation)

---

## 7. User Workflows

### Workflow 1: VSCode Voice Commands
```
1. Developer opens VSCode
2. Press Ctrl+Shift+V → start recording
3. Speak: "Add error handling to this function"
4. ASR transcribes, RAG finds context, LLM generates code
5. Generated code inserted at cursor
6. TTS plays: "I've added a try-catch block for error handling"
7. Press Ctrl+Shift+V again → stop recording
```

### Workflow 2: Desktop Voice Chat (Hands-Free Coding)
```
1. Open Sovereign Coder desktop app → Models screen → Chat tab
2. Click "🎤 Start Recording"
3. Speak prompt: "Create a React component for user login"
4. System shows live transcription
5. LLM generates component code
6. Code displayed in chat
7. Click "🔊 Play Response" → hear explanation
8. Copy code to clipboard → paste in IDE
```

### Workflow 3: Code Review by Voice
```
1. Developer reads code aloud to document changes
2. ASR captures engineer's voice explanation
3. Explanation stored with code in RAG system
4. Team can query: "What was the intent here?" → ASR history provides context
5. Federated learning: Share transcription insights without sharing code
```

---

## 8. Technical Specifications

### 8.1 VRAM & Compute Requirements

| Configuration | Base LLM | ASR | TTS | Total | Min GPU |
|---|---|---|---|---|---|
| **Light** (Phi-3 3B) | 2GB | 8GB | 1GB | 11GB | RTX 3060 |
| **Medium** (Mistral 7B) | 5GB | 8GB | 1GB | 14GB | RTX 4070 |
| **Heavy** (Llama 13B) | 9GB | 8GB | 1GB | 18GB | RTX 4090 |

**Optimization strategy:**
- Load ASR only when voice feature is enabled
- Use LoRA adapters for ASR/TTS fine-tuning (reduce VRAM by 20-30%)
- Quantize models to 4-bit (Q4 VibeVoice-ASR = ~4GB instead of 8GB)

### 8.2 Latency Profile

| Stage | Expected | Target |
|-------|----------|--------|
| Audio capture (0.5s window) | <50ms | <100ms |
| ASR transcription | 1-3s per 60s | <2s for typical 10s prompt |
| RAG retrieval | 200-500ms | <300ms |
| LLM code generation | 2-5s (for 100 tokens) | <3s |
| TTS streaming start | 300ms | <300ms (real-time) |
| **Total end-to-end** | 4-10s | <8s target |

### 8.3 Audio Formats & Codec

- **Input (from browser):** PCM 16-bit, 16kHz (Web Audio API standard)
- **Internal:** WAV containers for VibeVoice ASR (supports various rates up to 48kHz)
- **Output TTS:** PCM float32 (VibeVoice native output), convert to 16-bit for browser playback

---

## 9. Error Handling & Fallbacks

### 9.1 Failure Modes

| Scenario | Handling |
|----------|----------|
| ASR model crash | Log error, fall back to text input (show error toast) |
| TTS model unavailable | Skip audio output, show text response only |
| Out of VRAM (ASR load fails) | Prompt user to unload optional models, offer text-only mode |
| Audio device not available | Disable voice features, show warning in UI |
| Transcription confidence < 50% | Ask user to clarify ("Could you repeat that?") |

### 9.2 Graceful Degradation

```
Voice Enabled (Default)
    ↓
    Audio Input Failed
    ↓
Voice Disabled (Fall back to text)
    ↓
    User can still use all other features
```

---

## 10. Privacy & Security

### 10.1 Audio Data Handling

- ✅ **All audio stays local** — No transmission to cloud services
- ✅ **No recording by default** — Only when user explicitly presses 🎤
- ✅ **Audio buffer cleared** — After transcription, audio deleted from memory
- ✅ **No audio logs** — Transcriptions stored only if user enables chat history
- ✅ **Federated learning** — Share text analysis, not raw audio

### 10.2 Model Privacy

- ClearML local model cache (no HuggingFace API calls during inference)
- Models loaded from `~/.ollama/models/vibevoice/` (user-owned)
- Option to run air-gapped (download models, disable auto-updates)

### 10.3 GDPR/HIPAA Compliance

- Audit logging: Log which voice commands executed (for compliance audit trails)
- Session isolation: Each voice session independent (no cross-session leakage)
- User consent: First-run wizard explains voice data handling

---

## 11. Testing Strategy

### 11.1 Unit Tests

- `voiceController.test.ts` — Recording state, audio buffer management
- `vraseService.test.ts` — ASR/TTS pipeline mocking
- `voiceChatPanel.test.tsx` — UI rendering, button interactions

### 11.2 Integration Tests

- End-to-end: Record audio → Transcribe → Generate code → Speak response
- Stress test: 10+ voice commands in sequence (model caching verification)
- VRAM profiling: Measure peak memory during ASR/TTS load

### 11.3 QA Scenarios

| Scenario | Success Criteria |
|----------|------------------|
| User speaks clearly | ASR accuracy >95% (typical) |
| Ambient noise | ASR accuracy >85% (acceptable) |
| Long-form audio (5+ min) | ASR maintains accuracy, no crashes |
| Rapid fire commands | TTS waits for previous to complete |
| Model unload/reload | No corruption, clean state reset |

---

## 12. Rollout Plan

### Phase 1B (v0.2, ~4 weeks)
- ✅ Python voice service (FastAPI + VibeVoice models)
- ✅ VSCode extension voice toggle (keybind + recording)
- ✅ Desktop app voice chat UI (basic)
- ✅ Tests: 40+ tests (unit + integration)
- 🎯 **MVP**: Voice input only (one-way)

### Phase 2 (v0.3, ~2 weeks)
- Voice output (TTS streaming)
- Real-time transcription (show as user speaks)
- Voice settings (language, speed, model selection)
- 🎯 **Full two-way voice**: Input + output working

### Phase 3+ (Future)
- Speaker identification (who said what in team sessions)
- Voice cloning for personalized TTS
- Federated voice model training (learn from team patterns)
- Integration with code review tools (voice annotations)

---

## 13. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Voice accuracy | >90% Word Error Rate | User session testing |
| End-to-end latency | <8s (voice → code → speech) | Automated benchmarks |
| User adoption | 25% of VSCode ext users try voice | Telemetry (opt-in) |
| VRAM efficiency | <2GB additional overhead | Profile on RTX 3060 |
| Accessibility impact | 50+ hours user sessions/week | Usage analytics |

---

## 14. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| VibeVoice-ASR accuracy insufficient for code intent | Medium | High | Implement fallback to text, gather user feedback |
| VRAM exhaustion on consumer GPUs | Medium | High | Quantization, model unloading, graceful degradation |
| Audio input latency delays UX | Low | Medium | Implement local buffering, WebRTC optimizations |
| Privacy concerns around voice recording | Low | High | Transparent UI, local-only architecture, audit logs |
| VibeVoice dependency maintenance risk | Low | High | Fork critical models, contribute back upstream |

---

## 15. Success Definition

### ✅ Phase 1B Complete When:
1. VSCode extension can record voice → transcribe → insert code (one-way)
2. Desktop app has voice chat interface (two-way planned)
3. 40+ tests passing, zero data transmission observed
4. ASR accuracy >85% on English code intent
5. TTS latency <500ms first token
6. Documented in user guide with privacy section
7. All commits merged to main branch

---

## 16. Appendix

### A. VibeVoice References
- **Repo:** https://github.com/microsoft/VibeVoice
- **ASR Docs:** https://github.com/microsoft/VibeVoice/blob/main/docs/vibevoice-asr.md
- **TTS Docs:** https://github.com/microsoft/VibeVoice/blob/main/docs/vibevoice-realtime-0.5b.md
- **Paper:** https://arxiv.org/abs/2601.18184

### B. Related Technologies
- **Web Audio API** — Browser-based audio capture/playback (VSCode)
- **PyAudio** — Python audio I/O (voice service backend)
- **Transformers library** — VibeVoice model loading (HuggingFace)
- **vLLM** — Optional ASR speedup (KV-cache optimization)

### C. License Considerations
- VibeVoice: MIT license ✅ (compatible with Sovereign Coder)
- Transformers: Apache 2.0 ✅
- Ollama: Proprietary (models are open) ✅
- **Conclusion:** No licensing conflicts

---

## Sign-Off

**Design Status:** ✅ Ready for Implementation Review  
**Next Step:** Invoke `writing-plans` skill to create detailed implementation plan with task breakdown



