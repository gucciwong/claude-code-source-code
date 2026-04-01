# RAG Context System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add project-context-aware completions to the VSCode extension by building a local embedding-based retrieval system that indexes workspace files and injects relevant code snippets into the completion prompt.

**Architecture:** Five modules in `apps/vscode-extension/src/rag/` — `chunker.ts` (split source into semantic chunks), `embedder.ts` (Ollama `/api/embeddings` wrapper), `store.ts` (SQLite chunk store with in-memory cosine similarity), `retriever.ts` (embed query → search → return top-k), `indexer.ts` (VS Code FileSystemWatcher + initial workspace scan). The Retriever is injected into `SovereignCompletionProvider` via constructor so tests stay isolated. The IndexerStore lifecycle is owned by `extension.ts` activate().

**Tech Stack:** `better-sqlite3` (local SQLite, Node.js native, no server required), Ollama `/api/embeddings` (`nomic-embed-text` model, reuses existing Ollama dependency), VS Code `FileSystemWatcher` + `workspace.findFiles`, Node.js `fs/promises`, Vitest (existing test runner)

**PRD reference:** §4.2.4 Project Context & RAG System

---

## Directory Structure (target — only new files shown)

```
apps/vscode-extension/src/
  rag/
    chunker.ts         — split source files into overlapping semantic chunks
    embedder.ts        — POST to Ollama /api/embeddings, return number[]
    store.ts           — SQLite chunk store; in-memory cosine similarity search
    retriever.ts       — query(text, topK) → RetrievedChunk[]
    indexer.ts         — FileSystemWatcher + initial workspace scan
  __tests__/rag/
    chunker.test.ts
    embedder.test.ts
    store.test.ts
    retriever.test.ts
    indexer.test.ts
```

Plus modifications to:
- `src/__mocks__/vscode.ts` — add `workspace.findFiles`, `workspace.workspaceFolders`, `workspace.createFileSystemWatcher`, `RelativePattern`, `Uri`
- `src/completionProvider.ts` — accept optional `Retriever`, prepend retrieved context
- `src/extension.ts` — create `ChunkStore`, `Retriever`, `Indexer` on activate
- `src/__tests__/extension.test.ts` — add `workspaceFolders: undefined` to mock, update subscription count
- `apps/vscode-extension/package.json` — add `better-sqlite3` dep + 4 config properties

---

## Confirmed API Reference

| Concern | API |
|---|---|
| Ollama embeddings | `POST {baseUrl}/api/embeddings` body `{ model, prompt }` → `{ embedding: number[] }` |
| Find workspace files | `vscode.workspace.findFiles(include, exclude): Thenable<Uri[]>` |
| Watch files | `vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(root, glob))` |
| Watcher events | `.onDidCreate(cb)`, `.onDidChange(cb)`, `.onDidDelete(cb)` → each returns a `Disposable` |
| Workspace root | `vscode.workspace.workspaceFolders?.[0].uri.fsPath` |
| SQLite in-memory | `new Database(':memory:')` — for tests only |
| better-sqlite3 import | `import Database from 'better-sqlite3'` |
| Embedding dimension | `nomic-embed-text` produces 768-dimensional vectors |

**Do NOT use:**
- `sqlite-vec` or any SQLite vector extension (requires native compilation beyond better-sqlite3)
- `@xenova/transformers` (adds 100MB WASM download)
- `ChromaDB` (requires separate server process)
- FTS5 virtual tables (unnecessary complexity for Phase 1)

---

## Task 1: Install Dependency + Extend VSCode Mock + Scaffold

**Files:**
- Modify: `apps/vscode-extension/package.json` — add `better-sqlite3` + 4 config props
- Modify: `apps/vscode-extension/src/__mocks__/vscode.ts` — add `workspace.findFiles`, `workspace.workspaceFolders`, `workspace.createFileSystemWatcher`, `RelativePattern`, `Uri`
- Create: `apps/vscode-extension/src/rag/.gitkeep` (placeholder; replaced by Task 2)
- Create: `apps/vscode-extension/src/__tests__/rag/.gitkeep` (placeholder)

**Step 1: Install better-sqlite3**

```bash
cd apps/vscode-extension
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3
```

Expected: `package.json` `dependencies` now contains `"better-sqlite3": "^x.x.x"`.

**Step 2: Add 4 config properties to `package.json` `contributes.configuration.properties`**

Add after the existing `sovereign-coder.triggerOnTyping` block:

```json
        "sovereign-coder.ragEnabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable RAG project context in completions (requires nomic-embed-text in Ollama)"
        },
        "sovereign-coder.embeddingModel": {
          "type": "string",
          "default": "nomic-embed-text",
          "description": "Ollama model to use for generating embeddings"
        },
        "sovereign-coder.ragTopK": {
          "type": "number",
          "default": 3,
          "description": "Number of context chunks to retrieve per completion"
        },
        "sovereign-coder.ragMaxContextChars": {
          "type": "number",
          "default": 2000,
          "description": "Maximum characters of retrieved context to prepend to the prompt"
        }
```

**Step 3: Extend the vscode mock**

Add the following to `src/__mocks__/vscode.ts` after the existing `workspace` block:

```typescript
export class Uri {
  constructor(
    public readonly scheme: string,
    public readonly authority: string,
    public readonly path: string,
    public readonly fsPath: string,
  ) {}

  static file(fsPath: string): Uri {
    return new Uri('file', '', fsPath, fsPath)
  }

  toString(): string {
    return `${this.scheme}://${this.fsPath}`
  }
}

export class RelativePattern {
  constructor(
    public readonly base: string | { uri: Uri },
    public readonly pattern: string,
  ) {}
}
```

And replace the existing `workspace` export with:

```typescript
export const workspace = {
  getConfiguration: vi.fn().mockReturnValue({
    get: vi.fn().mockImplementation((_key: string, defaultValue: unknown) => defaultValue),
    update: vi.fn(),
  }),
  findFiles: vi.fn().mockResolvedValue([]),
  workspaceFolders: undefined as Array<{ uri: Uri; name: string; index: number }> | undefined,
  createFileSystemWatcher: vi.fn().mockReturnValue({
    onDidCreate: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    onDidChange: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    onDidDelete: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    dispose: vi.fn(),
  }),
}
```

**Step 4: Create rag/ placeholder directories**

```bash
mkdir apps/vscode-extension/src/rag
mkdir apps/vscode-extension/src/__tests__/rag
```

**Step 5: Verify existing tests still pass**

```bash
cd apps/vscode-extension && npm test
```

Expected: **24/24 tests pass** (no regressions from mock changes).

**Step 6: Commit**

```bash
git add apps/vscode-extension/
git commit -m "feat(vscode-ext/rag): install better-sqlite3, extend vscode mock, add RAG config"
```

---

## Task 2: Chunker

**Files:**
- Create: `apps/vscode-extension/src/rag/chunker.ts`
- Create: `apps/vscode-extension/src/__tests__/rag/chunker.test.ts`

### Step 1: Write the failing test

Create `src/__tests__/rag/chunker.test.ts`:

```typescript
import { describe, test, expect } from 'vitest'
import { chunkSource } from '../../rag/chunker'

describe('chunkSource', () => {
  test('returns empty array for empty source', () => {
    const chunks = chunkSource('/a/b.ts', '')
    expect(chunks).toEqual([])
  })

  test('single chunk for short file', () => {
    const source = 'const x = 1\nconst y = 2\n'
    const chunks = chunkSource('/a/b.ts', source)
    expect(chunks.length).toBeGreaterThan(0)
    expect(chunks[0].filePath).toBe('/a/b.ts')
    expect(chunks[0].startLine).toBe(0)
    expect(chunks[0].content).toContain('const x = 1')
  })

  test('multiple chunks for long file', () => {
    // 120 lines — should produce more than 1 chunk
    const source = Array.from({ length: 120 }, (_, i) => `const v${i} = ${i}`).join('\n')
    const chunks = chunkSource('/a/big.ts', source)
    expect(chunks.length).toBeGreaterThan(1)
  })

  test('chunk boundary detected at function declaration', () => {
    const source = [
      ...Array(45).fill('const x = 1'),
      'function myBoundary() {',
      '  return 42',
      '}',
    ].join('\n')
    const chunks = chunkSource('/a/b.ts', source)
    // The boundary at line 45 should cause a split before CHUNK_SIZE (50)
    expect(chunks.length).toBeGreaterThanOrEqual(1)
    // Second chunk should start at or near the function
    if (chunks.length > 1) {
      expect(chunks[1].startLine).toBeLessThan(48)
    }
  })

  test('chunks have non-empty content', () => {
    const source = 'function foo() {\n  return 1\n}\n'
    const chunks = chunkSource('/a/b.ts', source)
    for (const chunk of chunks) {
      expect(chunk.content.trim().length).toBeGreaterThan(0)
    }
  })

  test('each chunk records correct startLine and endLine', () => {
    const source = 'line0\nline1\nline2\n'
    const chunks = chunkSource('/a/b.ts', source)
    for (const chunk of chunks) {
      expect(chunk.endLine).toBeGreaterThanOrEqual(chunk.startLine)
    }
  })
})
```

### Step 2: Run test to verify it fails

```bash
cd apps/vscode-extension && npm test -- --reporter=verbose src/__tests__/rag/chunker.test.ts
```

Expected: **FAIL** — `Cannot find module '../../rag/chunker'`

### Step 3: Implement `src/rag/chunker.ts`

```typescript
export interface Chunk {
  filePath: string
  startLine: number
  endLine: number
  content: string
}

const CHUNK_SIZE = 50     // target lines per chunk
const CHUNK_OVERLAP = 10  // overlap between consecutive chunks

/** Regex patterns that mark the start of a new logical unit (function, class, etc.) */
const BOUNDARY_PATTERNS: RegExp[] = [
  /^(export\s+)?(default\s+)?(async\s+)?function\s+\w+/,
  /^(export\s+)?(abstract\s+)?class\s+\w+/,
  /^(export\s+)?const\s+\w+\s*=\s*(async\s+)?\(/,
  /^(export\s+)?const\s+\w+\s*=\s*(async\s+)?function/,
  /^def\s+\w+[\s(]/,
  /^class\s+\w+[:(]/,
  /^func\s+\w+\s*\(/,
  /^fn\s+\w+\s*[(<]/,
  /^pub\s+(async\s+)?fn\s+\w+/,
]

function isBoundary(line: string): boolean {
  const trimmed = line.trimStart()
  return BOUNDARY_PATTERNS.some(p => p.test(trimmed))
}

export function chunkSource(filePath: string, source: string): Chunk[] {
  if (!source.trim()) return []

  const lines = source.split('\n')
  const chunks: Chunk[] = []
  let i = 0

  while (i < lines.length) {
    const targetEnd = Math.min(i + CHUNK_SIZE, lines.length)

    // Search backward from the target end for a natural boundary
    let splitAt = targetEnd
    for (let j = targetEnd - 1; j > i + CHUNK_OVERLAP && j > i + 1; j--) {
      if (isBoundary(lines[j])) {
        splitAt = j
        break
      }
    }

    const content = lines.slice(i, splitAt).join('\n').trim()
    if (content.length > 0) {
      chunks.push({ filePath, startLine: i, endLine: splitAt - 1, content })
    }

    if (splitAt >= lines.length) break

    // Next chunk starts with overlap to preserve context
    i = splitAt - CHUNK_OVERLAP
    if (i < 0) i = 0
  }

  return chunks
}
```

### Step 4: Run test to verify it passes

```bash
cd apps/vscode-extension && npm test -- src/__tests__/rag/chunker.test.ts
```

Expected: **6/6 pass**

### Step 5: Commit

```bash
git add apps/vscode-extension/src/rag/chunker.ts apps/vscode-extension/src/__tests__/rag/chunker.test.ts
git commit -m "feat(vscode-ext/rag): add source chunker with language-aware boundary detection"
```

---

## Task 3: Embedder

**Files:**
- Create: `apps/vscode-extension/src/rag/embedder.ts`
- Create: `apps/vscode-extension/src/__tests__/rag/embedder.test.ts`

### Step 1: Write the failing test

Create `src/__tests__/rag/embedder.test.ts`:

```typescript
import { describe, test, expect, vi, afterEach } from 'vitest'
import { getEmbedding } from '../../rag/embedder'

const MOCK_EMBEDDING = Array.from({ length: 768 }, (_, i) => i / 768)

afterEach(() => vi.restoreAllMocks())

describe('getEmbedding', () => {
  test('returns embedding array on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ embedding: MOCK_EMBEDDING }),
    } as unknown as Response)

    const result = await getEmbedding('http://localhost:11434', 'nomic-embed-text', 'hello world')
    expect(result).toEqual(MOCK_EMBEDDING)
  })

  test('returns null on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
    } as unknown as Response)

    const result = await getEmbedding('http://localhost:11434', 'nomic-embed-text', 'hello')
    expect(result).toBeNull()
  })

  test('returns null on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network failure'))

    const result = await getEmbedding('http://localhost:11434', 'nomic-embed-text', 'hello')
    expect(result).toBeNull()
  })

  test('posts to correct endpoint with correct body', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ embedding: MOCK_EMBEDDING }),
    } as unknown as Response)

    await getEmbedding('http://host:11434', 'nomic-embed-text', 'some code')

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://host:11434/api/embeddings',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ model: 'nomic-embed-text', prompt: 'some code' }),
      }),
    )
  })

  test('passes abort signal when provided', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ embedding: MOCK_EMBEDDING }),
    } as unknown as Response)

    const signal = AbortSignal.timeout(5000)
    await getEmbedding('http://localhost:11434', 'nomic-embed-text', 'code', signal)

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal }),
    )
  })

  test('returns null when response has no embedding field', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'model not found' }),
    } as unknown as Response)

    const result = await getEmbedding('http://localhost:11434', 'nomic-embed-text', 'hello')
    expect(result).toBeNull()
  })
})
```

### Step 2: Run test to verify it fails

```bash
cd apps/vscode-extension && npm test -- src/__tests__/rag/embedder.test.ts
```

Expected: **FAIL** — `Cannot find module '../../rag/embedder'`

### Step 3: Implement `src/rag/embedder.ts`

```typescript
/**
 * Calls Ollama's /api/embeddings endpoint to get a vector embedding for the given text.
 * Returns null if the request fails for any reason (network error, model not found, etc.)
 */
export async function getEmbedding(
  baseUrl: string,
  model: string,
  text: string,
  signal?: AbortSignal,
): Promise<number[] | null> {
  try {
    const response = await fetch(`${baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: text }),
      signal,
    })

    if (!response.ok) return null

    const data = await response.json() as { embedding?: number[] }
    return data.embedding ?? null
  } catch {
    return null
  }
}
```

### Step 4: Run test to verify it passes

```bash
cd apps/vscode-extension && npm test -- src/__tests__/rag/embedder.test.ts
```

Expected: **6/6 pass**

### Step 5: Commit

```bash
git add apps/vscode-extension/src/rag/embedder.ts apps/vscode-extension/src/__tests__/rag/embedder.test.ts
git commit -m "feat(vscode-ext/rag): add Ollama embeddings client"
```

---

## Task 4: Vector Store (ChunkStore)

**Files:**
- Create: `apps/vscode-extension/src/rag/store.ts`
- Create: `apps/vscode-extension/src/__tests__/rag/store.test.ts`

### Step 1: Write the failing test

Create `src/__tests__/rag/store.test.ts`:

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { ChunkStore } from '../../rag/store'

// Use in-memory SQLite for all store tests
let store: ChunkStore

// 768-dimensional unit vectors for testing
const VEC_A = Array.from({ length: 768 }, () => 1 / Math.sqrt(768))  // uniform positive
const VEC_B = Array.from({ length: 768 }, (_, i) => i % 2 === 0 ? 1 / Math.sqrt(384) : 0) // every other dim

beforeEach(() => {
  store = new ChunkStore(':memory:')
})

afterEach(() => {
  store.dispose()
})

describe('ChunkStore', () => {
  test('upsertFile and search returns inserted chunk', () => {
    store.upsertFile('/project/a.ts', [
      { startLine: 0, endLine: 5, content: 'function hello() {}', embedding: VEC_A },
    ])

    const results = store.search(VEC_A, 5)
    expect(results.length).toBe(1)
    expect(results[0].content).toBe('function hello() {}')
    expect(results[0].filePath).toBe('/project/a.ts')
  })

  test('upsertFile replaces existing chunks for same file', () => {
    store.upsertFile('/project/a.ts', [
      { startLine: 0, endLine: 5, content: 'old content', embedding: VEC_A },
    ])
    store.upsertFile('/project/a.ts', [
      { startLine: 0, endLine: 5, content: 'new content', embedding: VEC_A },
    ])

    const results = store.search(VEC_A, 5)
    expect(results.length).toBe(1)
    expect(results[0].content).toBe('new content')
  })

  test('removeFile deletes chunks for that file only', () => {
    store.upsertFile('/project/a.ts', [
      { startLine: 0, endLine: 2, content: 'chunk in a', embedding: VEC_A },
    ])
    store.upsertFile('/project/b.ts', [
      { startLine: 0, endLine: 2, content: 'chunk in b', embedding: VEC_B },
    ])

    store.removeFile('/project/a.ts')

    const results = store.search(VEC_A, 10)
    // Only b.ts chunk remains
    expect(results.length).toBe(1)
    expect(results[0].filePath).toBe('/project/b.ts')
  })

  test('search returns topK most similar chunks in descending order', () => {
    store.upsertFile('/project/a.ts', [
      { startLine: 0, endLine: 1, content: 'high similarity', embedding: VEC_A },
      { startLine: 2, endLine: 3, content: 'low similarity', embedding: VEC_B },
    ])

    const results = store.search(VEC_A, 2)
    expect(results[0].content).toBe('high similarity')
    expect(results[1].content).toBe('low similarity')
  })

  test('search returns at most topK results', () => {
    for (let i = 0; i < 10; i++) {
      store.upsertFile(`/project/file${i}.ts`, [
        { startLine: 0, endLine: 1, content: `chunk ${i}`, embedding: VEC_A },
      ])
    }
    const results = store.search(VEC_A, 3)
    expect(results.length).toBe(3)
  })

  test('search on empty store returns empty array', () => {
    const results = store.search(VEC_A, 5)
    expect(results).toEqual([])
  })

  test('stored chunk has correct metadata', () => {
    store.upsertFile('/project/x.py', [
      { startLine: 10, endLine: 20, content: 'def foo(): pass', embedding: VEC_A },
    ])
    const results = store.search(VEC_A, 1)
    expect(results[0].startLine).toBe(10)
    expect(results[0].endLine).toBe(20)
  })
})
```

### Step 2: Run test to verify it fails

```bash
cd apps/vscode-extension && npm test -- src/__tests__/rag/store.test.ts
```

Expected: **FAIL** — `Cannot find module '../../rag/store'`

### Step 3: Implement `src/rag/store.ts`

```typescript
import Database from 'better-sqlite3'

export interface StoredChunk {
  id: number
  filePath: string
  startLine: number
  endLine: number
  content: string
  embedding: number[]
}

function cosine(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

type RawRow = {
  id: number
  file_path: string
  start_line: number
  end_line: number
  content: string
  embedding: string
}

export class ChunkStore {
  private readonly db: Database.Database

  constructor(dbPath: string) {
    this.db = new Database(dbPath)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chunks (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path  TEXT    NOT NULL,
        start_line INTEGER NOT NULL,
        end_line   INTEGER NOT NULL,
        content    TEXT    NOT NULL,
        embedding  TEXT    NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_chunks_file ON chunks(file_path);
    `)
  }

  /** Insert (or replace) all chunks for a file atomically. */
  upsertFile(
    filePath: string,
    chunks: Array<{ startLine: number; endLine: number; content: string; embedding: number[] }>,
  ): void {
    const del = this.db.prepare('DELETE FROM chunks WHERE file_path = ?')
    const ins = this.db.prepare(
      'INSERT INTO chunks (file_path, start_line, end_line, content, embedding) VALUES (?, ?, ?, ?, ?)',
    )
    this.db.transaction(() => {
      del.run(filePath)
      for (const c of chunks) {
        ins.run(filePath, c.startLine, c.endLine, c.content, JSON.stringify(c.embedding))
      }
    })()
  }

  /** Remove all chunks for a deleted or excluded file. */
  removeFile(filePath: string): void {
    this.db.prepare('DELETE FROM chunks WHERE file_path = ?').run(filePath)
  }

  /**
   * Return the topK chunks most similar to queryEmbedding.
   * Loads all embeddings into memory and scores via cosine similarity.
   * Suitable for repos up to ~50K chunks.
   */
  search(queryEmbedding: number[], topK: number): StoredChunk[] {
    const rows = this.db
      .prepare('SELECT id, file_path, start_line, end_line, content, embedding FROM chunks')
      .all() as RawRow[]

    if (rows.length === 0) return []

    const scored = rows.map(r => {
      const embedding = JSON.parse(r.embedding) as number[]
      return {
        id: r.id,
        filePath: r.file_path,
        startLine: r.start_line,
        endLine: r.end_line,
        content: r.content,
        embedding,
        score: cosine(queryEmbedding, embedding),
      }
    })

    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, topK)
  }

  dispose(): void {
    this.db.close()
  }
}
```

### Step 4: Run test to verify it passes

```bash
cd apps/vscode-extension && npm test -- src/__tests__/rag/store.test.ts
```

Expected: **7/7 pass**

### Step 5: Commit

```bash
git add apps/vscode-extension/src/rag/store.ts apps/vscode-extension/src/__tests__/rag/store.test.ts
git commit -m "feat(vscode-ext/rag): add SQLite chunk store with in-memory cosine similarity search"
```

---

## Task 5: Retriever

**Files:**
- Create: `apps/vscode-extension/src/rag/retriever.ts`
- Create: `apps/vscode-extension/src/__tests__/rag/retriever.test.ts`

### Step 1: Write the failing test

Create `src/__tests__/rag/retriever.test.ts`:

```typescript
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { Retriever } from '../../rag/retriever'
import { ChunkStore } from '../../rag/store'
import * as embedderModule from '../../rag/embedder'

const VEC = Array.from({ length: 768 }, () => 0.5)

let store: ChunkStore

beforeEach(() => {
  store = new ChunkStore(':memory:')
  vi.spyOn(embedderModule, 'getEmbedding').mockResolvedValue(VEC)
})

afterEach(() => {
  store.dispose()
  vi.restoreAllMocks()
})

describe('Retriever', () => {
  test('returns empty array when store is empty', async () => {
    const retriever = new Retriever(store, 'http://localhost:11434', 'nomic-embed-text')
    const results = await retriever.query('function foo', 3)
    expect(results).toEqual([])
  })

  test('returns top-k chunks from store', async () => {
    const vec = Array.from({ length: 768 }, () => 0.5)
    store.upsertFile('/project/a.ts', [
      { startLine: 0, endLine: 5, content: 'function foo() {}', embedding: vec },
      { startLine: 6, endLine: 10, content: 'class Bar {}', embedding: vec },
    ])

    const retriever = new Retriever(store, 'http://localhost:11434', 'nomic-embed-text')
    const results = await retriever.query('function foo', 1)

    expect(results.length).toBe(1)
    expect(results[0].content).toBe('function foo() {}')
  })

  test('returns RetrievedChunk shape with correct fields', async () => {
    store.upsertFile('/project/x.py', [
      { startLine: 10, endLine: 20, content: 'def hello(): pass', embedding: VEC },
    ])

    const retriever = new Retriever(store, 'http://localhost:11434', 'nomic-embed-text')
    const results = await retriever.query('def hello', 5)

    expect(results[0]).toMatchObject({
      filePath: '/project/x.py',
      startLine: 10,
      endLine: 20,
      content: 'def hello(): pass',
    })
    // Should NOT expose internal `score` or `embedding` fields
    expect('score' in results[0]).toBe(false)
    expect('embedding' in results[0]).toBe(false)
  })

  test('returns empty array when getEmbedding returns null', async () => {
    vi.spyOn(embedderModule, 'getEmbedding').mockResolvedValueOnce(null)

    store.upsertFile('/project/a.ts', [
      { startLine: 0, endLine: 5, content: 'function foo() {}', embedding: VEC },
    ])

    const retriever = new Retriever(store, 'http://localhost:11434', 'nomic-embed-text')
    const results = await retriever.query('function foo', 5)
    expect(results).toEqual([])
  })

  test('calls getEmbedding with correct arguments', async () => {
    const spy = vi.spyOn(embedderModule, 'getEmbedding').mockResolvedValue(VEC)

    const retriever = new Retriever(store, 'http://my-host:11434', 'nomic-embed-text')
    await retriever.query('some code', 3)

    expect(spy).toHaveBeenCalledWith('http://my-host:11434', 'nomic-embed-text', 'some code')
  })
})
```

### Step 2: Run test to verify it fails

```bash
cd apps/vscode-extension && npm test -- src/__tests__/rag/retriever.test.ts
```

Expected: **FAIL** — `Cannot find module '../../rag/retriever'`

### Step 3: Implement `src/rag/retriever.ts`

```typescript
import { getEmbedding } from './embedder'
import { ChunkStore } from './store'

export interface RetrievedChunk {
  filePath: string
  startLine: number
  endLine: number
  content: string
}

export class Retriever {
  constructor(
    private readonly store: ChunkStore,
    private readonly ollamaUrl: string,
    private readonly embeddingModel: string,
  ) {}

  /**
   * Embed the query text and return the topK most similar chunks from the store.
   * Returns [] if embedding fails or the store is empty.
   */
  async query(text: string, topK: number): Promise<RetrievedChunk[]> {
    const embedding = await getEmbedding(this.ollamaUrl, this.embeddingModel, text)
    if (!embedding) return []

    return this.store.search(embedding, topK).map(c => ({
      filePath: c.filePath,
      startLine: c.startLine,
      endLine: c.endLine,
      content: c.content,
    }))
  }
}
```

### Step 4: Run test to verify it passes

```bash
cd apps/vscode-extension && npm test -- src/__tests__/rag/retriever.test.ts
```

Expected: **5/5 pass**

### Step 5: Commit

```bash
git add apps/vscode-extension/src/rag/retriever.ts apps/vscode-extension/src/__tests__/rag/retriever.test.ts
git commit -m "feat(vscode-ext/rag): add Retriever — embed query + cosine search + shape-safe output"
```

---

## Task 6: Indexer

**Files:**
- Create: `apps/vscode-extension/src/rag/indexer.ts`
- Create: `apps/vscode-extension/src/__tests__/rag/indexer.test.ts`

### Step 1: Write the failing test

Create `src/__tests__/rag/indexer.test.ts`:

```typescript
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import * as vscode from 'vscode'
import { Indexer } from '../../rag/indexer'
import { ChunkStore } from '../../rag/store'
import * as embedderModule from '../../rag/embedder'

// Mock fs/promises so we don't touch the real filesystem
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('function hello() {\n  return 42\n}\n'),
}))

const FAKE_VEC = Array.from({ length: 768 }, () => 0.1)

let store: ChunkStore

beforeEach(() => {
  store = new ChunkStore(':memory:')
  vi.spyOn(embedderModule, 'getEmbedding').mockResolvedValue(FAKE_VEC)
  vi.mocked(vscode.workspace.findFiles).mockResolvedValue([
    vscode.Uri.file('/workspace/src/main.ts'),
  ])
})

afterEach(() => {
  store.dispose()
  vi.restoreAllMocks()
})

describe('Indexer', () => {
  test('start() indexes all files found by findFiles', async () => {
    const indexer = new Indexer(store, 'http://localhost:11434', 'nomic-embed-text')
    await indexer.start('/workspace')

    const results = store.search(FAKE_VEC, 10)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].filePath).toBe('/workspace/src/main.ts')
    indexer.stop()
  })

  test('start() creates a FileSystemWatcher', async () => {
    const indexer = new Indexer(store, 'http://localhost:11434', 'nomic-embed-text')
    await indexer.start('/workspace')

    expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalledOnce()
    indexer.stop()
  })

  test('stop() disposes the watcher', async () => {
    const mockWatcher = {
      onDidCreate: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      onDidChange: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      onDidDelete: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      dispose: vi.fn(),
    }
    vi.mocked(vscode.workspace.createFileSystemWatcher).mockReturnValueOnce(
      mockWatcher as unknown as ReturnType<typeof vscode.workspace.createFileSystemWatcher>,
    )

    const indexer = new Indexer(store, 'http://localhost:11434', 'nomic-embed-text')
    await indexer.start('/workspace')
    indexer.stop()

    expect(mockWatcher.dispose).toHaveBeenCalledOnce()
  })

  test('does not throw if getEmbedding returns null for a file', async () => {
    vi.spyOn(embedderModule, 'getEmbedding').mockResolvedValue(null)

    const indexer = new Indexer(store, 'http://localhost:11434', 'nomic-embed-text')
    await expect(indexer.start('/workspace')).resolves.not.toThrow()
    indexer.stop()
  })

  test('does not throw if readFile fails for a file', async () => {
    const { readFile } = await import('fs/promises')
    vi.mocked(readFile).mockRejectedValueOnce(new Error('Permission denied'))

    const indexer = new Indexer(store, 'http://localhost:11434', 'nomic-embed-text')
    await expect(indexer.start('/workspace')).resolves.not.toThrow()
    indexer.stop()
  })
})
```

### Step 2: Run test to verify it fails

```bash
cd apps/vscode-extension && npm test -- src/__tests__/rag/indexer.test.ts
```

Expected: **FAIL** — `Cannot find module '../../rag/indexer'`

### Step 3: Implement `src/rag/indexer.ts`

```typescript
import * as vscode from 'vscode'
import * as fs from 'fs/promises'
import { chunkSource } from './chunker'
import { getEmbedding } from './embedder'
import { ChunkStore } from './store'

const INCLUDE_GLOB = '**/*.{ts,tsx,js,jsx,py,go,rs,java,cpp,c,h,cs,rb,php,swift,kt,vue,svelte}'
const EXCLUDE_GLOB = '{**/node_modules/**,**/out/**,**/.git/**,**/dist/**,**/.sovereign-coder/**,**/*.min.js,**/*.d.ts}'

export class Indexer {
  private watcher?: vscode.FileSystemWatcher

  constructor(
    private readonly store: ChunkStore,
    private readonly ollamaUrl: string,
    private readonly embeddingModel: string,
  ) {}

  async start(workspaceRoot: string): Promise<void> {
    // Initial full scan
    const uris = await vscode.workspace.findFiles(INCLUDE_GLOB, EXCLUDE_GLOB)
    for (const uri of uris) {
      await this.indexFile(uri.fsPath)
    }

    // Incremental watch
    this.watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceRoot, INCLUDE_GLOB),
    )
    this.watcher.onDidCreate(uri => void this.indexFile(uri.fsPath))
    this.watcher.onDidChange(uri => void this.indexFile(uri.fsPath))
    this.watcher.onDidDelete(uri => this.store.removeFile(uri.fsPath))
  }

  private async indexFile(filePath: string): Promise<void> {
    try {
      const source = await fs.readFile(filePath, 'utf-8')
      const rawChunks = chunkSource(filePath, source)
      const chunksWithEmbeddings: Array<{
        startLine: number
        endLine: number
        content: string
        embedding: number[]
      }> = []

      for (const chunk of rawChunks) {
        const embedding = await getEmbedding(this.ollamaUrl, this.embeddingModel, chunk.content)
        if (embedding) {
          chunksWithEmbeddings.push({ ...chunk, embedding })
        }
      }

      if (chunksWithEmbeddings.length > 0) {
        this.store.upsertFile(filePath, chunksWithEmbeddings)
      }
    } catch {
      // Silently skip unreadable files (binary, permission denied, etc.)
    }
  }

  stop(): void {
    this.watcher?.dispose()
  }
}
```

### Step 4: Run test to verify it passes

```bash
cd apps/vscode-extension && npm test -- src/__tests__/rag/indexer.test.ts
```

Expected: **5/5 pass**

### Step 5: Commit

```bash
git add apps/vscode-extension/src/rag/indexer.ts apps/vscode-extension/src/__tests__/rag/indexer.test.ts
git commit -m "feat(vscode-ext/rag): add Indexer — workspace file scan + incremental FileSystemWatcher"
```

---

## Task 7: Wire into CompletionProvider and Extension Entry Point

**Files:**
- Modify: `apps/vscode-extension/src/completionProvider.ts` — accept optional `Retriever`, inject context into prompt
- Modify: `apps/vscode-extension/src/extension.ts` — create ChunkStore + Retriever + Indexer on activate
- Modify: `apps/vscode-extension/src/__tests__/extension.test.ts` — update subscription count for RAG-disabled (workspace undefined) path
- Modify: `apps/vscode-extension/src/__tests__/completionProvider.test.ts` — add 3 tests for RAG context injection

### Step 1: Write new failing tests for completionProvider

Add the following three tests to the bottom of `src/__tests__/completionProvider.test.ts`:

```typescript
import { Retriever } from '../../rag/retriever'

// --- RAG context injection ---
describe('RAG context injection', () => {
  test('prepends retrieved context when ragEnabled is true', async () => {
    // Arrange — mock Retriever
    const mockRetriever = {
      query: vi.fn().mockResolvedValue([
        { filePath: '/project/utils.ts', startLine: 0, endLine: 5, content: 'export function add(a, b) { return a + b }' },
      ]),
    } as unknown as Retriever

    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn().mockImplementation((key: string, def: unknown) => {
        if (key === 'enabled') return true
        if (key === 'ragEnabled') return true
        if (key === 'ragTopK') return 3
        if (key === 'ragMaxContextChars') return 2000
        return def
      }),
      update: vi.fn(),
    } as unknown as vscode.WorkspaceConfiguration)

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'const result = add(1, 2)' }),
    } as unknown as Response)

    const provider = new SovereignCompletionProvider(mockRetriever)
    const doc = makeDoc('const result = ')
    const pos = new vscode.Position(0, 15)
    const ctx = { triggerKind: vscode.InlineCompletionTriggerKind.Invoke }
    const token = makeToken()

    const result = await provider.provideInlineCompletionItems(doc, pos, ctx as vscode.InlineCompletionContext, token)
    const items = Array.isArray(result) ? result : (result as vscode.InlineCompletionList).items

    expect(mockRetriever.query).toHaveBeenCalledOnce()
    expect(items.length).toBe(1)

    // Verify the prompt sent to fetch included context header
    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0]
    const body = JSON.parse(fetchCall[1]?.body as string) as { prompt: string }
    expect(body.prompt).toContain('// Context from workspace:')
    expect(body.prompt).toContain('export function add(a, b)')
  })

  test('skips RAG when ragEnabled is false', async () => {
    const mockRetriever = { query: vi.fn() } as unknown as Retriever

    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn().mockImplementation((key: string, def: unknown) => {
        if (key === 'enabled') return true
        if (key === 'ragEnabled') return false
        return def
      }),
      update: vi.fn(),
    } as unknown as vscode.WorkspaceConfiguration)

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'completion' }),
    } as unknown as Response)

    const provider = new SovereignCompletionProvider(mockRetriever)
    const doc = makeDoc('const x = ')
    const pos = new vscode.Position(0, 10)
    const ctx = { triggerKind: vscode.InlineCompletionTriggerKind.Invoke }
    const token = makeToken()

    await provider.provideInlineCompletionItems(doc, pos, ctx as vscode.InlineCompletionContext, token)
    expect(mockRetriever.query).not.toHaveBeenCalled()
  })

  test('completion still works when retriever is null', async () => {
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn().mockImplementation((_key: string, def: unknown) => def),
      update: vi.fn(),
    } as unknown as vscode.WorkspaceConfiguration)

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'completion' }),
    } as unknown as Response)

    const provider = new SovereignCompletionProvider(null)
    const doc = makeDoc('const x = ')
    const pos = new vscode.Position(0, 10)
    const ctx = { triggerKind: vscode.InlineCompletionTriggerKind.Invoke }
    const token = makeToken()

    const result = await provider.provideInlineCompletionItems(doc, pos, ctx as vscode.InlineCompletionContext, token)
    const items = Array.isArray(result) ? result : (result as vscode.InlineCompletionList).items
    expect(items.length).toBe(1)
  })
})
```

Note: `makeDoc` and `makeToken` are helpers already defined in the existing `completionProvider.test.ts`. If named differently there, use the existing helper names.

### Step 2: Run new tests to verify they fail

```bash
cd apps/vscode-extension && npm test -- src/__tests__/completionProvider.test.ts
```

Expected: the 3 new tests **FAIL** — `SovereignCompletionProvider` doesn't accept retriever yet.

### Step 3: Update `src/completionProvider.ts`

Replace the full file with:

```typescript
import * as vscode from 'vscode'
import { getCompletion } from './ollamaClient'
import type { Retriever } from './rag/retriever'

const MAX_PREFIX_CHARS = 2000
const RAG_QUERY_CHARS = 300  // use last N chars of prefix as the query for retrieval

export class SovereignCompletionProvider implements vscode.InlineCompletionItemProvider {
  constructor(private readonly retriever: Retriever | null = null) {}

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken,
  ): Promise<vscode.InlineCompletionItem[] | vscode.InlineCompletionList> {
    const config = vscode.workspace.getConfiguration('sovereign-coder')
    const enabled = config.get<boolean>('enabled', true)
    const triggerOnTyping = config.get<boolean>('triggerOnTyping', true)

    if (!enabled) return []

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
    const ragEnabled = config.get<boolean>('ragEnabled', true)
    const ragTopK = config.get<number>('ragTopK', 3)
    const ragMaxContextChars = config.get<number>('ragMaxContextChars', 2000)

    const prefix = document
      .getText(new vscode.Range(new vscode.Position(0, 0), position))
      .slice(-MAX_PREFIX_CHARS)

    // Retrieve project context
    let contextBlock = ''
    if (ragEnabled && this.retriever) {
      const queryText = prefix.slice(-RAG_QUERY_CHARS)
      const chunks = await this.retriever.query(queryText, ragTopK)
      if (chunks.length > 0) {
        const contextBody = chunks
          .map(c => `// ${c.filePath}:${c.startLine}-${c.endLine}\n${c.content}`)
          .join('\n\n')
          .slice(0, ragMaxContextChars)
        contextBlock = `// Context from workspace:\n${contextBody}\n\n`
      }
    }

    if (token.isCancellationRequested) return []

    const abortController = new AbortController()
    const cancelListener = token.onCancellationRequested?.(() => abortController.abort())

    try {
      const text = await getCompletion(
        ollamaUrl,
        model,
        contextBlock + prefix,
        maxTokens,
        abortController.signal,
      )

      if (token.isCancellationRequested || !text) return []

      return [new vscode.InlineCompletionItem(text)]
    } finally {
      cancelListener?.dispose()
    }
  }
}
```

### Step 4: Update `src/extension.ts` to create ChunkStore + Retriever + Indexer

Replace the full file with:

```typescript
import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { SovereignCompletionProvider } from './completionProvider'
import { createStatusBar } from './statusBar'
import { checkOllamaOnline } from './ollamaClient'
import { ChunkStore } from './rag/store'
import { Retriever } from './rag/retriever'
import { Indexer } from './rag/indexer'

const POLL_INTERVAL_MS = 30_000

export function activate(context: vscode.ExtensionContext): void {
  const statusBar = createStatusBar()
  statusBar.setLoading()

  // Set up RAG if a workspace folder is available
  let retriever: Retriever | null = null
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (workspaceFolders && workspaceFolders.length > 0) {
    const workspaceRoot = workspaceFolders[0].uri.fsPath
    const dbDir = path.join(workspaceRoot, '.sovereign-coder')
    fs.mkdirSync(dbDir, { recursive: true })

    const cfg = vscode.workspace.getConfiguration('sovereign-coder')
    const ollamaUrl = cfg.get<string>('ollamaUrl', 'http://localhost:11434')
    const embeddingModel = cfg.get<string>('embeddingModel', 'nomic-embed-text')

    const store = new ChunkStore(path.join(dbDir, 'index.db'))
    retriever = new Retriever(store, ollamaUrl, embeddingModel)
    const indexer = new Indexer(store, ollamaUrl, embeddingModel)

    void indexer.start(workspaceRoot)
    context.subscriptions.push({ dispose: () => { indexer.stop(); store.dispose() } })
  }

  // Register inline completion provider for all files
  const provider = new SovereignCompletionProvider(retriever)
  const providerDisposable = vscode.languages.registerInlineCompletionItemProvider(
    { pattern: '**' },
    provider,
  )
  context.subscriptions.push(providerDisposable)

  // Register toggle command
  const commandDisposable = vscode.commands.registerCommand(
    'sovereign-coder.toggleCompletions',
    () => {
      const config = vscode.workspace.getConfiguration('sovereign-coder')
      const current = config.get<boolean>('enabled', true)
      void config.update('enabled', !current, vscode.ConfigurationTarget.Global)
    },
  )
  context.subscriptions.push(commandDisposable)

  // Push status bar disposal to subscriptions
  context.subscriptions.push({ dispose: () => statusBar.dispose() })

  // Online check + periodic polling
  async function checkOnline(): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('sovereign-coder')
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

### Step 5: Verify the extension test still uses `toBe(4)` for subscriptions

Open `src/__tests__/extension.test.ts`. The test for subscriptions should still pass because `vscode.workspace.workspaceFolders` is `undefined` in the mock (RAG path skipped → still exactly 4 subscriptions: provider, command, statusBar, polling).

If the test currently asserts `toBe(4)`, leave it as-is. If it still says `toBeGreaterThan(0)`, change it to `toBe(4)`.

### Step 6: Run all tests

```bash
cd apps/vscode-extension && npm test
```

Expected: **24 + 3 = 27 tests pass** — all existing tests still pass, 3 new completionProvider RAG tests pass.

If any test fails, debug before committing.

### Step 7: Commit

```bash
git add apps/vscode-extension/src/
git commit -m "feat(vscode-ext/rag): wire Retriever into CompletionProvider and extension activate()"
```

---

## Task 8: Final Verification

**Files:** No new files. Verify everything, fix any issues, update `.vscodeignore`, final commit.

### Step 1: Run full test suite with coverage

```bash
cd apps/vscode-extension && npm test -- --coverage
```

Expected:
- **27+ tests pass**, 0 failures
- `chunker.ts` coverage: ≥ 85%
- `embedder.ts` coverage: 100%
- `store.ts` coverage: ≥ 90%
- `retriever.ts` coverage: 100%
- `indexer.ts` coverage: ≥ 80%
- `completionProvider.ts` coverage: ≥ 85%

### Step 2: TypeScript strict check

```bash
cd apps/vscode-extension && npx tsc --noEmit
```

Expected: **0 errors**. If there are type errors, fix them before proceeding.

Common fixes needed:
- `import type` for `Retriever` in `completionProvider.ts` (already done above — ensure it doesn't cause circular reference)
- `fs` import in `extension.ts` needs `@types/node` (already in devDependencies)

### Step 3: Add `.sovereign-coder/` to `.vscodeignore`

The index database must not be bundled into a VSIX. Check `apps/vscode-extension/.vscodeignore` and add:

```
.sovereign-coder/
src/__tests__/
src/__mocks__/
```

If these are already there, skip. If not, add them.

### Step 4: Add distribution note to README (optional but useful)

If `apps/vscode-extension/README.md` exists, add a section noting that `nomic-embed-text` must be installed in Ollama for RAG to work:

```
ollama pull nomic-embed-text
```

If no README exists, skip this step.

### Step 5: Verify no hardcoded URLs in non-config source

```bash
grep -rn "localhost:11434" apps/vscode-extension/src/ --include="*.ts" --exclude-dir="__tests__" --exclude-dir="__mocks__"
```

Expected: only in `ollamaClient.ts`, `completionProvider.ts`, and `extension.ts` as `config.get(...)` default values.

### Step 6: Final commit

```bash
git add apps/vscode-extension/
git commit -m "feat(vscode-ext/rag): complete RAG context system — indexer, store, retriever, embedder, chunker"
```

---

## Notes for Distribution

> **Known limitation (out of scope for this plan):** `better-sqlite3` is a native Node.js module. When packaging the extension as a `.vsix` for the VS Code Marketplace, the native binary must be rebuilt for the Electron version used by VS Code. This requires running `electron-rebuild` or using `@vscode/vsce` with `--target` flags. For local development and `npm test` (Vitest/Node.js), no rebuild is needed.
>
> When this extension is ready for Marketplace distribution, add to `package.json`:
> ```json
> "scripts": {
>   "rebuild": "electron-rebuild -v 28.x.x -m node_modules/better-sqlite3"
> }
> ```
