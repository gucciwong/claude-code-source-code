# VSCode Extension Structure

```
extensions/sovereign-code-training/
├── src/
│   ├── extension.ts           # Main extension file + inline completion hook
│   └── services/
│       └── trainingClient.ts  # Training service client (axios-based)
├── dist/                      # Compiled output (gitignored)
├── package.json              # Extension metadata + dependencies
├── tsconfig.json             # TypeScript configuration
├── README.md                 # User documentation
├── DEVELOPMENT.md            # This file
└── Makefile                  # Build shortcuts
```

## Development Setup

```bash
# 1. Install dependencies
cd extensions/sovereign-code-training
npm install

# 2. Open VSCode development host
code --extensionDevelopmentPath=. --verbose

# 3. In new VSCode window:
#    - Open Developer Console: Cmd+Shift+J / Ctrl+Shift+J
#    - Run Extension: F5 (or Run menu → Start Debugging)

# 4. In original window, rebuild on changes:
npm run watch
```

## How the Extension Works

### Activation
1. VSCode starts
2. Extension activates on `onStartupFinished`
3. Status bar item created
4. Service health check runs
5. Text change listener registered

### Logging Flow
1. User types code + accepts completion (Tab/Enter)
2. `onDidChangeTextDocument` fires with text change
3. Extension detects completion (heuristic: text length > 5, no newlines)
4. Extracts context (prompt = prior 200 chars) + completion + metadata
5. Fire async POST to training service
6. Response ignored (logging never blocks editor)

### Health Check
1. Runs on startup
2. Runs every 30 seconds
3. Updates status bar color (green=healthy, red=offline)
4. Silent failure (never shows dialogs for background checks)

## Testing the Extension

### Manual Test (VSCode Development Host)

1. Start training service:
   ```bash
   cd services/training-service
   python -m uvicorn main:app --reload --port 8001
   ```

2. Start VSCode extension development host:
   ```bash
   cd extensions/sovereign-code-training
   npm run build
   code --extensionDevelopmentPath=.
   ```

3. In new VSCode window:
   - Create new Python file
   - Type: `def hello():`
   - Press Ctrl+Space for suggestions
   - Accept suggestion with Tab
   - Check training service received event:
     ```bash
     curl http://localhost:8001/api/v1/training/stats
     ```

4. Verify status bar shows event count incremented

### Unit Tests

```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

## Extension API Reference

### trainingClient.ts

```typescript
// Create client
const client = getTrainingClient('http://localhost:8001')

// Log completion
const response = await client.logCompletionEvent({
  prompt: 'def hello():',
  completion: '    print("hello")',
  event_type: 'completion_accepted',
  language: 'python',
  file_path: '/path/to/file.py',
  line_number: 42,
})
// response: { event_id: '...', created_at: '...' } or null

// Get stats
const stats = await client.getStats()
// stats: { total_events: 42, completion_accepted: 40, ... } or null

// Get status
const status = await client.getStatus()
// status: { is_training: false, current_model: null, ... } or null

// Health check
const healthy = await client.healthCheck()
// healthy: true or false
```

### extension.ts

Commands:
- `sovereignCoder.training.toggleLogging` — Toggle logging on/off
- `sovereignCoder.training.openDashboard` — Show stats dialog
- `sovereignCoder.training.logCompletion` — Manual log (not used yet)

Listeners:
- `onDidChangeTextDocument` — Detect completions
- `30s timer` — Health check

Status Bar:
- `$(record) Training: ON (42)` — Logging active
- `$(debug-pause) Training: OFF` — Disabled
- `$(warning) Training: OFFLINE` — Service down

## Key Design Decisions

### Non-blocking Logging
All logging is async + fire-and-forget. Errors silently logged to console. Never interrupts user workflow.

### Completion Detection Heuristic
Detects completion by checking `onDidChangeTextDocument` events:
- Length > 5 characters (avoid single-char logging noise)
- No newlines (distinguishes from multi-line pastes)
- Not other structural changes

Future: Could hook into actual inline completion provider for accuracy.

### Status Bar Over UI Panel
Simple status bar indicator (not a sidebar panel) to:
- Stay minimal and non-intrusive
- Require no active user interaction
- Show real-time health + event count

### Silent Failure on Service Disconnection
Extension continues working even if service unavailable:
- Editors don't freeze
- No annoying dialogs
- Status changes to "OFFLINE"
- Auto-recovery when service restarts

## Common Customizations

### Add Language-Specific Logic
```typescript
// In extension.ts, inside onDidChangeTextDocument handler
if (document.languageId === 'python') {
  // Python-specific context extraction
}
```

### Change Completion Detection Threshold
```typescript
// Line ~80 in extension.ts
if (text.length > 5 && !text.includes('\n')) { // Adjust 5
```

### Add User Analytics
```typescript
// In updateCompletionCount()
vscode.window.showInformationMessage(`Training: ${stats.total_events} collected`)
```

### Filter Ignored Files/Patterns
```typescript
const ignored = ['*.test.ts', 'node_modules/**']
if (ignored.some(pattern => minimatch(document.uri.fsPath, pattern))) {
  return // Skip logging
}
```

## Debugging

### View Extension Logs
1. `Help → Toggle Developer Tools` (in extension host window)
2. Look for `[Training]` prefixed messages

### Trace HTTP Requests
```typescript
// Add to trainingClient.ts
import { AxiosRequestConfig } from 'axios'

this.client.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    console.log('[Training] Request:', config.method?.toUpperCase(), config.url)
    return config
  }
)
```

### Check Service Connection
```bash
# From extension console
curl http://localhost:8001/health
curl http://localhost:8001/api/v1/training/stats
```

## Building for Distribution

### Create VSIX Package
```bash
npm run build
npx vsce package

# Creates: sovereign-code-training-0.1.0.vsix
# Install locally: Extensions → Install from VSIX
```

### Prepare for Marketplace
1. Create publisher account on marketplace
2. Update `package.json` with publisher ID
3. Add icon + screenshots
4. Increment version and update changelog
5. Run `npx vsce publish`

## Performance Considerations

### Memory Usage
- Axios client: ~1MB
- Type definitions: ~2MB
- Runtime: ~5MB total

### CPU Impact
- Completions logged: < 1ms per event (minimal)
- Health check timer: Runs every 30s (negligible)
- Status bar update: Immediate

### Network Usage
- ~100 bytes per completion event
- Health check: ~50 bytes every 30s
- No continuous polling

## Roadmap

- [ ] Settings UI (GUI instead of JSON)
- [ ] Metrics dashboard in VSCode (side panel)
- [ ] Inline status indicators on accepted completions
- [ ] Custom code snippet templates
- [ ] Integration with GitHub Copilot (show improvement metrics)
- [ ] Marketplace publication
- [ ] Multi-workspace support

## Support

For questions or issues during development:
1. Check browser console for errors
2. Check training service logs
3. Create issue with reproduction steps
4. Include `npm test` output for debugging
