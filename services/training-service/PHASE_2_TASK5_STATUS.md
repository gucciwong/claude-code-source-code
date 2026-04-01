# Phase 2 Task 5 - Desktop & VSCode Integration

**Status**: SCAFFOLDED & READY FOR WIRING  
**Date**: April 2, 2026  

---

## Overview

Task 5 integrates the training pipeline into the desktop and VSCode applications, enabling:

- ✅ **Training Status Panel** (Desktop) — Show current training progress
- ✅ **Model Selector** (Desktop Status Bar) — Switch active models
- ✅ **Completion Event Collection** — Auto-log training data from both apps
- ✅ **VSCode Status Bar Integration** — Show active model version
- ✅ **Training Dashboard** (Desktop) — View version history

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     User Interactions                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Desktop App                           VSCode Extension        │
│  ├─ Chat completion               ├─ Inline completion        │
│  ├─ Code generation               ├─ Function completion      │
│  └─ Agent tasks                   └─ Refactoring suggestions   │
│       │                                    │                   │
│       └────→ [Completion Event] ←──────────┘                   │
│              (sent to training service)                        │
│                    │                                           │
│                    ↓                                           │
│      ┌────────────────────────────┐                           │
│      │  Training Service          │                           │
│      ├────────────────────────────┤                           │
│      │ POST /event                │  ← Collection hook        │
│      │ GET /status                │  ← Status for UI          │
│      │ GET /version/{model_id}    │  ← Model info for UI      │
│      │ GET /versions/{model_id}   │  ← History for dashboard  │
│      └────────────────────────────┘                           │
│              │                                                │
│              ├─→ Data Collection (Task 1)                     │
│              ├─→ Training Loop (Task 2)                       │
│              ├─→ Benchmarking (Task 3)                        │
│              └─→ Model Registry (Task 4)                      │
│                                                                 │
│      ┌────────────────────────────┐                           │
│      │  Desktop UI Components     │                           │
│      ├────────────────────────────┤                           │
│      │ TrainingStatusPanel        │  ← Shows status           │
│      │ VersionHistoryPanel        │  ← Shows versions         │
│      │ ModelSelectorDropdown      │  ← Switch versions        │
│      └────────────────────────────┘                           │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Training Service Client (`client.py`)

**Purpose:** Bridge between frontend and training service.

**Key Methods:**

```python
client = TrainingServiceClient("http://localhost:8000")

# Log a completion event
await client.log_completion_event(
    prompt="def add(",
    completion="a, b):\n    return a + b",
    language="python",
    metadata={"model": "mistral-7b", "latency_ms": 234}
)

# Get training status
status = await client.get_training_status()
# {
#   "model_id": "mistral-7b",
#   "active_cycle": "quick",
#   "quick_train_count": 25,
#   "next_full_train_in": 23,
# }

# Get model version
version = await client.get_model_version("mistral-7b")
# {
#   "version_id": "v_1712149200",
#   "status": "production",
#   "quality_score": 0.92,
# }
```

**Features:**
- ✅ Async/await interface
- ✅ Error handling & timeout protection
- ✅ Automatic serialization
- ✅ Singleton pattern for efficient reuse

---

### 2. UI Integration Endpoints (main.py)

**New Endpoints Added:**

#### GET /api/v1/training/status
Get current training orchestrator status for UI display.

**Response:**
```json
{
  "model_id": "mistral-7b",
  "active_cycle": "quick",
  "quick_train_count": 25,
  "last_quick_train": "2026-04-02T12:30:00",
  "next_full_train_in": 23,
  "current_best_adapter": "mistral-7b_quick_24",
  "is_training": true,
  "estimated_time_remaining_minutes": 45
}
```

**Usage (Desktop):**
```typescript
const status = await trainingClient.get_training_status()
if (status.is_training) {
  // Show progress indicator
  progressBar.update(
    progress: (48 - status.next_full_train_in) / 48,
    text: `Quick train ${status.quick_train_count}/48`
  )
}
```

#### GET /api/v1/training/version/{model_id}
Get current active model version with quality metrics.

**Response:**
```json
{
  "version_id": "v_1712149200",
  "adapter_id": "mistral-7b_full_0",
  "status": "production",
  "quality_score": 0.92,
  "promoted_at": "2026-04-02T14:00:00",
  "benchmark_results": {
    "humaneval_pass_rate": 0.45,
    "mbpp_pass_rate": 0.85
  }
}
```

**Usage (VSCode Status Bar):**
```typescript
const version = await trainingClient.get_model_version("mistral-7b")
statusBarItem.text = `$(symbol-method) mistral-7b v${version.version_id.split("_")[1]}`
statusBarItem.tooltip = `Quality: ${(version.quality_score * 100).toFixed(0)}%`
```

#### GET /api/v1/training/versions/{model_id}
Get version history for dashboard display.

**Response:**
```json
[
  {
    "version_id": "v_1712149200",
    "created_at": "2026-04-02T14:00:00",
    "action": "publish",
    "status": "production",
    "quality_score": 0.92
  },
  {
    "version_id": "v_1712148000",
    "created_at": "2026-04-02T13:00:00",
    "action": "publish",
    "status": "staging",
    "quality_score": 0.88
  }
]
```

**Usage (Dashboard):**
```typescript
const versions = await trainingClient.get_version_history("mistral-7b", 5)
render(<VersionTimeline versions={versions} />)
```

---

### 3. Data Collection Integration

**Desktop App (Chat Component):**

```typescript
// apps/desktop/src/renderer/components/screens/Chat.tsx
import { useTrainingService } from '@/hooks/useTrainingService'

function ChatScreen() {
  const { logCompletion } = useTrainingService()
  
  async function handleAcceptCompletion(completion: string) {
    // Send to training service
    await logCompletion({
      prompt: currentPrompt,
      completion,
      language: "python", // Auto-detect from context
      metadata: {
        model: "mistral-7b",
        latency_ms: completionTime,
        temperature: 0.7,
      }
    })
    
    // Add to chat
    addMessage(completion)
  }
  
  return (
    <div>
      {/* Chat UI */}
      <button onClick={() => handleAcceptCompletion(generatedCode)}>
        ✓ Accept
      </button>
    </div>
  )
}
```

**VSCode Extension (Inline Completion Provider):**

```typescript
// apps/vscode-extension/src/provider/InlineCompletionProvider.ts
import { trainingClient } from '../trainingClient'

class InlineCompletionProvider implements vscode.InlineCompletionItemProvider {
  async provideInlineCompletionItems(document, position, context) {
    // Get completion
    const completion = await this.generateCompletion(document, position)
    
    // Return as inline completion
    return [
      new vscode.InlineCompletionItem(
        completion,
        new vscode.Range(position, position)
      )
    ]
  }
  
  // Hook into acceptance (via editor.action.* command)
  async handleAccept(document, text) {
    // Log to training service
    await trainingClient.logCompletion({
      prompt: getPromptContext(document, position),
      completion: text,
      language: document.languageId,
      metadata: {
        filename: document.fileName,
        model: "mistral-7b",
      }
    })
  }
}
```

---

### 4. Desktop Components (Scaffolded)

#### TrainingStatusPanel

```typescript
// apps/desktop/src/renderer/components/common/TrainingStatusPanel.tsx
import { useTrainingStore } from '@/store/trainingStore'

function TrainingStatusPanel() {
  const { trainingStatus, refreshStatus } = useTrainingStore()
  
  // Auto-refresh every 10 seconds
  useEffect(() => {
    refreshStatus()
    const interval = setInterval(refreshStatus, 10000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4">
      <h3>Training Status</h3>
      {trainingStatus?.is_training ? (
        <>
          <ProgressBar
            progress={(48 - trainingStatus.next_full_train_in) / 48}
          />
          <div className="text-sm text-text-secondary">
            Quick train {trainingStatus.quick_train_count}/48
          </div>
          <div className="text-xs text-text-muted">
            Next full cycle in {trainingStatus.next_full_train_in} × 10min
          </div>
        </>
      ) : (
        <div className="text-text-secondary">Training idle</div>
      )}
    </div>
  )
}
```

#### VersionHistoryPanel

```typescript
// apps/desktop/src/renderer/components/common/VersionHistoryPanel.tsx
function VersionHistoryPanel() {
  const [versions, setVersions] = useState([])
  
  useEffect(() => {
    loadVersionHistory()
  }, [])
  
  async function loadVersionHistory() {
    const hist = await trainingClient.get_version_history("mistral-7b", 5)
    setVersions(hist)
  }
  
  return (
    <div>
      <h3>Version History</h3>
      {versions.map(v => (
        <div key={v.version_id} className="py-2 border-b">
          <div className="flex justify-between">
            <span className="font-mono text-sm">{v.version_id}</span>
            <span className={`text-xs px-2 py-1 rounded ${
              v.status === 'production' ? 'bg-green-500/20 text-green-400' :
              v.status === 'staging' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {v.status}
            </span>
          </div>
          <div className="text-xs text-text-muted">
            Quality: {(v.quality_score * 100).toFixed(0)}% • {v.created_at}
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## Integration Checklist

### Task 5a: Desktop App
- [x] Create TrainingServiceClient (Python → async)
- [x] Add UI status endpoints to FastAPI
- [ ] Implement TrainingStatusPanel component
- [ ] Implement VersionHistoryPanel component
- [ ] Wire Chat component to log completion events
- [ ] Add training status to Dashboard screen
- [ ] Test end-to-end (completion → collection → visible in stats)

### Task 5b: VSCode Extension
- [ ] Create TrainingServiceClient (TypeScript)
- [ ] Implement inline completion acceptance hook
- [ ] Add status bar item showing model version
- [ ] Log completions from inline provider
- [ ] Add "Training Status" sidebar panel
- [ ] Test acceptance event collection

### Task 5c: Completion Event Collection
- [ ] Desktop Chat messages → post /api/v1/training/event
- [ ] VSCode inline completions → post /api/v1/training/event
- [ ] Desktop agent tasks → post /api/v1/training/task  
- [ ] Verify events appear in /api/v1/training/stats

---

## Testing Flow

**E2E Test Scenario:**

```
1. User writes prompt in Chat
2. Model generates completion
3. User clicks "Accept"
   ↓
4. Event logged to training service
   - prompt, completion, language, metadata
   - automatically sanitized, validated
   ↓
5. StatsPanel updates (+ new event)
6. After 10 min: quick train triggered
   - Uses incremental data
   - Benchmarks on 50 MBPP problems
   - If pass rate > threshold: save adapter
   ↓
7. After 8 hours: full train cycle
   - Trains on all collected data
   - Benchmarks on HumanEval + MBPP
   - If >1% improvement: publish to registry
   ↓
8. VersionHistoryPanel shows new version
9. StatusBar updates with new quality score
```

---

## Files Summary

| File | Purpose |
|------|---------|
| client.py | Python client for training service |  
| main.py (updated) | 3 new API endpoints for UI |
| PHASE_2_TASK5_STATUS.md | This document |

**Code Changes:**
- +150 lines (Python client)
- +100 lines (API endpoints in main.py)

---

## Next Steps

**Before Task 6 (Documentation):**

1. **Wire TrainingServiceClient into Python backend** → Status endpoint needs actual orchestrator instance
2. **Build React components** (TrainingStatusPanel, VersionHistoryPanel)
3. **Integrate collection hooks** into Chat + inline completion providers
4. **Test E2E flow** — completion acceptance → data collection → training cycle → UI update

**Estimated Effort:**
- Desktop integration: 1-2 days
- VSCode integration: 1 day
- Testing & fixes: 0.5 days
- **Total Task 5: ~3-4 days**

---

## Summary

**Phase 2 Task 5 (UI Integration) is SCAFFOLDED.**

✅ **Delivered:**
- TrainingServiceClient (async Python)
- 3 UI integration endpoints in FastAPI
- Desktop component skeletons
- VSCode integration pattern

🔄 **Ready for:**
- Component implementation (React)
- Collection hook wiring
- E2E testing

📋 **Next:** Task 6 (Documentation & Deployment)

---

**Phase 2 Progress:**
- Task 1: Training Data Collection ✅
- Task 2: QLoRA Pipeline ✅
- Task 3: Benchmark Suite ✅
- Task 4: Model Registry ✅
- Task 5: UI Integration 🔄 (scaffolded)
- Task 6: Documentation & Deployment 📋
