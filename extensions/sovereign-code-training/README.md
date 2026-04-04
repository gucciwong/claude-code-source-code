# Sovereign Code Training Logger — VSCode Extension

Automatically logs code completions from your editor to local training service for model fine-tuning.

## Features

✅ **Auto-logs completions** — Detects when code is accepted in editor and logs to training service  
✅ **Status indicator** — Real-time indicator in status bar showing logging status + event count  
✅ **Service health check** — Auto-detects if training service is available  
✅ **Non-blocking** — Never interferes with editor performance  
✅ **Configurable** — Enable/disable logging, set service URL  

## Installation

### From Source (Development)

```bash
# Clone repo
git clone <repo-url>
cd extensions/sovereign-code-training

# Install dependencies
npm install

# Build extension
npm run build

# Open in VSCode
# Extensions → Install from VSIX → select dist/extension.vsix
```

### From VSCode Marketplace (When Published)

Search for "Sovereign Code Training" in VSCode Extensions

## Setup

### 1. Start Training Service

```bash
# Terminal 1: Start training service
cd services/training-service
python -m uvicorn main:app --reload --port 8001
```

Verify service is running:
```bash
curl http://localhost:8001/health
# Response: {"status": "ok"}
```

### 2. Install Extension

- Open VSCode
- Go to Extensions: `Cmd+Shift+X` / `Ctrl+Shift+X`
- Search: "Sovereign Code Training"
- Click Install

### 3. Configure Service URL (Optional)

If service not on `localhost:8001`, update settings:

1. Open VSCode Settings: `Cmd+,` / `Ctrl+,`
2. Search: "sovereign code"
3. Update `sovereignCoder.training.serviceUrl`
4. Reload VSCode window

## Usage

### Auto-Logging (Default Behavior)

Simply code normally:

```python
# Type this...
def hello():

# Hit Ctrl+Space / Cmd+Space for completions
# Select one and press Tab or Enter
# ✅ Logged to training service automatically
```

### Manual Commands

| Command | Binding | Action |
|---------|---------|--------|
| Toggle Training Logging | `Cmd+Shift+T` | Enable/disable logging |
| View Training Stats | Click status bar | Show event count + stats |
| Open Dashboard | `Cmd+Shift+D` | View full training dashboard |

### Status Bar Indicator

**Status Bar (bottom right):**
- `$(record) Training: ON (42)` — Logging active, 42 events collected
- `$(debug-pause) Training: OFF` — Logging disabled
- `$(warning) Training: OFFLINE` — Service not reachable

Click to open training dashboard stats.

## Configuration

Open VSCode Settings (`Cmd+,` / `Ctrl+,`), search "sovereign code":

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `trainingServiceUrl` | string | `http://localhost:8001` | Training service endpoint |
| `enabled` | boolean | `true` | Enable/disable logging |
| `logAcceptedOnly` | boolean | `true` | Only log accepted completions |
| `showStatusIndicator` | boolean | `true` | Show status bar indicator |

## How It Works

```
┌─────────────────────┐
│  VSCode Editor      │
│  Code typed         │
└──────────┬──────────┘
           │
           ↓ (onDidChangeTextDocument)
┌─────────────────────────────────────┐
│ Detect completion acceptance        │
│ Extract: prompt, completion, lang   │
└──────────┬────────────────────────────┘
           │
           ↓ (async, fire-and-forget)
┌──────────────────────────────────────┐
│ trainingClient.logCompletionEvent()  │
│ HTTP POST to localhost:8001          │
└──────────┬──────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────┐
│ Training Service                     │
│ Store in SQLite                      │
└──────────────────────────────────────┘
           │
           ↓ (background)
┌──────────────────────────────────────┐
│ Training Pipeline                    │
│ Collect → Fine-tune → Evaluate       │
└──────────────────────────────────────┘
```

## Data Collected

For each accepted completion:
- **Prompt** — Code context before cursor
- **Completion** — Text that was inserted
- **Event Type** — `completion_accepted`
- **Language** — File language (Python, JavaScript, etc.)
- **File Path** — Where completion occurred
- **Line Number** — Location in file
- **Timestamp** — When collected

All data is **local** (stored in `services/training-service/data/training.db`) and never leaves your machine.

## Privacy & Security

✅ **Local-only** — No cloud upload, no telemetry  
✅ **Opt-in** — Extension must be installed + enabled  
✅ **Transparent** — View all collected data via `getStats()` API  
✅ **Deletable** — Clear all data with one command  

## Troubleshooting

### "Training: OFFLINE" in status bar

**Solution:**
1. Check training service is running:
   ```bash
   curl http://localhost:8001/health
   ```
2. If not running, start it:
   ```bash
   cd services/training-service
   python -m uvicorn main:app --reload --port 8001
   ```
3. Update service URL in settings if needed
4. Reload VSCode window: `Cmd+Shift+P` → "Reload Window"

### Completions not logging

**Solution:**
1. Check status bar indicator — should show "ON" (green)
2. Click status bar to view event count
3. Check browser console for errors: `Help → Toggle Developer Tools`
4. Verify service health:
   ```bash
   curl http://localhost:8001/api/v1/training/stats
   ```

### Extension won't load

**Solution:**
1. Check VSCode version ≥ 1.85.0
2. Check extension is installed: `Extensions → Installed`
3. Check for errors: `Help → About → Show Logs`
4. Try rebuilding: `npm run build`

## Advanced

### Disable for Specific Files

Add to `.vscode/settings.json`:
```json
{
  "sovereignCoder.training.excludePatterns": [
    "**/*.test.ts",
    "**/node_modules/**",
    "**/.git/**"
  ]
}
```

### Custom Service URL

For remote training service:
```json
{
  "sovereignCoder.training.serviceUrl": "http://192.168.1.100:8001"
}
```

### Check Logged Events

Query training database:
```bash
cd services/training-service
python -c "
from training_data.models import CompletionEvent
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

engine = create_engine('sqlite:///data/training.db')
with Session(engine) as session:
    events = session.query(CompletionEvent).limit(10).all()
    for e in events:
        print(f'{e.language}: {e.prompt[-30:]} → {e.completion[:30]}')
"
```

## Related

- 🖥️ **Desktop App Integration** — See `apps/desktop/TRAINING_INTEGRATION.md`
- 🔧 **Training Service** — See `services/training-service/README.md`
- 📚 **Full Documentation** — See `TRAINING_INTEGRATION.md` in root

## Status

✅ **Alpha Release** — Extension fully functional, ready for testing  
📊 **Features:** Auto-logging, stats display, health check, configurable  
🚀 **Next:** Marketplace submission, metrics dashboard, advanced filtering  

## Development

```bash
# Build
npm run build

# Watch mode (rebuild on change)
npm run watch

# Test
npm test

# Lint
npm run lint
```

## License

See LICENSE file in root repository

## Support

For issues or questions:
1. Check this README
2. Search existing issues
3. Create new issue with:
   - VSCode version
   - Extension version
   - Steps to reproduce
   - Browser console output
