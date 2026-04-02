# Local Development - Training Service

> Phase 2 training infrastructure is running and ready for development.

---

## ✅ Status

**Training Service:** Running ✓
- **URL:** http://localhost:8001
- **Auto-reload:** Enabled (files auto-reload on change)
- **Database:** SQLite (created automatically)

---

## 🚀 Quick Start (Already Done)

```bash
# Setup (one-time)
cd services/training-service
python -m venv venv
.\venv\Scripts\activate
pip install fastapi uvicorn python-dotenv pydantic sqlalchemy

# Run (development)
.\venv\Scripts\python -m uvicorn main:app --reload --port 8001

# Verify
python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8001/health').read().decode())"
```

---

## 📝 Working with the Service

### Check Status

```bash
# Health check
python -c "import requests; print(requests.get('http://localhost:8001/health').json())"

# Statistics
python -c "import requests; print(requests.get('http://localhost:8001/api/v1/training/stats').json())"
```

### Send Test Data

```python
import requests
import json

# Log a completion event
response = requests.post(
    'http://localhost:8001/api/v1/training/event',
    json={
        'prompt': 'def hello():',
        'completion': '    print("Hello, World!")',
        'event_type': 'completion_accepted',
        'metadata': {'language': 'python', 'source': 'test'}
    }
)
print(response.json())
```

### Test Benchmarks

```bash
# Run quick test with HumanEval (10 problems)
python -c """
from benchmarks.humaneval_runner import HumanEvalRunner
runner = HumanEvalRunner(limit=5)
results = runner.run()
print(f'Pass rate: {results.pass_rate}')
"""
```

---

## 🛠️ Common Tasks

### Enable Full ML Stack (Optional)

For actual model fine-tuning:

```bash
pip install torch transformers peft bitsandbytes unsloth accelerate

# Verify
python -c "from training.qla_trainer import QLORATrainer; print('✓ ML stack ready')"
```

### Reset Database

Start fresh:

```bash
rm data/training.db
# Service will recreate on next request
```

### View Database

```bash
sqlite3 data/training.db
> SELECT COUNT(*) FROM completion_events;
> SELECT * FROM completion_events LIMIT 5;
> .exit
```

### Monitor Logs

```bash
# Start service with debug logging
# Edit .env:
LOG_LEVEL=DEBUG

# Then restart service - you'll see more detailed output
```

---

## 🔧 Known Issues & Fixes

### Issue: `No module named uvicorn`
**Solution:** Install core dependencies:
```bash
pip install fastapi uvicorn python-dotenv pydantic sqlalchemy
```

### Issue: `Attribute name 'metadata' is reserved`
**Solution:** Already fixed ✓
- Column renamed to `event_metadata`
- SQLAlchemy 2.0+ compatibility maintained

### Issue: Build failures (pyarrow, datasets)
**Solution:** Commented out optional deps in `requirements.txt`
- Install separately if needed: `pip install pyarrow datasets`
- Core service works without them

---

## 📂 File Organization

```
services/training-service/
├── venv/                     # Python virtual environment
├── data/
│   ├── training.db          # SQLite (auto-created)
│   ├── models/              # Model cache
│   └── versions/            # Published versions
├── main.py                  # FastAPI app (entry point)
├── client.py               # Python client
├── requirements.txt        # Core + optional dependencies
├── .env                    # Local config
├── training_data/          # Data collection module
├── training/               # Fine-tuning module
├── benchmarks/             # Benchmark runners
├── registry/               # Model versioning
└── LOCAL_DEVELOPMENT.md    # This file
```

---

## 📚 Next Steps

### Desktop Integration
```bash
# 1. Open apps/desktop/.env
# 2. Set: VITE_TRAINING_SERVICE_URL=http://localhost:8001
# 3. Start: npm run dev (in apps/desktop)
# 4. Send completions from chat
```

### VSCode Integration
```bash
# 1. Open apps/vscode-extension/.env
# 2. Set: TRAINING_SERVICE_URL=http://localhost:8001
# 3. Press F5 to launch extension host
# 4. Accept inline completions to log events
```

### Run Tests

```bash
# Unit tests
pytest training_data/test_store.py -v

# All tests
pytest . -v
```

---

## 💡 Tips

- Service auto-reloads when code changes (live development)
- Database persists between restarts (in `data/training.db`)
- Check `main.py` for all available API endpoints
- Use `python -m venv venv` to recreate venv if needed

---

**Ready to develop!**

Visit: http://localhost:8001/docs (Swagger UI coming soon)
