# Sovereign Code — CLI and Runtime Contract

> Version: 1.0.0
> Date: 2026-04-03
> Status: Released (Week 1)
> Spec reference: docs/en/09-prd-v2-kpi-instrumentation-spec.md §3, §4

This document is the authoritative reference for all CLI scripts, REST API endpoints, and
event payload schemas shipped in Sovereign Code v0.8.x (Week 1). All downstream tooling
(CI, the VS Code extension, the desktop app) must conform to the contracts defined here.

---

## 1. CLI Scripts

### 1.1 `sovereign-week1-runtime-check.mjs` — Runtime Health Probe

**Purpose** — Checks that the local Ollama runtime is reachable, lists installed models,
and emits per-tier model recommendations.

**Usage**

```bash
node scripts/sovereign-week1-runtime-check.mjs [options]
```

**Options**

| Flag | Default | Description |
|---|---|---|
| `--host <host>` | `127.0.0.1` | Ollama host |
| `--port <port>` | `11434` | Ollama port |
| `--vram <tier>` | — | Filter recommendations: `6GB` \| `8GB` \| `12GB` \| `24GB` |
| `--timeout-ms <ms>` | `3000` | Request timeout |
| `--json` | false | Emit machine-readable JSON instead of human output |
| `-h, --help` | — | Print help |

**Example — human output**

```
$ node scripts/sovereign-week1-runtime-check.mjs --vram 8GB
Sovereign Code — Runtime Check
Host: 127.0.0.1:11434
Status: reachable
Models: 2
  qwen2.5-coder:7b
  starcoder2:15b-q4

Recommended for 8GB VRAM:
  starcoder2:15b-q4
  qwen2.5-coder:14b-q4
```

**Example — JSON output**

```json
{
  "runtime": {
    "reachable": true,
    "host": "127.0.0.1",
    "port": 11434,
    "error": null
  },
  "models": {
    "count": 2,
    "names": ["qwen2.5-coder:7b", "starcoder2:15b-q4"]
  },
  "recommendations": {
    "tier": "8GB",
    "suggested": ["starcoder2:15b-q4", "qwen2.5-coder:14b-q4"]
  }
}
```

**Exit codes**

| Code | Meaning |
|---|---|
| `0` | Runtime reachable |
| `1` | Runtime unreachable or argument error |

---

### 1.2 `sovereign-week1-benchmark.mjs` — Inference Benchmark

**Purpose** — Reads a JSON sample file, computes mean first-token latency and throughput,
and evaluates them against per-tier targets.

**Usage**

```bash
node scripts/sovereign-week1-benchmark.mjs --file <samples.json> [options]
```

**Options**

| Flag | Required | Description |
|---|---|---|
| `--file <path>` | Yes | JSON file containing a `Sample[]` array |
| `--tier <tier>` | No | `6GB` \| `8GB` \| `12GB` \| `24GB` — sets latency limit |
| `--json` | No | Emit machine-readable JSON |
| `-h, --help` | No | Print help |

**Sample file schema (version 1.0)**

```json
[
  { "firstTokenLatencyMs": 346, "tokensPerSecond": 42 },
  { "firstTokenLatencyMs": 318, "tokensPerSecond": 45 }
]
```

| Field | Type | Constraint |
|---|---|---|
| `firstTokenLatencyMs` | `number` | > 0, integer ms |
| `tokensPerSecond` | `number` | > 0 |

**Latency limits by tier**

| Tier tag | Latency limit |
|---|---|
| `6GB` | 1000 ms |
| `8GB` | 500 ms |
| `12GB` | 500 ms |
| `24GB` | 1000 ms |

Throughput minimum: **30 tok/s** for all tiers.

**Example — human output**

```
$ node scripts/sovereign-week1-benchmark.mjs --tier 12GB --file samples.json
Sovereign Week 1 Benchmark Report
Tier: 12GB
Samples: 10
Avg first-token latency: 293 ms
Avg throughput: 52 tps
Latency target (500 ms): PASS
Throughput target (30 tps): PASS
```

**Example — JSON output (version 1.0)**

```json
{
  "timestamp": "2026-04-03T00:00:00.000Z",
  "profile": {
    "requestedTier": "12GB",
    "normalizedTier": "12GB"
  },
  "metrics": {
    "sampleCount": 10,
    "firstTokenLatencyMsAvg": 293,
    "tokensPerSecondAvg": 52
  },
  "targets": {
    "latencyLimitMs": 500,
    "throughputMinimumTps": 30,
    "latencyPass": true,
    "throughputPass": true
  }
}
```

---

### 1.3 `sovereign-week1-evidence-bundle.mjs` — Evidence Bundle Generator

**Purpose** — Combines runtime and benchmark outputs into a single reviewable bundle
with gate-signal summary (readyForDemo).

**Usage**

```bash
node scripts/sovereign-week1-evidence-bundle.mjs \
  --date 2026-04-03 \
  --runtime-file runtime.json \
  --benchmark-file benchmark.json \
  [--json]
```

**Output object (version 1.0)**

```json
{
  "date": "2026-04-03",
  "runtimeReachable": true,
  "runtimeEndpoint": "127.0.0.1:11434",
  "runtimeError": null,
  "modelCount": 2,
  "modelNames": ["qwen2.5-coder:7b", "starcoder2:15b-q4"],
  "metrics": {
    "sampleCount": 10,
    "firstTokenLatencyMsAvg": 346,
    "tokensPerSecondAvg": 42
  },
  "targets": {
    "latencyPass": true,
    "throughputPass": true,
    "latencyLimitMs": 500,
    "throughputMinimumTps": 30
  },
  "gateSignals": {
    "readyForDemo": true,
    "reason": "All Week 1 gate signals are green"
  }
}
```

---

## 2. Training Service REST API

**Base URL** — `http://127.0.0.1:8001`  
**Version** — `v1`  
**Auth** — None (local service, no external exposure)

---

### 2.1 GET `/health` — Service Health

**Response 200**

```json
{
  "status": "ok",
  "version": "0.1.0",
  "database_ready": true
}
```

| Field | Type | Values |
|---|---|---|
| `status` | string | `"ok"` \| `"degraded"` |
| `version` | string | semver |
| `database_ready` | boolean | SQLite connection live |

---

### 2.2 POST `/api/v1/training/event` — Log Completion or Inference Event

**Request body** — `application/json`

#### Minimal payload (required fields only)

```json
{
  "event_type": "completion_accepted",
  "prompt": "def fibonacci(n):",
  "completion": "\n    if n <= 1: return n\n    return fibonacci(n-1) + fibonacci(n-2)",
  "language": "python"
}
```

#### Full payload — completion event with KPI §3.1 + §3.2 envelope

```json
{
  "event_name": "completion_accepted",
  "event_version": "1.0",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "session_id": "sess-a1b2c3d4",
  "installation_id_hash": "sha256-truncated-hex",
  "project_id_hash": "proj-local-hash",
  "client_version": "0.8.0",
  "platform": "Win32",
  "runtime_backend": "ollama",
  "event_type": "completion_accepted",
  "prompt": "def fibonacci(n):",
  "completion": "\n    if n <= 1: return n\n    return fibonacci(n-1) + fibonacci(n-2)",
  "language": "python",
  "file_path": "src/utils/math.py",
  "model_id": "qwen2.5-coder:7b",
  "completion_type": "inline",
  "suggestion_length_tokens": 32,
  "accepted_boolean": true,
  "edit_distance_after_accept": 0,
  "first_token_latency_ms": 346.2,
  "tokens_per_second": 42.1,
  "backend_name": "ollama",
  "model_quantization": "Q4_K_M",
  "prompt_tokens": 18,
  "completion_tokens": 34
}
```

#### Full payload — inference lifecycle event

```json
{
  "event_name": "inference_request_completed",
  "event_version": "1.0",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "session_id": "sess-a1b2c3d4",
  "event_type": "inference_request_completed",
  "prompt": "",
  "completion": "",
  "language": "text",
  "model_id": "qwen2.5-coder:7b",
  "first_token_latency_ms": 346.2,
  "tokens_per_second": 42.1,
  "backend_name": "ollama",
  "model_quantization": "Q4_K_M",
  "prompt_tokens": 18,
  "completion_tokens": 34
}
```

#### Failed inference event

```json
{
  "event_name": "inference_request_failed",
  "event_version": "1.0",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "session_id": "sess-a1b2c3d4",
  "event_type": "inference_request_failed",
  "prompt": "",
  "completion": "",
  "language": "text",
  "error_message": "CUDA device not available — falling back to CPU is not supported in this profile"
}
```

**Response 201**

```json
{
  "event_id": "uuid-v4-string",
  "created_at": "2026-04-03T00:00:00.000000+00:00"
}
```

**Error responses**

| Status | Condition | Body `detail` |
|---|---|---|
| 400 | Invalid `event_type` | `"Invalid event_type: <value>"` |
| 400 | Code validation failed | `"Invalid code: <reason>"` |
| 500 | Internal error | `"Internal server error"` |

**Valid `event_type` values** (EventType enum v1.0)

| Value | Category |
|---|---|
| `completion_suggested` | completion |
| `completion_accepted` | completion |
| `completion_rejected` | completion |
| `completion_edited_after_accept` | completion |
| `inference_request_started` | inference |
| `inference_first_token_emitted` | inference |
| `inference_request_completed` | inference |
| `inference_request_failed` | inference |

---

### 2.3 POST `/api/v1/training/task` — Log Task Trajectory

**Request body**

```json
{
  "task_id": "task-uuid-v4",
  "task_description": "Add unit tests for the fibonacci function",
  "task_type": "test_generation",
  "steps": [
    {
      "step": 1,
      "action": "read_file",
      "input": "src/utils/math.py",
      "output": "def fibonacci(n): ..."
    },
    {
      "step": 2,
      "action": "write_file",
      "input": "tests/test_math.py",
      "output": "import pytest\n..."
    }
  ],
  "outcome": "success",
  "final_code": "import pytest\ndef test_fibonacci():\n    ...",
  "execution_time_seconds": 4.2,
  "tokens_consumed": 512
}
```

**`outcome` values** — `"success"` | `"failure"` | `"partial"`

**Response 201**

```json
{
  "task_id": "task-uuid-v4",
  "created_at": "2026-04-03T00:00:00.000000+00:00"
}
```

---

### 2.4 GET `/api/v1/training/stats` — Training Data Statistics

**Response 200**

```json
{
  "total_events": 1024,
  "completion_accepted": 734,
  "completion_rejected": 120,
  "completion_edited": 170,
  "task_completed_total": 88,
  "task_success_rate": 0.82,
  "recent_events_24h": 47
}
```

---

### 2.5 GET `/api/v1/training/export` — Export Training Dataset

**Query parameters**

| Parameter | Default | Values |
|---|---|---|
| `format` | `jsonlines` | `jsonlines` \| `parquet` \| `csv` |
| `max_samples` | `5000` | positive integer |
| `language` | — | ISO language code filter (e.g. `python`) |

**Example**

```
GET /api/v1/training/export?format=jsonlines&max_samples=1000&language=python
```

**Response** — `application/x-ndjson` (jsonlines) or appropriate MIME type.  
Each line is one training sample in the output format.

---

## 3. Event Payload Schema — Version Tag

All event payloads must carry `"event_version": "1.0"` (the default). This field is
the contract version for downstream data pipelines. Increment on any breaking field
change; bump minor for additive changes.

| Schema version | Change |
|---|---|
| `1.0` | Initial release — 11 §3.1 common fields + §3.2 inference + completion domain fields |

---

## 4. Data Quality Contract (spec §4)

| Rule | Threshold | CI enforcement |
|---|---|---|
| `event_version` present | 100% | `test_data_quality.py::test_event_version_is_always_stored` |
| `correlation_id` present | 100% when sent | `test_data_quality.py::test_correlation_id_default_not_enforced_but_measured` |
| Critical-field null rate | < 0.5% | `test_data_quality.py::test_null_rate_stays_below_threshold_for_nominal_batch` |
| Type-mismatch rate | < 0.2% | `test_data_quality.py::test_mismatch_rate_below_threshold_for_nominal_batch` |
| Late-event arrival | < 10 min | `test_data_quality.py::test_late_arrival_detector_*` |

---

## 5. Desktop App Integration Points

The Electron desktop (`apps/desktop/`) integrates this API via:

| Module | Path |
|---|---|
| KPI envelope builder | `apps/desktop/src/renderer/services/telemetry.ts` |
| HTTP client | `apps/desktop/src/renderer/services/trainingClient.ts` |
| React hook | `apps/desktop/src/renderer/hooks/useTrainingService.ts` |
| Call sites | `apps/desktop/src/renderer/screens/Chat.tsx` |

The `buildEnvelope(eventName, modelId, runtimeBackend?, projectIdHash?, correlationId?)` 
function auto-populates all 11 §3.1 common fields using `sessionStorage` (session UUID) 
and `localStorage` (installation UUID hash). Related lifecycle events share a 
`correlationId` generated once per inference request in `handleSend()`.
