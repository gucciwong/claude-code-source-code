# VSCode Extension Integration — Testing & Verification

Complete guide for end-to-end testing of the Sovereign Code Training VSCode extension.

## Prerequisites

- VSCode ≥ 1.85.0 (check: `Code → About Visual Studio Code`)
- Training service running on `http://localhost:8001`
- Node.js ≥ 18 (for building extension)
- Git (to clone/pull latest code)

## Part 1: Setup

### Step 1.1 — Start Training Service

**Terminal 1: Start training service**

```bash
cd services/training-service
python -m uvicorn main:app --reload --port 8001
```

**Verify running:**
```bash
curl http://localhost:8001/health
# Response: {"status": "ok"}
```

### Step 1.2 — Build VSCode Extension

**Terminal 2: Build extension**

```bash
cd extensions/sovereign-code-training
npm install
npm run build
```

**Check for errors:**
- Should see: `npm notice`
- Should NOT see: `error TS...` or `npm ERR`

If build fails:
```bash
# Clear cache and retry
rm -rf node_modules dist
npm install
npm run build
```

### Step 1.3 — Launch Extension Development Host

**Terminal 2 (after build completes): Launch VSCode extension host**

```bash
# Still in extensions/sovereign-code-training/
code --extensionDevelopmentPath=. --verbose
```

**What happens:**
1. New VSCode window opens (the "extension host")
2. VSCode loads the extension
3. Extension activates (check Output → "Sovereign Code Training")

**Check extension loaded:**
- Open VSCode Settings (`Cmd+,` / `Ctrl+,`)
- Search: "sovereign code"
- Should see 4 settings + extension listed in status bar (bottom right)

## Part 2: Verify Extension Functionality

### Step 2.1 — Check Status Bar

**In extension host window:**

Look at bottom right corner of status bar.

**Expected:**
- 🔴 If service running: `$(record) Training: ON (0)` (green)
- 🔴 If service down: `$(warning) Training: OFFLINE` (red)

If showing OFFLINE:
1. Verify Terminal 1 started training service
2. Verify no errors in service startup
3. Restart extension: `Cmd+Shift+P` → "Reload Window"

### Step 2.2 — Verify Configuration

**In extension host settings:**

1. Open Settings: `Cmd+,` / `Ctrl+,`
2. Search: "sovereign code training"
3. Check each setting:

| Setting | Expected Value | Notes |
|---------|---|---|
| `serviceUrl` | `http://localhost:8001` | Should match Terminal 1 port |
| `enabled` | `true` (checked) | Logging should be active |
| `logAcceptedOnly` | `true` (checked) | Log only accepted completions |
| `showStatusIndicator` | `true` (checked) | Status bar visible |

If any setting is wrong, fix it now before continuing tests.

### Step 2.3 — Test Status Bar Command

**In extension host:**

1. Click the status bar item (bottom right)
2. **Expected:** Modal showing training stats
   ```
   Total events: 0
   Accepted: 0
   Rejected: 0
   Edited: 0
   ```
   (Or current counts if service already logging)

3. If modal doesn't appear: Check service health
   ```bash
   curl http://localhost:8001/health
   ```

## Part 3: Test Completion Logging

### Step 3.1 — Create Test File

**In extension host window:**

1. `File → New File`
2. Select language: `Python`
3. Type test code:
   ```python
   def hello():
       print("Hello, World!")
   
   # Test second function
   def add(a, b):
   ```

### Step 3.2 — Test Manual Completion (Simulated)

Since VSCode inline completions come from language servers/extensions:

1. In the editor, create a position where completion would be useful
2. Type a code snippet manually (this simulates what inline completion would insert)
3. **Example:**
   ```python
   def greet(name):
       # Type: return f"Hello, {name}"
       # This simulates accepting an inline completion
   ```

4. Save file: `Cmd+S` / `Ctrl+S`

### Step 3.3 — Verify Event Logged

**Check status bar updated:**
- Before: `$(record) Training: ON (0)`
- After: `$(record) Training: ON (1)`

If count didn't increment:
1. Check Developer Console: `Cmd+Shift+J` / `Ctrl+Shift+J`
2. Look for errors prefixed with `[Training]`
3. Check service is still running (verify no crashes in Terminal 1)

### Step 3.4 — Verify in Training Service

**Terminal 3: Check training service received event**

```bash
curl http://localhost:8001/api/v1/training/stats

# Response should show:
# {
#   "total_events": 1,
#   "completion_accepted": 1,
#   "completion_rejected": 0,
#   "completion_edited": 0,
#   "task_completed_total": 0,
#   "task_success_rate": 0.0,
#   "recent_events_24h": 1
# }
```

**Expected:** `total_events` incremented to 1 or more

If not incrementing:
1. Check extension logs (Developer Console)
2. Check service logs (Terminal 1)
3. Verify network: `curl http://localhost:8001/health` should respond

## Part 4: Stress Testing

### Step 4.1 — Rapid Completions

**Test high-frequency logging:**

1. Open or create Python/JavaScript file
2. Type or paste multiple code blocks rapidly
3. Generate 10+ simulated completions in quick succession
4. Check status bar: `Training: ON (10+)`

**Expected:**
- Status bar updates show correct count
- No editor lag or freezes
- All events logged successfully

### Step 4.2 — Multiple File Types

**Test language variety:**

1. Create test files in different languages:
   - Python (`.py`)
   - JavaScript (`.js`)
   - TypeScript (`.ts`)
   - Go (`.go`)

2. In each file, make code changes

3. Check events in service:
   ```bash
   # Query events by language
   python << 'EOF'
   from training_data.models import CompletionEvent
   from sqlalchemy import create_engine
   from sqlalchemy.orm import Session
   
   engine = create_engine('sqlite:///data/training.db')
   with Session(engine) as session:
       events = session.query(CompletionEvent).all()
       languages = {}
       for e in events:
           languages[e.language] = languages.get(e.language, 0) + 1
       print(f"Languages: {languages}")
   EOF
   ```

**Expected:** Multiple languages represented in events

### Step 4.3 — Service Disconnection Recovery

**Test resilience when service is unavailable:**

1. Status bar shows: `Training: ON (N)`
2. Stop training service: **Ctrl+C in Terminal 1**
3. Wait 30 seconds for health check
4. Status bar should change to: `$(warning) Training: OFFLINE`
5. Restart training service:
   ```bash
   # In Terminal 1
   python -m uvicorn main:app --reload --port 8001
   ```
6. Wait 30 seconds for health check
7. Status bar should return to: `$(record) Training: ON (N)`

**Expected:**
- Editor never froze or showed errors
- Status automatically recovered
- Events still logged after recovery

## Part 5: Edge Cases

### Step 5.1 — Disable/Enable Logging

**Test toggle command:**

1. Open Command Palette: `Cmd+Shift+P` / `Ctrl+Shift+P`
2. Search: "toggle training"
3. Run: "Toggle Training Logging"
4. Status bar should show: `$(debug-pause) Training: OFF`
5. Run command again
6. Status bar should return to: `$(record) Training: ON`

**Expected:** Toggle works smoothly, no errors

### Step 5.2 — Configuration Changes

**Test dynamic settings updates:**

1. Open VSCode Settings: `Cmd+,`
2. Change service URL to invalid: `http://localhost:9999`
3. Reload window: `Cmd+Shift+P` → "Reload Window"
4. Status bar should show: `OFFLINE` (red)
5. Revert setting to `http://localhost:8001`
6. Status bar should return to: `ON` (green)

**Expected:** Settings changes reflected immediately (after reload)

### Step 5.3 — Same Event Idempotency

**Test duplicate event handling:**

1. Make a code change
2. Immediately save file twice: `Cmd+S` twice
3. Check service doesn't double-count:
   ```bash
   curl http://localhost:8001/api/v1/training/stats
   ```

**Expected:** Each event counted once (no duplicates)

## Part 6: Performance Testing

### Step 6.1 — Memory Usage

**Monitor extension memory:**

1. Activity Monitor (Mac) or Task Manager (Windows)
2. Find VSCode process running extension
3. Note memory before: ~200-300MB
4. Make 100+ code changes
5. Check memory after: Should not exceed ~400-500MB

**Expected:** No runaway memory growth

### Step 6.2 — Latency

**Test logging responsiveness:**

1. Time a code change: Start timer
2. Make code change in editor
3. Note timer: Should complete typing before logging starts
4. Check status bar updates within 1-2 seconds

**Expected:**
- Code changes feel responsive (< 50ms latency)
- Status bar updates within 1-2 seconds

## Part 7: Production Smoke Test

### Step 7.1 — Real Development Workflow

**Test realistic usage:**

1. Open a real project (not test files)
2. Work normally for 5+ minutes
3. Make real code changes and edits
4. Check status bar periodically

**Expected:**
- Event count increases (reflects real work)
- Status shows "ON" and healthy
- No interruptions to workflow

### Step 7.2 — Extended Session

**Test 30+ minute session:**

1. Keep extension running for 30+ minutes
2. Pause briefly to check:
   - Status bar still shows "ON"
   - Event count stopped growing during pause (correct)
   - Resume work → Event count resumes growing

**Expected:**
- No crashes or hangs
- Health check still working (every 30s)
- Consistent logging throughout session

## Part 8: Cleanup & Data Verification

### Step 8.1 — Export Collected Data

**Verify all data in database:**

```bash
cd services/training-service
python << 'EOF'
from training_data.models import CompletionEvent
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
import json

engine = create_engine('sqlite:///data/training.db')
with Session(engine) as session:
    events = session.query(CompletionEvent).all()
    print(f"Total events in database: {len(events)}")
    
    # Show first 3 events
    for i, event in enumerate(events[:3]):
        print(f"\nEvent {i+1}:")
        print(f"  ID: {event.id}")
        print(f"  Type: {event.event_type}")
        print(f"  Language: {event.language}")
        print(f"  Prompt: {event.prompt[:50]}...")
        print(f"  Completion: {event.completion[:50]}...")
EOF
```

**Expected:**
- Events database has N entries (= count shown in status bar)
- Each event has: id, prompt, completion, language, type

### Step 8.2 — Clear Test Data (Optional)

**To reset database:**

```bash
cd services/training-service
python << 'EOF'
from training_data.models import CompletionEvent
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

engine = create_engine('sqlite:///data/training.db')
with Session(engine) as session:
    session.query(CompletionEvent).delete()
    session.commit()
    print("Database cleared")
EOF
```

Then:
1. Reload VSCode: `Cmd+Shift+P` → "Reload Window"
2. Status bar should show: `Training: ON (0)`

## Troubleshooting During Tests

| Issue | Cause | Solution |
|-------|-------|----------|
| Status shows "OFFLINE" | Service not running | Start Terminal 1 service |
| Extension doesn't load | Build failed | `npm run build` in extension folder |
| Events not logging | Service URL wrong | Check settings (should be `localhost:8001`) |
| Editor freezes | Logging blocking | Check browser console for errors |
| Status bar empty | Extension not activated | `Cmd+Shift+P` → "Reload Window" |
| Database empty | Events not reaching service | Check Extension Console logs |

## Sign-Off Checklist

Once all tests pass, confirm:

- [ ] Status bar shows training status
- [ ] Service health check works (ON/OFFLINE)
- [ ] Completions logged to database
- [ ] Event count increments accurately
- [ ] No editor lag during logging
- [ ] Service recovery works (disconnect/reconnect)
- [ ] Multiple languages supported
- [ ] Settings changes apply correctly
- [ ] Performance is acceptable (< 500MB memory)
- [ ] 30+ minute session works without issues
- [ ] All events in database match status count

## Results

✅ **All tests passing** → Extension ready for distribution  
⚠️ **Some tests failing** → Debug + fix before deployment  

Document any issues found:
```
Issue: [description]
Steps to reproduce: [steps]
Expected: [expected behavior]
Actual: [actual behavior]
Environment: VSCode X.X.X, training service X.X.X
```

## Next Steps After Verification

1. **Package for distribution** → `npm run build && npx vsce package`
2. **Add to Marketplace** → Submit to VSCode Extensions Marketplace
3. **Set up auto-updates** → CI/CD pipeline for releases
4. **Monitor telemetry** → Track extension usage and performance
5. **Gather user feedback** → Iterate on features
