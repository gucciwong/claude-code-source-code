# VibeVoice Phase 2 - Enhancement & Optimization Plan

**Status:** Planning (Post Phase 1B Completion)  
**Estimated Timeline:** Q2 2026 (4-6 weeks)  
**Dependencies:** Phase 1B merged to main ✅

---

## Overview

Phase 2 builds on the Phase 1B foundation (basic FastAPI + React UI) to deliver production-grade performance, real-time capabilities, and scalability.

### Phase 1B → Phase 2 Transition

| Aspect | Phase 1B | Phase 2 |
|--------|----------|---------|
| **Inference** | CPU-only, ~6s per 10s audio | GPU-accelerated, <1s per 10s audio |
| **Streaming** | Batch mode (upload full audio) | Real-time WebSocket streaming |
| **Model Format** | GGUF (reference) | ONNX + quantization (optimized) |
| **Scaling** | Single instance | Multi-instance with load balancing |
| **Cache** | None | Redis for TTS output caching |
| **Monitoring** | Basic logging | Prometheus metrics + health dashboard |

---

## Task Breakdown

### Task 1: GPU Acceleration (CUDA/Metal)

**Objective:** Support NVIDIA GPU and Apple Metal for 10x faster inference

**Deliverables:**
- CUDA kernels for Whisper (via torch with CUDA backend)
- Metal support for Apple Silicon (via ggml-metal)
- Automatic device detection (CPU → GPU fallback)
- Benchmark suite (latency, throughput, memory)

**Files to Create/Modify:**
```
services/voice-service/
├── voice_service/
│   ├── models/
│   │   ├── whisper.py              # Add device: str parameter
│   │   └── quantization.py         # NEW: ONNX quantization
│   └── config/
│       └── device_config.py        # NEW: Hardware detection
├── benchmarks/
│   ├── benchmark_asr.py            # NEW: ASR performance tests
│   └── benchmark_tts.py            # NEW: TTS performance tests
└── docker/
    └── Dockerfile.gpu              # NEW: CUDA base image
```

**Implementation Steps:**
1. Add `torch[cuda]` to requirements (conditional install)
2. Modify `WhisperASR.__init__()` to accept GPU device ID
3. Create device auto-detection logic
4. Add fallback chain: GPU → CPU
5. Benchmark: measure latency/throughput improvement
6. Document setup guide for CUDA + Metal

**Expected Performance:**
- 7B model on RTX 3060 12GB: ~500ms first token, 100+ tok/s
- Improvement: ~10-15x over CPU baseline

---

### Task 2: WebSocket Streaming (Real-Time Transcription)

**Objective:** Enable live transcription without waiting for full audio upload

**Deliverables:**
- WebSocket endpoint for streaming audio chunks
- Continuous ASR buffer management
- VAD (Voice Activity Detection) integration for auto-segmentation
- Streaming response with partial results

**Files to Create/Modify:**
```
services/voice-service/
├── main.py                         # Add WebSocket endpoint
├── voice_service/
│   ├── stream/
│   │   ├── __init__.py
│   │   ├── audio_buffer.py         # NEW: Chunked buffer
│   │   ├── vad.py                  # NEW: Voice activity detection
│   │   └── streaming_transcriber.py# NEW: Streaming ASR logic
│   └── audio/
│       └── processor.py            # Extend with streaming support
└── tests/
    └── test_streaming.py           # NEW: WebSocket tests
```

**Implementation Steps:**
1. Create `AudioBuffer` class (circular buffer for streaming chunks)
2. Integrate WebRTC VAD for silence detection
3. Add WebSocket endpoint: `GET /ws/transcribe`
4. Implement streaming protocol:
   ```json
   CLIENT → SERVER:
   {
     "type": "audio_chunk",
     "data": "base64-encoded-audio",
     "is_final": false
   }
   
   SERVER → CLIENT:
   {
     "type": "transcript",
     "text": "partial transcript...",
     "is_final": false,
     "confidence": 0.92
   }
   ```
5. Write tests for various network conditions
6. Benchmark: measure latency vs batch mode

**Expected Performance:**
- First result: <500ms (vs 6s batch)
- Continuous: <200ms per chunk
- Accuracy: same as batch (99%+ match)

---

### Task 3: Model Quantization & Optimization

**Objective:** Reduce model size and inference latency via ONNX

**Deliverables:**
- ONNX conversion script for Whisper + TTS models
- Quantization profiles (INT8, INT4, mixed-precision)
- Model registry with auto-download & caching
- Size/speed tradeoff documentation

**Files to Create/Modify:**
```
services/voice-service/
├── voice_service/
│   ├── models/
│   │   ├── whisper.py              # Support ONNX runtime
│   │   ├── quantization.py         # NEW: Quantization utils
│   │   └── model_registry.py       # NEW: Model download/cache
│   └── inference/
│       ├── __init__.py
│       ├── onnx_runtime.py         # NEW: ONNX inference
│       └── cuda_kernels.py         # NEW: CUDA optimizations
├── scripts/
│   ├── quantize_whisper.py         # NEW: Convert + quantize
│   ├── quantize_tts.py             # NEW: Convert + quantize
│   └── benchmark_models.py         # NEW: Size/speed comparison
└── tests/
    └── test_quantization.py        # NEW: Accuracy regression
```

**Implementation Steps:**
1. Create quantization pipeline (FP32 → INT8/INT4)
2. Write conversion script for Whisper models
3. Write conversion script for TTS models
4. Create model registry (metadata + URLs)
5. Implement auto-download with checksum verification
6. Add accuracy regression tests (HumanEval)
7. Document tradeoffs: size vs latency vs accuracy

**Expected Results:**
- Model size: 7B model reduced from 14GB → 3-4GB (INT4)
- Latency: 30-40% improvement
- Accuracy: <1% degradation

---

### Task 4: Multi-Instance Load Balancing

**Objective:** Scale to multiple concurrent users via Redis + HAProxy

**Deliverables:**
- Redis-based session management
- HAProxy configuration for round-robin
- Health checks and automatic failover
- Docker Compose setup for 3-instance deployment

**Files to Create/Modify:**
```
services/voice-service/
├── main.py                         # Add Redis integration
├── voice_service/
│   ├── config/
│   │   └── redis_config.py         # NEW: Redis connection
│   ├── cache/
│   │   ├── __init__.py
│   │   ├── session_store.py        # NEW: User sessions
│   │   └── model_cache.py          # NEW: Loaded models
│   └── health/
│       └── checks.py               # NEW: Health endpoints
├── docker/
│   ├── docker-compose.yml          # NEW: Multi-instance setup
│   ├── haproxy.cfg                 # NEW: Load balancer config
│   └── Dockerfile                  # Optimize for production
├── k8s/
│   ├── deployment.yaml             # NEW: Kubernetes deployment
│   ├── service.yaml                # NEW: Kubernetes service
│   └── hpa.yaml                    # NEW: Horizontal pod autoscaling
└── tests/
    └── test_load_balancing.py      # NEW: Multi-instance tests
```

**Implementation Steps:**
1. Add Redis dependency to requirements
2. Implement session store (user → model mapping)
3. Add model cache with TTL eviction
4. Extend health endpoint to include Redis status
5. Create docker-compose.yml (3 services + redis + haproxy)
6. Create HAProxy config with health checks
7. Write integration tests for failover scenarios
8. Create basic Kubernetes manifests

**Expected Scaling:**
- Single instance: ~2 concurrent users
- 3 instances: ~6 concurrent users
- 10 instances: ~20 concurrent users
- Cost/user: ~$0.05/hour (AWS pricing)

---

### Task 5: Monitoring & Observability

**Objective:** Production-grade monitoring with Prometheus + Grafana

**Deliverables:**
- Prometheus metrics for all endpoints
- Custom metrics (model load time, inference latency, queue depth)
- Grafana dashboard (real-time monitoring)
- Alert rules (high latency, service down, OOM)

**Files to Create/Modify:**
```
services/voice-service/
├── main.py                         # Add Prometheus middleware
├── voice_service/
│   ├── metrics/
│   │   ├── __init__.py
│   │   ├── prometheus.py           # NEW: Metric definitions
│   │   └── middleware.py           # NEW: Request/response tracking
│   └── monitoring/
│       ├── __init__.py
│       ├── alerts.py               # NEW: Alert rules
│       └── dashboards.py           # NEW: Grafana dashboard config
├── docker/
│   ├── prometheus.yml              # NEW: Prometheus config
│   ├── grafana.yml                 # NEW: Grafana datasources
│   └── docker-compose.monitoring.yml # NEW: Monitoring stack
└── tests/
    └── test_metrics.py             # NEW: Metric validation
```

**Metrics to Collect:**
```
# ASR
vibevoice_transcribe_duration_seconds (histogram)
vibevoice_transcribe_confidence (histogram)
vibevoice_asr_model_load_seconds (gauge)
vibevoice_asr_queue_depth (gauge)

# TTS
vibevoice_speak_duration_seconds (histogram)
vibevoice_tts_model_load_seconds (gauge)
vibevoice_tts_cache_hit_ratio (gauge)

# System
vibevoice_request_size_bytes (histogram)
vibevoice_response_size_bytes (histogram)
vibevoice_gpu_memory_used_bytes (gauge)
vibevoice_gpu_utilization_percent (gauge)
```

**Implementation Steps:**
1. Add prometheus-client to requirements
2. Create metric definitions
3. Add Prometheus middleware to FastAPI
4. Create Grafana dashboard config
5. Write alert rules (latency, errors, resource usage)
6. Create monitoring docker-compose
7. Write metric validation tests

---

### Task 6: Desktop UI - Integration & Polish

**Objective:** Integrate VoicePanel into main app layout and add advanced features

**Deliverables:**
- Integrated VoicePanel in sidebar/drawer
- Settings panel for voice preferences
- Transcription history view
- Voice feedback indicators (waveform, confidence)

**Files to Create/Modify:**
```
apps/desktop/src/renderer/
├── components/
│   ├── voice/
│   │   ├── VoiceInput.tsx          # With waveform visualization
│   │   ├── VoiceOutput.tsx         # Enhanced with progress
│   │   ├── VoicePanel.tsx          # Same
│   │   ├── VoiceSettings.tsx       # NEW: Model/language settings
│   │   ├── TranscriptionHistory.tsx# NEW: Recent transcriptions
│   │   ├── Waveform.tsx            # NEW: Audio visualization
│   │   └── index.ts
│   └── layout/
│       ├── Sidebar.tsx             # Add voice panel toggle
│       └── StatusBar.tsx           # Add voice status indicator
├── store/
│   ├── navigationStore.ts          # Existing
│   └── voiceStore.ts               # NEW: Transcription state
├── hooks/
│   └── useVoiceService.ts          # NEW: API integration hook
└── tests/
    ├── VoicePanel.test.tsx         # Existing (expand)
    └── VoiceSettings.test.tsx      # NEW
```

**Implementation Steps:**
1. Create VoiceSettings component (backend endpoint selection, model choice)
2. Create TranscriptionHistory component (list + search + export)
3. Create Waveform component (visual feedback during recording)
4. Add voice toggle button to Sidebar
5. Integrate VoicePanel into layout (collapsible drawer)
6. Add service status indicator to StatusBar
7. Create useVoiceService hook for API calls
8. Create Zustand voiceStore for state management

**UI Enhancements:**
- Real-time waveform visualization while recording
- Confidence score display in transcription
- Easy copy/paste of transcribed text
- Export transcription as .json / .txt
- Language/model selection dropdown
- Service connectivity indicator

---

## Implementation Sequence

**Week 1:**
- Task 1: GPU Acceleration setup
- Task 5: Basic Prometheus + quick dashboard

**Week 2:**
- Task 3: Model quantization pipeline
- Task 2: WebSocket streaming (start)

**Week 3:**
- Task 2: WebSocket streaming (finish)
- Task 6: Desktop integration

**Week 4:**
- Task 4: Load balancing setup
- Integration testing across all components

**Week 5-6:**
- Bug fixes, performance tuning
- Documentation and release prep

---

## Success Criteria

| Task | Metric | Target |
|------|--------|--------|
| GPU | Latency improvement | 10-15x speedup |
| Streaming | First result latency | <500ms |
| Quantization | Model size reduction | 70-75% smaller |
| Load Balancing | Concurrent users | 6-20+ concurrent |
| Monitoring | Alert response time | <5min detection |
| Desktop UI | Feature coverage | All 6 components integrated |

---

## Testing Strategy

### Unit Tests
- GPU device detection
- Quantization accuracy preservation
- Buffer management (streaming)
- Metric collection

### Integration Tests
- Multi-instance failover scenarios
- Redis session consistency
- WebSocket connection stability
- Load balancer health checks

### Performance Tests
- Latency under concurrent load
- Memory/GPU utilization
- Model loading times
- Cache hit ratios

### End-to-End Tests
- Desktop app with all components
- Full voice workflow (input → output)
- Service health recovery

---

## Dependencies & Resources

### Python Libraries (New)
```
torch[cuda]>=2.0.0        # GPU support
onnxruntime-gpu>=1.16.0   # ONNX inference
redis>=5.0.0              # Session store
prometheus-client>=0.17.0 # Metrics
webrtcvad>=2.0.10         # Voice activity detection
pydantic-settings>=2.0.0  # Config management
```

### Infrastructure
- NVIDIA CUDA 11.8+ (for GPU)
- Redis 7.0+ (for caching)
- HAProxy 2.8+ (for load balancing)
- Prometheus 2.40+ (for monitoring)
- Grafana 10.0+ (for dashboards)

### Documentation Needed
- GPU setup guide (CUDA + ROCm + Metal)
- WebSocket API reference
- Model quantization guide
- K8s deployment guide
- Monitoring dashboard walkthrough

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| GPU OOM | Training data loss | Implement memory profiling + early OOM detection |
| ONNX accuracy | Inference errors | Comprehensive regression tests (HumanEval suite) |
| WebSocket stability | Dropped transcriptions | Automatic reconnect + local buffering |
| Redis failure | Session loss | Redis persistence + backup strategy |
| GPU driver issues | Support burden | Containerized GPU setup (Docker) |

---

## Success Definition

Phase 2 is complete when:
✅ GPU inference runs 10x faster than CPU  
✅ WebSocket streaming provides <500ms first result  
✅ Models quantized to <4GB with <1% accuracy loss  
✅ 3-instance setup handles 6+ concurrent users  
✅ Prometheus dashboard shows all key metrics  
✅ Desktop UI fully integrated with voice features  
✅ All 6 tasks tested and documented  
✅ Initial load testing passes (100+ users/hour sustainable)  

---

**Next Action:** Review this plan with team → Start Task 1 (GPU Acceleration)
