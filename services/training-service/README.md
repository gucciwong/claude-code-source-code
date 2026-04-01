# Sovereign Coder Training Service

Phase 2 backend for model fine-tuning and self-improvement pipeline.

## Overview

The Training Service handles:
- **Data Collection**: Capture completion events and task trajectories from desktop/VSCode
- **Data Storage**: SQLite backend with automatic sanitization
- **QLoRA Fine-tuning**: Lightweight model adaptation on user data
- **Model Registry**: Version management and rollback
- **Benchmarking**: HumanEval, MBPP, custom evaluation
- **Orchestration**: 10-minute quick loops + 8-hour full training cycles

## Quick Start

### Option 1: Docker Compose

```bash
# Start training service + Redis (from project root)
docker-compose up training-service

# Service available at http://localhost:8001
# Docs at http://localhost:8001/docs
```

### Option 2: Local Python

```bash
# Install dependencies
cd services/training-service
python3.10 -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Run service
python -m uvicorn main:app --reload --port 8001
```

## API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "database_ready": true
}
```

### Log Completion Event

```bash
POST /api/v1/training/event
Content-Type: application/json

{
  "event_type": "completion_accepted",
  "prompt": "def factorial(n):",
  "completion": " return n * factorial(n-1)",
  "language": "python",
  "file_path": "src/math.py",
  "model_id": "mistral-7b",
  "tokens_generated": 15
}
```

Response:
```json
{
  "event_id": "uuid",
  "created_at": "2026-04-02T12:00:00"
}
```

### Log Task Execution

```bash
POST /api/v1/training/task
Content-Type: application/json

{
  "task_id": "task-123",
  "task_description": "Implement binary search",
  "task_type": "feature_impl",
  "steps": [
    {"action": "read_spec", "result": "understood requirements"},
    {"action": "write_code", "result": "wrote binary_search"},
    {"action": "run_tests", "result": "all tests passed"}
  ],
  "outcome": "success",
  "final_code": "def binary_search(arr, x): ...",
  "execution_time_seconds": 45.2
}
```

### Get Training Statistics

```bash
GET /api/v1/training/stats
```

Response:
```json
{
  "total_events": 1250,
  "completion_accepted": 920,
  "completion_rejected": 180,
  "completion_edited": 150,
  "task_completed_total": 52,
  "task_success_rate": 0.87,
  "recent_events_24h": 125
}
```

### Export Training Data

```bash
GET /api/v1/training/export?format=jsonlines&max_samples=5000&language=python
```

Formats: `jsonlines`, `csv`, `parquet`

Returns: Streaming response with training data

## Configuration

Create `.env` file (or copy from `.env.example`):

```bash
# Service
PORT=8001
LOG_LEVEL=INFO

# Database
DB_PATH=./data/training.db

# Training
QUICK_TRAIN_INTERVAL_MINUTES=10
FULL_TRAIN_THRESHOLD_ITERATIONS=48

# Benchmarking
HUMANEVAL_NUM_PROBLEMS=30
MBPP_NUM_PROBLEMS=50
```

## Data Security

- **Automatic Sanitization**: Secrets (API keys, passwords, tokens), PII (emails), and URLs are automatically redacted
- **No uploads**: Data stays local by default
- **Opt-in export**: Manual export required to share data
- **Retention Policy**: Old events cleaned up after 90 days (configurable)

## Testing

```bash
# Run all tests
pytest

# Run specific test
pytest training_data/test_store.py::test_add_completion_event -v

# With coverage
pytest --cov=training_data --cov-report=html
```

## Architecture

```
Training Service
├── Data Collection (FastAPI endpoints)
│   ├── Completion events
│   ├── Task trajectories
│   └── Statistics + export
│
├── Data Storage (SQLite)
│   ├── CompletionEvent table
│   ├── TaskTrajectory table
│   └── TrainingRun table
│
├── (Phase 2 Task 2) Training Pipeline
│   ├── QLoRA trainer
│   ├── 10-min quick loop
│   └── 8-hour upgrade cycle
│
├── (Phase 2 Task 3) Benchmarks
│   ├── HumanEval runner
│   ├── MBPP runner
│   └── Custom evaluator
│
└── (Phase 2 Task 4) Model Registry
    ├── Version tracking
    ├── Adapter storage
    └── Rollback chain
```

## Example Integration (Desktop App)

```typescript
// apps/desktop/src/renderer/hooks/useTrainingService.ts

import { useCallback } from 'react'

export function useTrainingService() {
  const baseUrl = 'http://localhost:8001/api/v1'

  const logCompletion = useCallback(async (
    eventType: string,
    prompt: string,
    completion: string,
    language: string,
  ) => {
    const response = await fetch(`${baseUrl}/training/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        prompt,
        completion,
        language,
        model_id: 'mistral-7b',
      }),
    })
    return response.json()
  }, [])

  const getStats = useCallback(async () => {
    const response = await fetch(`${baseUrl}/training/stats`)
    return response.json()
  }, [])

  return { logCompletion, getStats }
}
```

## Performance Notes

- **First request latency**: ~50ms (DB startup)
- **Subsequent requests**: ~5-10ms per event
- **Database size**: ~100 bytes per completion event
- **Retention**: 90 days = ~11GB disk at high volume (1000 events/day)

## Troubleshooting

**Port already in use:**
```bash
# Find process using port 8001
lsof -i :8001
# Kill it
kill -9 <PID>
```

**Database locked:**
```bash
# Remove lock file
rm data/training.db-lock
```

**Disk full:**
```bash
# Manual cleanup (delete events >30 days old)
POST /api/v1/training/cleanup?days_old=30
```

## Next Steps (Phase 2)

- [Task 2](../../docs/plans/2026-04-02-phase2-training-implementation-plan.md#task-2-qloratraining-pipeline): QLoRA Training Pipeline
- [Task 3](../../docs/plans/2026-04-02-phase2-training-implementation-plan.md#task-3-benchmark-suitehuman-eval--mbpp): Benchmark Suite
- [Task 4](../../docs/plans/2026-04-02-phase2-training-implementation-plan.md#task-4-model-registry--versioning): Model Registry
- [Task 5](../../docs/plans/2026-04-02-phase2-training-implementation-plan.md#task-5-desktop--vscode-integration): Desktop & VSCode Integration

## License

Proprietary - Sovereign AI Labs
