# Desktop App Training Service Integration

## Setup

### 1. Configure Environment

Create or update `apps/desktop/.env`:

```bash
VITE_TRAINING_SERVICE_URL=http://localhost:8001
VITE_ENABLE_TRAINING_LOGGING=true
```

Example: Copy from `.env.example` and modify.

### 2. Verify Training Service Running

```bash
# Terminal 1: Start training service
cd services/training-service
.\venv\Scripts\python -m uvicorn main:app --reload --port 8001

# Verify it's running
curl http://localhost:8001/health
```

### 3. Integration in Chat Component

#### Step 1: Import Hook in Chat.tsx

```tsx
import { useTrainingService } from '../hooks/useTrainingService'
```

#### Step 2: Use Hook in Chat Component

```tsx
export function Chat() {
  const { logCompletion, isServiceAvailable, eventCount } = useTrainingService()
  // ... rest of component
}
```

#### Step 3: Log on Completion Acceptance

When user clicks "Accept" on a completion, call:

```tsx
const handleAcceptCompletion = async (prompt: string, completion: string, language: string) => {
  // Show to user
  addMessage({ role: 'assistant', content: completion })
  
  // Log to training service (async, non-blocking)
  if (isServiceAvailable) {
    logCompletion({
      prompt,
      completion,
      event_type: 'completion_accepted',
      language,
      model_id: 'mistral-7b', // or current model
    }).catch(err => console.error('Training log failed:', err))
  }
}
```

#### Step 4: Show Training Status (Optional)

Display in status bar or footer:

```tsx
<div className="text-sm text-gray-500">
  {isServiceAvailable ? (
    <>
      ✓ Training: {eventCount} events logged
      {isTraining && ' (training...)'}
    </>
  ) : (
    '✗ Training service offline'
  )}
</div>
```

---

## API Reference

### useTrainingService Hook

```typescript
const {
  // Methods
  logCompletion,    // (payload) => Promise<{ event_id, created_at }>
  getStatus,        // () => Promise<TrainingStatus | null>
  getStats,         // () => Promise<TrainingStats | null>

  // State
  isServiceAvailable,  // boolean - service reachable?
  isTraining,          // boolean - training in progress?
  trainingStatus,      // TrainingStatus | null
  eventCount,          // number - total events logged
} = useTrainingService()
```

### logCompletion Payload

```typescript
{
  prompt: string                              // Code before cursor
  completion: string                          // Suggested completion
  event_type: 'completion_accepted'           // Required event type
    | 'completion_rejected'
    | 'completion_edited'
  language?: string                           // 'python', 'javascript', etc.
  model_id?: string                           // Which model generated it
  temperature?: number                        // Generation temperature
  top_p?: number                              // Top-p sampling param
  [key: string]: unknown                      // Any custom fields
}
```

---

## Testing Integration

### 1. Start Services

```bash
# Terminal 1: Training service
cd services/training-service
.\venv\Scripts\python -m uvicorn main:app --reload --port 8001

# Terminal 2: Desktop app
cd apps/desktop
npm run dev
```

### 2. Generate Completions

In Chat:
1. Send a message (triggers AI completion)
2. Click "Accept" on the suggestion
3. Check browser console: Should see training event logged
4. Query training stats:

```powershell
Invoke-RestMethod -Uri http://localhost:8001/api/v1/training/stats | ConvertTo-Json
```

Should show incremented `completion_accepted` count.

### 3. Monitor

```powershell
# Watch event count grow
for ($i = 0; $i -lt 10; $i++) {
    $stats = Invoke-RestMethod -Uri http://localhost:8001/api/v1/training/stats
    Write-Host "Events: $($stats.total_events)"
    Start-Sleep -Seconds 5
}
```

---

## Troubleshooting

### Training Service Not Available

**Error in browser console:**
```
[Training] Service not available, skipping event
```

**Fix:**
1. Verify service running: `curl http://localhost:8001/health`
2. Check `.env` has correct `VITE_TRAINING_SERVICE_URL`
3. Restart dev server: `npm run dev`

### CORS Issues

If browser shows CORS error, training service needs to allow Desktop origin.

Add to `services/training-service/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Desktop Vite dev port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Events Not Logging

1. Check browser console for errors
2. Verify `VITE_ENABLE_TRAINING_LOGGING=true` in `.env`
3. Check network tab: Request should be POST to `/api/v1/training/event`
4. Check training service logs for any errors

---

## Example: Full Chat Integration

```tsx
import { useTrainingService } from '../hooks/useTrainingService'

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const { logCompletion, isServiceAvailable, eventCount } = useTrainingService()

  const handleAccept = async (prompt: string, completion: string) => {
    // Add to chat UI
    setMessages(prev => [...prev, { role: 'assistant', content: completion }])

    // Log to training service (fire-and-forget)
    if (isServiceAvailable) {
      logCompletion({
        prompt,
        completion,
        event_type: 'completion_accepted',
        language: 'python',
      }).catch(console.error)
    }
  }

  return (
    <div>
      {/* Chat messages */}
      {messages.map((msg, i) => (
        <div key={i}>{msg.content}</div>
      ))}

      {/* Status bar */}
      <footer className="text-sm">
        {isServiceAvailable && (
          <span>✓ Training: {eventCount} events</span>
        )}
      </footer>
    </div>
  )
}
```

---

## Next Steps

1. ✅ Services created: `trainingClient.ts`, `useTrainingService.ts`
2. ✅ Configuration: `.env.example` with training service URL
3. 📝 TODO: Update Chat.tsx to use hook
4. 📝 TODO: Update Training.tsx dashboard to show stats
5. 📝 TODO: Add tests for training integration

---

## Files Modified/Created

- `apps/desktop/.env.example` — Configuration template
- `apps/desktop/src/renderer/services/trainingClient.ts` — Service client (new)
- `apps/desktop/src/renderer/hooks/useTrainingService.ts` — React hook (new)
- `apps/desktop/src/renderer/screens/Chat.tsx` — TODO: Add hook usage
- `apps/desktop/src/renderer/screens/Training.tsx` — TODO: Show stats

---

**Ready for Chat component integration!**
