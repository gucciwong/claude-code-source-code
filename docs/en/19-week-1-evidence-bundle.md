# Sovereign Coder — Week 1 Evidence Bundle

> Date: 2026-04-03 (Friday)
> Week: Foundation Month 1, Week 1
> Status: Complete
> Ref: docs/en/11-prd-v2-week-1-execution-board.md

---

## 1. Gate Signal Summary

| Signal | Status | Evidence |
|---|---|---|
| Runtime health probes working | ✅ | `sovereign-week1-runtime-check.mjs` — 13 tests pass |
| Inference event instrumentation | ✅ | Chat.tsx — 4-event lifecycle in production code |
| Completion event KPI envelope | ✅ | §3.1 + §3.2 fields in DB and API |
| Schema validation CI | ✅ | 27 Python tests (schema + data-quality) pass |
| Tier A 6GB latency | ✅ PASS | 700 ms < 1000 ms limit |
| Tier A 6GB throughput | ⚠️ FAIL | 28 tok/s < 30 tok/s floor |
| Tier A 8GB latency + throughput | ✅ PASS | 346 ms, 42 tok/s |
| Tier B 12GB latency + throughput | ✅ PASS | 293 ms, 52 tok/s |
| Tier C 24GB latency + throughput | ✅ PASS | 197 ms, 64 tok/s |
| Week 1 demo runbook | ✅ | Section 5 below |
| Week 2 blockers published | ✅ | docs/en/19-week-2-handoff.md |

**readyForDemo**: ✅ YES (single known exception: Tier A 6GB throughput — documented and triaged below)

---

## 2. Test Suite Results (2026-04-03)

### Python — training-service

```
pytest training_data/test_store.py tests/ -v
50 passed, 35 warnings in 7.82s
```

| Suite | Tests | Result |
|---|---|---|
| `training_data/test_store.py` | 9 | ✅ all pass |
| `tests/test_schema_validation.py` | 9 | ✅ all pass |
| `tests/test_data_quality.py` | 12 | ✅ all pass |
| `tests/test_finetune.py` | 20 | ✅ all pass |

35 deprecation warnings in `finetune/job_manager.py` (`datetime.utcnow()`, Pydantic `.dict()`) — tracked as Week 2 cleanup item (non-blocking).

### Node.js — scripts

```
node --test scripts/tests/sovereign-week1-tier-baseline.test.mjs \
              scripts/tests/sovereign-week1-benchmark.test.mjs \
              scripts/tests/sovereign-week1-evidence-bundle.test.mjs \
              scripts/tests/sovereign-week1-runtime-check.test.mjs
88 pass, 0 fail
```

### TypeScript — desktop app

```
cd apps/desktop && npm test
781 passed, 10 skipped (791), 0 failed — 9.93s
```

---

## 3. Benchmark Baseline (per VRAM Tier)

Full table: `docs/en/17-benchmark-baseline-table.md`

| Tier | VRAM | Avg Latency | Avg Throughput | Latency | Throughput |
|---|---|---|---|---|---|
| A (low) | 6 GB | 700 ms | 28 tok/s | ✅ | ⚠️ |
| A (high) | 8 GB | 346 ms | 42 tok/s | ✅ | ✅ |
| B (mid) | 12 GB | 293 ms | 52 tok/s | ✅ | ✅ |
| C (high) | 24 GB | 197 ms | 64 tok/s | ✅ | ✅ |

---

## 4. Shipped Artifacts (this week)

| Artifact | Path | Notes |
|---|---|---|
| KPI telemetry envelope | `apps/desktop/src/renderer/services/telemetry.ts` | `buildEnvelope()` — §3.1 auto-fill |
| Inference event instrumentation | `apps/desktop/src/renderer/screens/Chat.tsx` | 4-event lifecycle per request |
| Training client types | `apps/desktop/src/renderer/services/trainingClient.ts` | `InferenceEventPayload`, `logInferenceEvent()` |
| Training hook | `apps/desktop/src/renderer/hooks/useTrainingService.ts` | `logInference()` added |
| Training DB schema | `services/training-service/training_data/models.py` | 19 new KPI columns, `run_migrations()` |
| Training store | `services/training-service/training_data/store.py` | Full KPI param pass-through |
| Training API | `services/training-service/main.py` | `CompletionEventRequest` extended |
| Schema validation CI | `services/training-service/tests/test_schema_validation.py` | 9 tests |
| Data-quality CI | `services/training-service/tests/test_data_quality.py` | 12 tests |
| Tier baseline tests | `scripts/tests/sovereign-week1-tier-baseline.test.mjs` | 13 tests |
| Tier baseline table | `docs/en/17-benchmark-baseline-table.md` | versioned, reproducible |
| CLI + runtime contract | `docs/en/18-cli-runtime-contract.md` | example payloads, version tags |
| Tier fixture files | `scripts/tests/fixtures/tier-*.json` | 4 files, 10 samples each |
| Baseline JSON artifacts | `scripts/tests/fixtures/baseline-tier-*.json` | 4 files |
| Windows teardown fix | `services/training-service/training_data/test_store.py` | `PermissionError` safe |

Git commit: `ba15bd4` — `feat(telemetry): implement KPI §3.1/§3.2 instrumentation — inference lifecycle + completion envelope`

---

## 5. Demo Runbook (Day 5)

### 5.1 Runtime Health Check

```bash
node scripts/sovereign-week1-runtime-check.mjs --vram 8GB
```

Expected output:
```
Sovereign Coder — Runtime Check
Host: 127.0.0.1:11434
Status: reachable
...
```

### 5.2 Inference Benchmark

```bash
node scripts/sovereign-week1-benchmark.mjs \
  --tier 12GB \
  --file scripts/tests/fixtures/tier-b-12gb-samples.json
```

Expected:
```
Avg first-token latency: 293 ms
Avg throughput: 52 tps
Latency target (500 ms): PASS
Throughput target (30 tps): PASS
```

### 5.3 Training Service Health

```bash
curl http://127.0.0.1:8001/health
```

Expected:
```json
{ "status": "ok", "version": "0.1.0", "database_ready": true }
```

### 5.4 Log a Completion Event (curl)

```bash
curl -X POST http://127.0.0.1:8001/api/v1/training/event \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "completion_accepted",
    "event_version": "1.0",
    "correlation_id": "demo-corr-001",
    "session_id": "demo-sess",
    "event_type": "completion_accepted",
    "prompt": "def hello():",
    "completion": " return \"world\"",
    "language": "python",
    "accepted_boolean": true,
    "completion_type": "inline",
    "first_token_latency_ms": 293.0,
    "tokens_per_second": 52.0
  }'
```

Expected:
```json
{ "event_id": "<uuid>", "created_at": "2026-04-03T..." }
```

### 5.5 Training Stats

```bash
curl http://127.0.0.1:8001/api/v1/training/stats
```

### 5.6 Full Python CI Run

```bash
cd services/training-service
.\venv\Scripts\python -m pytest -o addopts='' training_data/test_store.py tests/ -v
# Expected: 50 passed
```

### 5.7 Full TypeScript CI Run

```bash
cd apps/desktop && npm test
# Expected: 781 passed
```

---

## 6. Known Issues (carry to Week 2)

| # | Severity | Description | Owner | Due |
|---|---|---|---|---|
| W1-01 | Medium | Tier A 6GB throughput 28 tok/s < 30 tok/s floor — evaluate Q3_K_S quant | Platform Lead | W2-Day3 |
| W1-02 | Low | `finetune/job_manager.py` — 35 deprecation warnings (`datetime.utcnow`, `model.dict()`) | Platform Eng | W2-Day2 |
| W1-03 | Low | Tier A 6GB alert threshold in spec §6 is aspirational (30 tok/s); recommend updating to 25 tok/s | Product | W2-Day1 |

---

## 7. Week 2 Entry Criteria Check

Per `docs/en/12-prd-v2-week-2-execution-board.md §2 Inputs from Week 1`:

| Input Expected by Week 2 | Status |
|---|---|
| Validated hardware profile table and compatibility findings | ✅ `docs/en/17-benchmark-baseline-table.md` |
| Completion event payload examples and schema checks | ✅ `docs/en/18-cli-runtime-contract.md §2.2` |
| CLI contract samples for model list, switch, and completion | ✅ `docs/en/18-cli-runtime-contract.md §1` |
| Prioritized blocker list with severity and ownership | ✅ Section 6 above + `docs/en/19-week-2-handoff.md` |
