# Training Service - Quick Reference

## ✅ Service Running

**Endpoint:** http://localhost:8001  
**Status:** ✓ Online and responding

---

## Health Check

### Using Python
```bash
python -c "import urllib.request, json; r = urllib.request.urlopen('http://localhost:8001/health'); print(json.loads(r.read().decode()))"
```

### Using PowerShell
```powershell
Invoke-WebRequest -Uri http://localhost:8001/health -UseBasicParsing | Select-Object -ExpandProperty Content
```

### Response
```json
{
  "status": "degraded",
  "version": "0.1.0",
  "database_ready": false
}
```

> **Note:** `degraded` and `database_ready: false` on first run is normal - database is initializing on first request.

---

## API Endpoints

### Get Training Statistics
```bash
python -c "import urllib.request, json; r = urllib.request.urlopen('http://localhost:8001/api/v1/training/stats'); print(json.dumps(json.loads(r.read().decode()), indent=2))"
```

### Log a Completion Event
```bash
python << 'EOF'
import urllib.request, json

data = json.dumps({
    "prompt": "def hello():",
    "completion": "    print('Hello')",
    "event_type": "completion_accepted",
    "language": "python",
    "source": "test"
}).encode('utf-8')

req = urllib.request.Request(
    'http://localhost:8001/api/v1/training/event',
    data=data,
    headers={'Content-Type': 'application/json'},
    method='POST'
)
response = urllib.request.urlopen(req)
print(json.loads(response.read().decode()))
EOF
```

### Get Training Status
```bash
python -c "import urllib.request, json; r = urllib.request.urlopen('http://localhost:8001/api/v1/training/status'); print(json.dumps(json.loads(r.read().decode()), indent=2))"
```

---

## Troubleshooting

### Service Not Responding?

**Check if running:**
```bash
Get-Process python
```

**Restart service:**
```bash
cd services/training-service
.\venv\Scripts\python -m uvicorn main:app --reload --port 8001
```

**Different port?**
Check `.env` file in `services/training-service/`:
```bash
cat .env | findstr PORT
```

---

## Service Structure

```
http://localhost:8001/
├── /health                           # Service status
├── /api/v1/training/
│   ├── event (POST)                  # Log completion event
│   ├── stats (GET)                   # Training statistics
│   ├── status (GET)                  # Orchestrator status
│   ├── version/{model_id} (GET)      # Active model version
│   └── versions/{model_id} (GET)     # Version history
└── /docs                             # API documentation (Swagger UI)
```

---

## Next Steps

### 1. Send Test Data
```bash
# Generate 10 test completions
python << 'EOF'
import urllib.request, json

for i in range(10):
    data = json.dumps({
        "prompt": f"def test_{i}():",
        "completion": f"    return {i}",
        "event_type": "completion_accepted",
        "language": "python"
    }).encode()
    
    req = urllib.request.Request(
        'http://localhost:8001/api/v1/training/event',
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    urllib.request.urlopen(req)
print("✓ 10 test events logged")
EOF
```

### 2. Check Stats
```bash
python -c "import urllib.request, json; r = urllib.request.urlopen('http://localhost:8001/api/v1/training/stats'); print(json.dumps(json.loads(r.read().decode()), indent=2))"
```

### 3. Monitor Database
```bash
cd services/training-service
sqlite3 data/training.db
> SELECT COUNT(*) FROM completion_events;
> .exit
```

---

## Configuration

Edit `.env` in `services/training-service/`:

```bash
# Service
PORT=8001
LOG_LEVEL=INFO  # DEBUG for verbose logging

# Training schedule
QUICK_TRAIN_INTERVAL_MINUTES=10
FULL_TRAIN_EVERY_N_QUICK=48  # 8 hours

# Data retention
TRAINING_DATA_RETENTION_DAYS=90

# Benchmarks
HUMANEVAL_LIMIT=10  # For faster testing
MBPP_LITE_LIMIT=20
```

---

## Full Documentation

- [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) — Complete setup & development guide
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) — Production deployment
- [PHASE_2_OVERVIEW.md](./PHASE_2_OVERVIEW.md) — System architecture

---

**Ready to test!** Start sending data and monitor training progress.
