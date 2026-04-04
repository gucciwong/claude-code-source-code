> Plan Status: Closed on 2026-04-04. This file is a historical planning artifact; execution tracking is consolidated in docs/plans/2026-04-04-plan-closure-report.md.

# VSCode Extension MVP Implementation Plan

> **For contributors:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a VS Code extension that provides inline ghost-text code completions powered by a locally running Ollama model.

**Architecture:** The extension registers an `InlineCompletionItemProvider` that captures the text before the cursor, sends it to Ollama's `/api/generate` endpoint, and returns the completion as inline ghost text. All configuration (URL, model, enabled state) is read from VS Code workspace settings. Unit tests use a mocked `vscode` module (no VS Code binary required); integration tests are out of scope for MVP.

**Tech Stack:** TypeScript 5, VS Code Extension API (≥1.68), Node.js `fetch` (Node 18+), Vitest + vscode module mock

---

## Confirmed API Reference (from Phase 0 research)

| Concern | API |
|---|---|
| Register provider | `vscode.languages.registerInlineCompletionItemProvider(selector, provider)` |
| Provider method | `provideInlineCompletionItems(doc, pos, ctx, token): ProviderResult<InlineCompletionList \| InlineCompletionItem[]>` |
| Single completion | `new vscode.InlineCompletionItem(insertText: string, range?: Range)` |
| Cancellation | `token.isCancellationRequested` — check before AND after any `await` |
| Config read | `vscode.workspace.getConfiguration('sovereign-code').get<T>(key, default)` |
| Status bar | `vscode.window.createStatusBarItem(id, alignment, priority)` → `.show()` |
| Lifecycle | `context.subscriptions.push(disposable)` |
| Trigger kinds | `vscode.InlineCompletionTriggerKind.Invoke = 0`, `Automatic = 1` |

**Anti-patterns to avoid:**
- Do NOT use `vscode.languages.registerCompletionItemProvider` (that's the popup list, not ghost text)
- Do NOT cache config at activation (read on each invocation)
- Do NOT forget `.show()` on status bar items
- Do NOT forget `context.subscriptions.push(...)` for every disposable

---

## Directory Structure (target)

```
apps/vscode-extension/
├── src/
│   ├── __mocks__/
│   │   └── vscode.ts          — vscode module mock for Vitest
│   ├── extension.ts            — activate() / deactivate()
│   ├── completionProvider.ts   — InlineCompletionItemProvider implementation
│   ├── ollamaClient.ts         — HTTP client for Ollama /api/generate
│   └── statusBar.ts            — StatusBarItem helper
├── src/__tests__/
│   ├── ollamaClient.test.ts
│   ├── completionProvider.test.ts
│   └── extension.test.ts
├── .vscodeignore
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Task 1: Scaffold the Extension

**Files:**
- Create: `apps/vscode-extension/package.json`
- Create: `apps/vscode-extension/tsconfig.json`
- Create: `apps/vscode-extension/.vscodeignore`
- Create: `apps/vscode-extension/src/extension.ts` (stub)
- Create: `apps/vscode-extension/vitest.config.ts`

**Step 1: Create `apps/vscode-extension/package.json`**

```json
{
  "name": "sovereign-code",
  "displayName": "Sovereign Code",
  "description": "Local AI code completions powered by Ollama",
  "version": "0.1.0",
  "publisher": "sovereign-ai-labs",
  "engines": {
    "vscode": "^1.68.0"
  },
  "categories": ["Other"],
  "activationEvents": ["onStartupFinished"],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "sovereign-code.toggleCompletions",
        "title": "Sovereign Code: Toggle Inline Completions"
      }
    ],
    "configuration": {
      "title": "Sovereign Code",
      "properties": {
        "sovereign-code.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable inline code completions"
        },
        "sovereign-code.ollamaUrl": {
          "type": "string",
          "default": "http://localhost:11434",
          "description": "Ollama server base URL"
        },
        "sovereign-code.model": {
          "type": "string",
          "default": "qwen2.5-coder:7b",
          "description": "Ollama model to use for completions"
        },
        "sovereign-code.maxTokens": {
          "type": "number",
          "default": 128,
          "description": "Maximum tokens to generate per completion"
        },
        "sovereign-code.triggerOnTyping": {
          "type": "boolean",
          "default": true,
          "description": "Trigger completions automatically while typing"
        }
      }
    }
  },
  "scripts": {
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "@types/vscode": "^1.68.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0"
  }
}
```

**Step 2: Create `apps/vscode-extension/tsconfig.json`**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "lib": ["ES2020"],
    "outDir": "./out",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "declaration": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "out", "src/__tests__", "src/__mocks__"]
}
```

**Step 3: Create `apps/vscode-extension/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import * as path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      vscode: path.resolve(__dirname, 'src/__mocks__/vscode.ts'),
    },
  },
})
```

**Step 4: Create stub `apps/vscode-extension/src/extension.ts`**

```typescript
import * as vscode from 'vscode'

export function activate(_context: vscode.ExtensionContext): void {
  // TODO: implement in Task 5
}

export function deactivate(): void {
  // cleanup handled by subscriptions
}
```

**Step 5: Create `apps/vscode-extension/.vscodeignore`**

```
src/
src/__tests__/
src/__mocks__/
vitest.config.ts
tsconfig.json
.gitignore
node_modules/
```

**Step 6: Install dependencies**

```bash
cd apps/vscode-extension
npm install
```

**Step 7: Verify install succeeds (no errors), commit:**

```bash
git add apps/vscode-extension/
git commit -m "feat(vscode-ext): scaffold extension with package.json, tsconfig, vitest config"
```

---

## Task 2: VSCode Module Mock

**Files:**
- Create: `apps/vscode-extension/src/__mocks__/vscode.ts`
- Create: `apps/vscode-extension/src/__tests__/vscode.mock.test.ts` (smoke test)

**Purpose:** An aliased mock of the `vscode` module so unit tests can run without launching VS Code. The mock must export stub implementations of every `vscode.*` symbol used by the extension.

**Step 1: Write a failing smoke test `apps/vscode-extension/src/__tests__/vscode.mock.test.ts`**

```typescript
import * as vscode from 'vscode'

test('vscode mock exports InlineCompletionItem', () => {
  const item = new vscode.InlineCompletionItem('hello')
  expect(item.insertText).toBe('hello')
})

test('vscode mock exports InlineCompletionList', () => {
  const item = new vscode.InlineCompletionItem('world')
  const list = new vscode.InlineCompletionList([item])
  expect(list.items).toHaveLength(1)
})

test('vscode mock exports InlineCompletionTriggerKind', () => {
  expect(vscode.InlineCompletionTriggerKind.Invoke).toBe(0)
  expect(vscode.InlineCompletionTriggerKind.Automatic).toBe(1)
})

test('vscode mock exports position and range', () => {
  const pos = new vscode.Position(5, 10)
  expect(pos.line).toBe(5)
  expect(pos.character).toBe(10)
})
```

**Step 2: Run tests — confirm they FAIL (mock doesn't exist yet):**

```bash
cd apps/vscode-extension && npm test
```

Expected: import error or test failures.

**Step 3: Create `apps/vscode-extension/src/__mocks__/vscode.ts`**

```typescript
// Minimal vscode mock for unit tests.
// Extend this file when new vscode.* usages are added to the extension.

export class Position {
  constructor(public line: number, public character: number) {}
}

export class Range {
  constructor(
    public start: Position,
    public end: Position,
  ) {}
}

export class InlineCompletionItem {
  constructor(
    public insertText: string,
    public range?: Range,
    public command?: unknown,
  ) {}
}

export class InlineCompletionList {
  constructor(public items: InlineCompletionItem[]) {}
}

export const InlineCompletionTriggerKind = {
  Invoke: 0,
  Automatic: 1,
} as const

export const StatusBarAlignment = {
  Left: 1,
  Right: 2,
} as const

export const workspace = {
  getConfiguration: vi.fn().mockReturnValue({
    get: vi.fn().mockImplementation((_key: string, defaultValue: unknown) => defaultValue),
  }),
}

export const window = {
  createStatusBarItem: vi.fn().mockReturnValue({
    text: '',
    tooltip: '',
    command: '',
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
  }),
  showErrorMessage: vi.fn(),
  showInformationMessage: vi.fn(),
}

export const languages = {
  registerInlineCompletionItemProvider: vi.fn().mockReturnValue({
    dispose: vi.fn(),
  }),
}

export const commands = {
  registerCommand: vi.fn().mockReturnValue({
    dispose: vi.fn(),
  }),
}

export const CancellationToken = {
  isCancellationRequested: false,
}

export class ThemeColor {
  constructor(public id: string) {}
}
```

**Step 4: Run tests — confirm 4/4 pass:**

```bash
cd apps/vscode-extension && npm test
```

**Step 5: Commit:**

```bash
git add apps/vscode-extension/src/
git commit -m "feat(vscode-ext): add vscode module mock for unit tests"
```

---

## Task 3: Ollama Client

**Files:**
- Create: `apps/vscode-extension/src/ollamaClient.ts`
- Create: `apps/vscode-extension/src/__tests__/ollamaClient.test.ts`

**What it does:** `getCompletion(prompt, opts)` → calls `POST /api/generate`, returns the `response` string. Uses Node 18 native `fetch`. Respects a cancellation signal.

**Step 1: Write the failing test `apps/vscode-extension/src/__tests__/ollamaClient.test.ts`**

```typescript
import { getCompletion, checkOllamaOnline } from '../ollamaClient'

// Vitest global mocks for fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  mockFetch.mockReset()
})

test('getCompletion calls /api/generate with model and prompt', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ response: 'const x = 1;' }),
  })

  const result = await getCompletion('http://localhost:11434', 'qwen2.5-coder:7b', 'function hello', 64)
  expect(result).toBe('const x = 1;')
  expect(mockFetch).toHaveBeenCalledWith(
    'http://localhost:11434/api/generate',
    expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('"model":"qwen2.5-coder:7b"'),
    }),
  )
})

test('getCompletion returns empty string on non-ok response', async () => {
  mockFetch.mockResolvedValueOnce({ ok: false, status: 503 })
  const result = await getCompletion('http://localhost:11434', 'codellama', 'fn ', 64)
  expect(result).toBe('')
})

test('getCompletion returns empty string on network error', async () => {
  mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))
  const result = await getCompletion('http://localhost:11434', 'codellama', 'fn ', 64)
  expect(result).toBe('')
})

test('checkOllamaOnline returns true when /api/tags responds ok', async () => {
  mockFetch.mockResolvedValueOnce({ ok: true })
  const online = await checkOllamaOnline('http://localhost:11434')
  expect(online).toBe(true)
})

test('checkOllamaOnline returns false on error', async () => {
  mockFetch.mockRejectedValueOnce(new Error('offline'))
  const online = await checkOllamaOnline('http://localhost:11434')
  expect(online).toBe(false)
})
```

**Step 2: Run tests — confirm 5/5 FAIL.**

**Step 3: Implement `apps/vscode-extension/src/ollamaClient.ts`**

```typescript
export interface CompletionOptions {
  maxTokens?: number
  signal?: AbortSignal
}

export async function getCompletion(
  baseUrl: string,
  model: string,
  prompt: string,
  maxTokens: number,
  signal?: AbortSignal,
): Promise<string> {
  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: { num_predict: maxTokens },
      }),
      signal,
    })

    if (!response.ok) {
      return ''
    }

    const data = await response.json() as { response: string }
    return data.response ?? ''
  } catch {
    return ''
  }
}

export async function checkOllamaOnline(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    })
    return response.ok
  } catch {
    return false
  }
}
```

**Step 4: Run tests — confirm 5/5 pass.**

**Step 5: Commit:**

```bash
git add apps/vscode-extension/src/
git commit -m "feat(vscode-ext): add Ollama client with getCompletion + checkOllamaOnline"
```

---

## Task 4: InlineCompletionProvider

**Files:**
- Create: `apps/vscode-extension/src/completionProvider.ts`
- Create: `apps/vscode-extension/src/__tests__/completionProvider.test.ts`

**What it does:**
- Implements `InlineCompletionItemProvider`
- Reads config (url, model, maxTokens, enabled, triggerOnTyping) on each invocation
- Extracts the prefix (text before cursor, last 2000 chars)
- Calls `getCompletion` from `ollamaClient`
- Checks `token.isCancellationRequested` before and after the fetch
- Returns `[new vscode.InlineCompletionItem(text)]` or `[]`

**Step 1: Write failing tests `apps/vscode-extension/src/__tests__/completionProvider.test.ts`**

```typescript
import * as vscode from 'vscode'
import { SovereignCompletionProvider } from '../completionProvider'
import * as ollamaClient from '../ollamaClient'

vi.mock('../ollamaClient')

// Helper: build a minimal mock TextDocument
function makeDoc(text: string, languageId = 'typescript'): vscode.TextDocument {
  return {
    getText: (range?: vscode.Range) => {
      if (!range) return text
      // simplified: ignore range
      return text
    },
    languageId,
    uri: { scheme: 'file' } as vscode.Uri,
  } as vscode.TextDocument
}

// Helper: build cursor position (end of text)
function makePos(line: number, char: number): vscode.Position {
  return new vscode.Position(line, char)
}

// Helper: non-cancelled token
const liveToken = { isCancellationRequested: false } as vscode.CancellationToken
// Helper: already-cancelled token
const deadToken = { isCancellationRequested: true } as vscode.CancellationToken

beforeEach(() => {
  vi.resetAllMocks()
  // Default: enabled, model + url
  vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
    get: vi.fn().mockImplementation((key: string) => {
      const cfg: Record<string, unknown> = {
        enabled: true,
        ollamaUrl: 'http://localhost:11434',
        model: 'qwen2.5-coder:7b',
        maxTokens: 64,
        triggerOnTyping: true,
      }
      return cfg[key]
    }),
  } as unknown as vscode.WorkspaceConfiguration)
  vi.mocked(ollamaClient.getCompletion).mockResolvedValue('  return x + 1;')
})

const provider = new SovereignCompletionProvider()
const ctx = { triggerKind: vscode.InlineCompletionTriggerKind.Automatic } as vscode.InlineCompletionContext

test('returns InlineCompletionItem when getCompletion returns text', async () => {
  const doc = makeDoc('function add(x) {\n')
  const pos = makePos(1, 0)
  const result = await provider.provideInlineCompletionItems(doc, pos, ctx, liveToken)
  expect(result).toBeInstanceOf(Array)
  const items = result as vscode.InlineCompletionItem[]
  expect(items).toHaveLength(1)
  expect(items[0].insertText).toBe('  return x + 1;')
})

test('returns [] when enabled is false', async () => {
  vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
    get: vi.fn().mockReturnValue(false), // enabled = false
  } as unknown as vscode.WorkspaceConfiguration)
  const doc = makeDoc('const x = ')
  const result = await provider.provideInlineCompletionItems(doc, makePos(0, 10), ctx, liveToken)
  expect(result).toEqual([])
  expect(ollamaClient.getCompletion).not.toHaveBeenCalled()
})

test('returns [] when cancellation requested before fetch', async () => {
  const result = await provider.provideInlineCompletionItems(
    makeDoc('const '),
    makePos(0, 6),
    ctx,
    deadToken,
  )
  expect(result).toEqual([])
  expect(ollamaClient.getCompletion).not.toHaveBeenCalled()
})

test('returns [] when getCompletion returns empty string', async () => {
  vi.mocked(ollamaClient.getCompletion).mockResolvedValue('')
  const result = await provider.provideInlineCompletionItems(
    makeDoc('function foo() {'),
    makePos(0, 16),
    ctx,
    liveToken,
  )
  expect(result).toEqual([])
})

test('does not trigger on Automatic when triggerOnTyping is false', async () => {
  vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
    get: vi.fn().mockImplementation((key: string) => {
      if (key === 'triggerOnTyping') return false
      if (key === 'enabled') return true
      return undefined
    }),
  } as unknown as vscode.WorkspaceConfiguration)
  const result = await provider.provideInlineCompletionItems(
    makeDoc('const x = '),
    makePos(0, 10),
    { triggerKind: vscode.InlineCompletionTriggerKind.Automatic } as vscode.InlineCompletionContext,
    liveToken,
  )
  expect(result).toEqual([])
})

test('passes correct params to getCompletion', async () => {
  const doc = makeDoc('const greeting = ')
  await provider.provideInlineCompletionItems(doc, makePos(0, 18), ctx, liveToken)
  expect(ollamaClient.getCompletion).toHaveBeenCalledWith(
    'http://localhost:11434',
    'qwen2.5-coder:7b',
    expect.stringContaining('const greeting = '),
    64,
    expect.any(AbortSignal),
  )
})
```

**Step 2: Run tests — confirm 6/6 FAIL.**

**Step 3: Implement `apps/vscode-extension/src/completionProvider.ts`**

```typescript
import * as vscode from 'vscode'
import { getCompletion } from './ollamaClient'

const MAX_PREFIX_CHARS = 2000

export class SovereignCompletionProvider implements vscode.InlineCompletionItemProvider {
  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken,
  ): Promise<vscode.InlineCompletionItem[] | vscode.InlineCompletionList> {
    const config = vscode.workspace.getConfiguration('sovereign-code')
    const enabled = config.get<boolean>('enabled', true)
    const triggerOnTyping = config.get<boolean>('triggerOnTyping', true)

    if (!enabled) return []

    // Skip Automatic triggers if the user disabled typing-based completions
    if (
      context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic &&
      !triggerOnTyping
    ) {
      return []
    }

    if (token.isCancellationRequested) return []

    const ollamaUrl = config.get<string>('ollamaUrl', 'http://localhost:11434')
    const model = config.get<string>('model', 'qwen2.5-coder:7b')
    const maxTokens = config.get<number>('maxTokens', 128)

    // Build prefix: text from the start of the document up to the cursor
    const prefix = document
      .getText(new vscode.Range(new vscode.Position(0, 0), position))
      .slice(-MAX_PREFIX_CHARS)

    const abortController = new AbortController()
    const cancelListener = token.onCancellationRequested?.(() => abortController.abort())

    try {
      const text = await getCompletion(ollamaUrl, model, prefix, maxTokens, abortController.signal)

      if (token.isCancellationRequested || !text) return []

      return [new vscode.InlineCompletionItem(text)]
    } finally {
      cancelListener?.dispose()
    }
  }
}
```

**Step 4: Run tests — confirm 6/6 pass.**

> **Note:** The test mock for `vscode.workspace.getConfiguration` may need adjustment depending on how the mock returns. The mock in Task 2 uses `vi.fn()` — the `get` sub-mock should be set per-test using `vi.mocked()`.

**Step 5: Commit:**

```bash
git add apps/vscode-extension/src/
git commit -m "feat(vscode-ext): implement SovereignCompletionProvider with cancellation + config"
```

---

## Task 5: Status Bar Helper

**Files:**
- Create: `apps/vscode-extension/src/statusBar.ts`
- Create: `apps/vscode-extension/src/__tests__/statusBar.test.ts`

**What it does:** Creates a status bar item. Exposes `setOnline(model)` / `setOffline()` / `setLoading()` / `dispose()`.

**Step 1: Write failing tests `apps/vscode-extension/src/__tests__/statusBar.test.ts`**

```typescript
import * as vscode from 'vscode'
import { createStatusBar } from '../statusBar'

beforeEach(() => {
  vi.clearAllMocks()
})

test('creates a status bar item on construction', () => {
  createStatusBar()
  expect(vscode.window.createStatusBarItem).toHaveBeenCalledWith(
    'sovereign-code',
    vscode.StatusBarAlignment.Right,
    100,
  )
})

test('setOnline sets text with model name', () => {
  const bar = createStatusBar()
  bar.setOnline('qwen2.5-coder:7b')
  const item = vi.mocked(vscode.window.createStatusBarItem).mock.results[0].value
  expect(item.text).toContain('qwen2.5-coder:7b')
})

test('setOffline sets offline text', () => {
  const bar = createStatusBar()
  bar.setOffline()
  const item = vi.mocked(vscode.window.createStatusBarItem).mock.results[0].value
  expect(item.text).toContain('Offline')
})

test('dispose calls item.dispose', () => {
  const bar = createStatusBar()
  bar.dispose()
  const item = vi.mocked(vscode.window.createStatusBarItem).mock.results[0].value
  expect(item.dispose).toHaveBeenCalled()
})
```

**Step 2: Run tests — confirm FAIL.**

**Step 3: Implement `apps/vscode-extension/src/statusBar.ts`**

```typescript
import * as vscode from 'vscode'

export interface SovereignStatusBar {
  setOnline: (model: string) => void
  setOffline: () => void
  setLoading: () => void
  dispose: () => void
}

export function createStatusBar(): SovereignStatusBar {
  const item = vscode.window.createStatusBarItem(
    'sovereign-code',
    vscode.StatusBarAlignment.Right,
    100,
  )
  item.command = 'sovereign-code.toggleCompletions'
  item.show()

  return {
    setOnline(model: string) {
      item.text = `$(sparkle) ${model}`
      item.tooltip = `Sovereign Code: Active — ${model}`
    },
    setOffline() {
      item.text = '$(warning) Sovereign Offline'
      item.tooltip = 'Sovereign Code: Ollama not reachable'
    },
    setLoading() {
      item.text = '$(loading~spin) Sovereign'
      item.tooltip = 'Sovereign Code: Connecting…'
    },
    dispose() {
      item.dispose()
    },
  }
}
```

**Step 4: Run tests — confirm 4/4 pass.**

**Step 5: Commit:**

```bash
git add apps/vscode-extension/src/
git commit -m "feat(vscode-ext): add status bar helper with online/offline/loading states"
```

---

## Task 6: Extension Entry Point (`activate`)

**Files:**
- Modify: `apps/vscode-extension/src/extension.ts` (replace stub)
- Create: `apps/vscode-extension/src/__tests__/extension.test.ts`

**What it does:**
- Registers `SovereignCompletionProvider` for all file schemes
- Registers `toggleCompletions` command
- Creates the status bar
- Polls Ollama online status every 30s (updates status bar)
- Pushes all disposables to `context.subscriptions`

**Step 1: Write failing tests `apps/vscode-extension/src/__tests__/extension.test.ts`**

```typescript
import * as vscode from 'vscode'
import { activate, deactivate } from '../extension'
import * as statusBarModule from '../statusBar'
import * as ollamaClient from '../ollamaClient'

vi.mock('../statusBar')
vi.mock('../ollamaClient')

function makeContext(): vscode.ExtensionContext {
  return {
    subscriptions: [],
  } as unknown as vscode.ExtensionContext
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(ollamaClient.checkOllamaOnline).mockResolvedValue(true)
  vi.mocked(statusBarModule.createStatusBar).mockReturnValue({
    setOnline: vi.fn(),
    setOffline: vi.fn(),
    setLoading: vi.fn(),
    dispose: vi.fn(),
  })
  // Default config
  vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
    get: vi.fn().mockImplementation((key: string) => {
      if (key === 'model') return 'qwen2.5-coder:7b'
      if (key === 'ollamaUrl') return 'http://localhost:11434'
      return undefined
    }),
  } as unknown as vscode.WorkspaceConfiguration)
})

test('activate registers InlineCompletionItemProvider', () => {
  const ctx = makeContext()
  activate(ctx)
  expect(vscode.languages.registerInlineCompletionItemProvider).toHaveBeenCalledWith(
    { pattern: '**' },
    expect.any(Object),
  )
})

test('activate registers toggleCompletions command', () => {
  const ctx = makeContext()
  activate(ctx)
  expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
    'sovereign-code.toggleCompletions',
    expect.any(Function),
  )
})

test('activate pushes disposables to subscriptions', () => {
  const ctx = makeContext()
  activate(ctx)
  expect(ctx.subscriptions.length).toBeGreaterThan(0)
})

test('activate creates status bar', () => {
  const ctx = makeContext()
  activate(ctx)
  expect(statusBarModule.createStatusBar).toHaveBeenCalled()
})

test('deactivate does not throw', () => {
  expect(() => deactivate()).not.toThrow()
})
```

**Step 2: Run tests — confirm FAIL.**

**Step 3: Implement `apps/vscode-extension/src/extension.ts`**

```typescript
import * as vscode from 'vscode'
import { SovereignCompletionProvider } from './completionProvider'
import { createStatusBar } from './statusBar'
import { checkOllamaOnline } from './ollamaClient'

// Poll interval in ms
const POLL_INTERVAL_MS = 30_000

export function activate(context: vscode.ExtensionContext): void {
  const statusBar = createStatusBar()
  statusBar.setLoading()

  // Register inline completion provider for all files
  const provider = new SovereignCompletionProvider()
  const providerDisposable = vscode.languages.registerInlineCompletionItemProvider(
    { pattern: '**' },
    provider,
  )
  context.subscriptions.push(providerDisposable)

  // Register toggle command
  const commandDisposable = vscode.commands.registerCommand(
    'sovereign-code.toggleCompletions',
    () => {
      const config = vscode.workspace.getConfiguration('sovereign-code')
      const current = config.get<boolean>('enabled', true)
      config.update('enabled', !current, vscode.ConfigurationTarget.Global)
    },
  )
  context.subscriptions.push(commandDisposable)

  // Push status bar to subscriptions for disposal
  context.subscriptions.push({ dispose: () => statusBar.dispose() })

  // Initial online check + periodic polling
  async function checkOnline(): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('sovereign-code')
    const url = cfg.get<string>('ollamaUrl', 'http://localhost:11434')
    const model = cfg.get<string>('model', 'qwen2.5-coder:7b')
    const online = await checkOllamaOnline(url)
    if (online) {
      statusBar.setOnline(model)
    } else {
      statusBar.setOffline()
    }
  }

  void checkOnline()

  const pollingInterval = setInterval(() => void checkOnline(), POLL_INTERVAL_MS)
  context.subscriptions.push({ dispose: () => clearInterval(pollingInterval) })
}

export function deactivate(): void {
  // All cleanup handled by context.subscriptions
}
```

**Step 4: Run all tests — confirm ALL pass.**

```bash
cd apps/vscode-extension && npm test
```

Expected: 5 test files, ~20+ tests, all pass.

**Step 5: Run TypeScript check:**

```bash
cd apps/vscode-extension && npx tsc --noEmit
```

Fix any type errors before committing.

**Step 6: Commit:**

```bash
git add apps/vscode-extension/src/
git commit -m "feat(vscode-ext): implement activate() — provider, command, status bar, polling"
```

---

## Task 7: Final Verification

**Step 1: Run all tests with coverage:**

```bash
cd apps/vscode-extension && npm test -- --coverage
```

Expected: all tests pass, coverage > 80% on `ollamaClient.ts`, `completionProvider.ts`, `statusBar.ts`.

**Step 2: TypeScript strict check:**

```bash
cd apps/vscode-extension && npx tsc --noEmit --strict
```

Zero errors expected.

**Step 3: Verify no hardcoded URLs or model names leak outside configuration reading:**

```bash
grep -r "localhost:11434" apps/vscode-extension/src/ --include="*.ts" --exclude-dir="__tests__" --exclude-dir="__mocks__"
```

Only `ollamaClient.ts` and `extension.ts` should reference the URL (as defaults in `config.get(key, default)` calls).

**Step 4: Verify all `Disposable` objects are pushed to `context.subscriptions`:**

Confirm in `extension.ts` that these are all subscribed:
- `providerDisposable` (from `registerInlineCompletionItemProvider`)
- `commandDisposable` (from `registerCommand`)
- Status bar disposal wrapper
- Polling interval disposal wrapper

**Step 5: Final commit:**

```bash
git add apps/vscode-extension/
git commit -m "feat(vscode-ext): complete MVP — inline completions + status bar + Ollama polling"
```

---

## Summary of Files Created

| File | Purpose |
|---|---|
| `apps/vscode-extension/package.json` | Extension manifest with contributes, commands, settings |
| `apps/vscode-extension/tsconfig.json` | TypeScript compiler config |
| `apps/vscode-extension/vitest.config.ts` | Vitest config with vscode module alias |
| `apps/vscode-extension/src/extension.ts` | Entry point — activate/deactivate |
| `apps/vscode-extension/src/completionProvider.ts` | InlineCompletionItemProvider implementation |
| `apps/vscode-extension/src/ollamaClient.ts` | HTTP client for Ollama /api/generate |
| `apps/vscode-extension/src/statusBar.ts` | Status bar item helper |
| `apps/vscode-extension/src/__mocks__/vscode.ts` | vscode module mock for Vitest |
| `apps/vscode-extension/src/__tests__/vscode.mock.test.ts` | 4 mock smoke tests |
| `apps/vscode-extension/src/__tests__/ollamaClient.test.ts` | 5 unit tests |
| `apps/vscode-extension/src/__tests__/completionProvider.test.ts` | 6 unit tests |
| `apps/vscode-extension/src/__tests__/statusBar.test.ts` | 4 unit tests |
| `apps/vscode-extension/src/__tests__/extension.test.ts` | 5 unit tests |

**Total tests: ~24 unit tests. All run without VS Code binary (Vitest + mocked vscode).**

---

## Known Limitations / Post-MVP

- No FIM (Fill-in-the-Middle) tokens — uses prefix-only prompting. For FIM, use CodeLlama's `<PRE>/<SUF>/<MID>` tokens or Ollama's structured prompt format.
- No debouncing — `Automatic` trigger fires on every keystroke. Add a 300ms debounce if performance is a concern.
- No integration test (requires VS Code binary download). Add `@vscode/test-cli` in a follow-up.
- `ConfigurationTarget.Global` on toggle — should be `Workspace` if per-project toggle is desired.


