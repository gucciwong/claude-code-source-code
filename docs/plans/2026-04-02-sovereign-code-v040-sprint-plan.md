> Plan Status: Closed on 2026-04-04. This file is a historical planning artifact; execution tracking is consolidated in docs/plans/2026-04-04-plan-closure-report.md.

# Sovereign Code v0.4.0 Sprint Development Plan
**Personal Knowledge Library (PKL) System**

| Field | Value |
|---|---|
| Version | v0.4.0 |
| Sprint Duration | 10 weeks |
| Target GA | June 30, 2026 |
| Author | Sovereign Code Team |
| Created | 2026-04-02 |
| Status | Planning |
| Depends On | v0.3.x (HuggingFace + China Mirror) |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Week-by-Week Sprint Plan](#3-week-by-week-sprint-plan)
4. [File-Level Implementation Details](#4-file-level-implementation-details)
5. [API Specification](#5-api-specification)
6. [Database Schema](#6-database-schema)
7. [Integration Points](#7-integration-points)
8. [Test Plan](#8-test-plan)
9. [Success Criteria](#9-success-criteria)
10. [Dependencies and Risks](#10-dependencies-and-risks)

---

## 1. Overview

### 1.1 Goal

Build the Personal Knowledge Library (PKL) system that continuously learns from every user interaction and injects relevant prior knowledge into model prompts — making Sovereign Code smarter with every session.

### 1.2 Core Capabilities

| Capability | Description |
|---|---|
| **Auto-Population** | Extract code patterns, approaches, and decisions from completions |
| **Semantic Search** | Find relevant past knowledge using e5-small-v2 embeddings |
| **Context Injection** | Inject top-K relevant snippets before any model call |
| **Manual Curation** | Users can edit `memory.md`, tag snippets, and add domain notes |
| **Domain Expertise** | Track per-language/framework skill progression |

### 1.3 User Stories

- As a developer, I want Sovereign Code to remember how I prefer to structure React components so I don't have to repeat myself.
- As a developer, I want to search my past solutions semantically so I can find "how I solved that async pagination problem" without opening files.
- As a developer, I want Sovereign Code to get measurably better at my specific stack the longer I use it.
- As a team lead, I want to export my knowledge library so new team members can bootstrap with my patterns.

---

## 2. Architecture

### 2.1 System Diagram

```
User Interaction
    │
    ▼
Completion/Task Event
    │
    ▼
Pattern Extractor (TypeScript)
    ├── Code Pattern (snippet + context)
    ├── Methodology (approach description)
    ├── Decision (rationale captured)
    └── Quality Score
    │
    ▼
PKL Storage Layer
    ├── ~/.sovereign-code/knowledge/
    │   ├── memory.md         (manual notes, editable)
    │   ├── config.json       (PKL settings)
    │   ├── snippets/         (auto-extracted code patterns)
    │   │   └── {id}.json
    │   └── decisions/        (architectural decisions)
    │       └── {id}.json
    └── ~/.sovereign-code/embeddings.db  (SQLite)
        ├── snippets table    (id, text, vector, metadata)
        └── keywords table    (FTS5 full-text search)
    │
    ▼
Knowledge Service (FastAPI, port 8003)
    ├── POST /embed           (text → vector)
    ├── GET  /search          (query → top-K results)
    └── GET  /health
    │
    ▼
Context Injector (TypeScript)
    ├── Hybrid Ranker (semantic + keyword + recency)
    ├── Token Budget Manager (max 8K tokens)
    ├── Relevance Filter (threshold: 0.7 similarity)
    └── Prompt Builder
    │
    ▼
Model Request (with PKL context prepended)
```

### 2.2 New Components

| Component | Type | Location |
|---|---|---|
| `knowledge-service` | FastAPI service | `services/knowledge-service/` |
| `Knowledge.tsx` | React screen | `apps/desktop/src/renderer/screens/` |
| `knowledgeLibraryStore.ts` | Zustand store | `apps/desktop/src/renderer/store/` |
| `useKnowledgeLibrary.ts` | React hook | `apps/desktop/src/renderer/hooks/` |
| `PatternExtractor.ts` | Event handler | `apps/desktop/src/main/` |
| `ContextInjector.ts` | Prompt modifier | `apps/desktop/src/main/` |
| `KnowledgeCard.tsx` | UI component | `apps/desktop/src/renderer/components/knowledge/` |
| `SnippetBrowser.tsx` | UI component | `apps/desktop/src/renderer/components/knowledge/` |
| `DecisionLog.tsx` | UI component | `apps/desktop/src/renderer/components/knowledge/` |
| `DomainExpertise.tsx` | UI component | `apps/desktop/src/renderer/components/knowledge/` |

### 2.3 Modified Components

| Component | Modification |
|---|---|
| `Sidebar.tsx` | Add Knowledge nav item (BookOpen icon) |
| `App.tsx` | Add `/knowledge` route |
| `navigationStore.ts` | Add `'knowledge'` as valid screen |
| `chatStore.ts` | Call context injector before model submit |
| `StatusBar.tsx` | Add PKL item count indicator |
| `settings/` | Add PKL settings tab |

---

## 3. Week-by-Week Sprint Plan

### Week 1-2: Storage Foundation

**Goal:** Persistent knowledge storage layer with file system and SQLite

**Tasks:**
- [ ] Create `~/.sovereign-code/knowledge/` directory structure on first launch
- [ ] Implement `config.json` schema and reader/writer
- [ ] Create `memory.md` template with initial content
- [ ] Build `markdown-it` parser for `memory.md` read/write
- [ ] Design SQLite schema for `embeddings.db` (snippets + keywords FTS5)
- [ ] Implement `KnowledgeStorage` class (TypeScript)
- [ ] Create `knowledgeLibraryStore.ts` Zustand store with initial state
- [ ] Write unit tests for storage layer (target: 15 tests)

**Deliverables:**
- `apps/desktop/src/main/knowledge/KnowledgeStorage.ts`
- `apps/desktop/src/main/knowledge/migrations/001_initial.sql`
- `apps/desktop/src/renderer/store/knowledgeLibraryStore.ts`
- Unit tests: `KnowledgeStorage.test.ts`

**Acceptance Criteria:**
- [ ] Knowledge directory created on app first-launch
- [ ] `memory.md` readable and writable without data loss
- [ ] SQLite DB initialized with correct schema
- [ ] All 15 unit tests passing

---

### Week 3-4: Auto-Learning Pipeline

**Goal:** Extract knowledge from AI completions automatically

**Tasks:**
- [ ] Hook into completion event stream in `chatStore.ts`
- [ ] Implement `PatternExtractor.ts` — extract code blocks, summaries, approaches
- [ ] Build quality scorer (length, specificity, uniqueness)
- [ ] Implement deduplication logic (hash-based for exact, embedding-based for near-duplicate)
- [ ] Task completion hook → save methodology + rationale
- [ ] Build background indexing worker (Node.js Worker thread)
- [ ] Implement rate limiting (max 5 extractions per completion)
- [ ] Write unit tests for extractor (target: 20 tests)

**Deliverables:**
- `apps/desktop/src/main/knowledge/PatternExtractor.ts`
- `apps/desktop/src/main/knowledge/QualityScorer.ts`
- `apps/desktop/src/main/knowledge/DeduplicationEngine.ts`
- `apps/desktop/src/main/knowledge/IndexWorker.ts` (Worker thread)
- Unit tests: `PatternExtractor.test.ts`, `QualityScorer.test.ts`

**Acceptance Criteria:**
- [ ] Code patterns extracted from AI completions automatically
- [ ] No duplicate snippets stored
- [ ] Quality score > 0.6 required for storage
- [ ] Extraction does not block UI thread (async worker)
- [ ] All 20 unit tests passing

---

### Week 5-6: Knowledge Service (Embeddings)

**Goal:** Python FastAPI service for embedding generation and semantic search

**Tasks:**
- [ ] Bootstrap `services/knowledge-service/` FastAPI app
- [ ] Integrate `sentence-transformers` with `e5-small-v2` model
- [ ] Implement `POST /embed` endpoint (single + batch)
- [ ] Implement `GET /search` endpoint with cosine similarity
- [ ] Implement hybrid ranking (semantic + BM25 keyword + recency decay)
- [ ] Add model caching (load once, serve many)
- [ ] Create `requirements.txt` and `pyproject.toml`
- [ ] Health check endpoint `GET /health`
- [ ] TypeScript client `useKnowledgeService.ts` hook
- [ ] Write service tests (target: 15 tests)
- [ ] Add service auto-start in Electron main process

**Deliverables:**
- `services/knowledge-service/main.py`
- `services/knowledge-service/knowledge_service/embeddings.py`
- `services/knowledge-service/knowledge_service/search.py`
- `services/knowledge-service/requirements.txt`
- `apps/desktop/src/renderer/hooks/useKnowledgeLibrary.ts`
- Service tests: `test_embeddings.py`, `test_search.py`

**Acceptance Criteria:**
- [ ] `e5-small-v2` model loads in < 3s on first request
- [ ] Subsequent embed requests < 50ms
- [ ] Search returns top-10 results with similarity scores
- [ ] Service starts/stops with Electron app lifecycle
- [ ] All 15 tests passing

---

### Week 7-8: Context Injection

**Goal:** Inject relevant PKL context into every model call automatically

**Tasks:**
- [ ] Implement `ContextInjector.ts` — wraps prompt builder
- [ ] Add pre-call hook in `chatStore.ts` submit handler
- [ ] Build token budget manager (max 8K tokens from PKL)
- [ ] Implement relevance filter (similarity threshold: 0.7)
- [ ] Add negative example filter (skip rejected/low-rated snippets)
- [ ] Build prompt template for PKL context block:
  ```
  <knowledge_context>
  Based on your past work:
  {top-3 relevant snippets}
  </knowledge_context>
  ```
- [ ] Add toggle in settings to enable/disable context injection
- [ ] Performance test: injection must add < 200ms to prompt build time
- [ ] Write integration tests (target: 10 tests)

**Deliverables:**
- `apps/desktop/src/main/knowledge/ContextInjector.ts`
- `apps/desktop/src/main/knowledge/TokenBudgetManager.ts`
- `apps/desktop/src/main/knowledge/RelevanceFilter.ts`
- Integration tests: `ContextInjector.test.ts`

**Acceptance Criteria:**
- [ ] Top-3 relevant snippets injected before every model call
- [ ] Total PKL context ≤ 8K tokens always enforced
- [ ] Snippets below 0.7 similarity excluded
- [ ] Injection disabled when toggle is off
- [ ] No measurable latency regression on prompt build

---

### Week 9-10: Knowledge Screen UI + Beta Testing

**Goal:** Knowledge management UI and internal beta validation

**Tasks:**
- [ ] Build `Knowledge.tsx` screen with 4 tab layout
- [ ] `KnowledgeCard.tsx` — snippet display with copy/delete/rate
- [ ] `SnippetBrowser.tsx` — filterable list with language/domain filters
- [ ] `DecisionLog.tsx` — timeline view of architectural decisions
- [ ] `DomainExpertise.tsx` — language skill visualization bars
- [ ] Memory.md editor (Monaco) in "Notes" tab
- [ ] Add Knowledge to sidebar nav (BookOpen icon, position 3)
- [ ] Add PKL item count to StatusBar
- [ ] PKL Settings tab (toggle injection, max tokens, quality threshold)
- [ ] Export/import knowledge library (ZIP)
- [ ] Internal beta rollout (10-15 users)
- [ ] Bug fixes from beta feedback
- [ ] Performance profiling (< 200ms search, < 50ms injection)
- [ ] Accessibility audit (WCAG AA)

**Deliverables:**
- `apps/desktop/src/renderer/screens/Knowledge.tsx`
- `apps/desktop/src/renderer/components/knowledge/KnowledgeCard.tsx`
- `apps/desktop/src/renderer/components/knowledge/SnippetBrowser.tsx`
- `apps/desktop/src/renderer/components/knowledge/DecisionLog.tsx`
- `apps/desktop/src/renderer/components/knowledge/DomainExpertise.tsx`
- `apps/desktop/src/renderer/components/knowledge/index.ts`
- UI tests: `Knowledge.test.tsx`, `SnippetBrowser.test.tsx`
- Beta feedback summary document

**Acceptance Criteria:**
- [ ] All 4 Knowledge tabs functional
- [ ] Search latency < 200ms (p95 across 1,000 snippets)
- [ ] Memory.md edits persist across sessions
- [ ] Export produces valid ZIP with all user knowledge
- [ ] Beta testers report PKL relevant ≥ 70% of the time (subjective survey)
- [ ] All UI tests passing (target: 25 tests)
- [ ] No WCAG AA violations

---

## 4. File-Level Implementation Details

### 4.1 Knowledge Storage

**`apps/desktop/src/main/knowledge/KnowledgeStorage.ts`**
```typescript
import Database from 'better-sqlite3'
import path from 'path'
import os from 'os'
import fs from 'fs'

export interface Snippet {
  id: string
  text: string
  language: string
  domain: string
  qualityScore: number
  usageCount: number
  createdAt: number
  updatedAt: number
  tags: string[]
  rejected: boolean
}

export interface Decision {
  id: string
  summary: string
  rationale: string
  alternatives: string[]
  outcome: string
  timestamp: number
  projectPath: string
}

export class KnowledgeStorage {
  private db: Database.Database
  private knowledgeDir: string

  constructor() {
    this.knowledgeDir = path.join(os.homedir(), '.sovereign-code', 'knowledge')
    fs.mkdirSync(this.knowledgeDir, { recursive: true })
    fs.mkdirSync(path.join(this.knowledgeDir, 'snippets'), { recursive: true })
    fs.mkdirSync(path.join(this.knowledgeDir, 'decisions'), { recursive: true })
    this.db = new Database(
      path.join(os.homedir(), '.sovereign-code', 'embeddings.db')
    )
    this.initialize()
  }

  private initialize(): void {
    this.db.exec(fs.readFileSync(
      path.join(__dirname, 'migrations/001_initial.sql'), 'utf-8'
    ))
  }

  saveSnippet(snippet: Snippet): void { /* ... */ }
  getSnippet(id: string): Snippet | null { /* ... */ }
  saveVector(id: string, vector: Float32Array): void { /* ... */ }
  searchByVector(queryVector: Float32Array, topK: number): Array<{id: string, similarity: number}> { /* ... */ }
  getMemoryMarkdown(): string { /* ... */ }
  saveMemoryMarkdown(content: string): void { /* ... */ }
  getConfig(): PKLConfig { /* ... */ }
  saveConfig(config: PKLConfig): void { /* ... */ }
  exportLibrary(): Buffer { /* returns ZIP */ }
}
```

### 4.2 Knowledge Store

**`apps/desktop/src/renderer/store/knowledgeLibraryStore.ts`**
```typescript
import { create } from 'zustand'

export interface KnowledgeLibraryState {
  snippets: Snippet[]
  decisions: Decision[]
  memoryMarkdown: string
  domainStats: DomainStat[]
  totalItems: number
  isIndexing: boolean
  searchQuery: string
  searchResults: SearchResult[]
  injectionEnabled: boolean

  // Actions
  loadSnippets: () => Promise<void>
  searchKnowledge: (query: string) => Promise<void>
  deleteSnippet: (id: string) => Promise<void>
  rateSnippet: (id: string, rating: number) => Promise<void>
  updateMemoryMarkdown: (content: string) => Promise<void>
  exportLibrary: () => Promise<void>
  importLibrary: (file: File) => Promise<void>
  setInjectionEnabled: (enabled: boolean) => void
}

export const useKnowledgeLibraryStore = create<KnowledgeLibraryState>(set => ({
  snippets: [],
  decisions: [],
  memoryMarkdown: '',
  domainStats: [],
  totalItems: 0,
  isIndexing: false,
  searchQuery: '',
  searchResults: [],
  injectionEnabled: true,
  // ... action implementations
}))
```

### 4.3 Pattern Extractor

**`apps/desktop/src/main/knowledge/PatternExtractor.ts`**
```typescript
export interface ExtractedPattern {
  type: 'code' | 'methodology' | 'decision'
  text: string
  language?: string
  context: string
  qualityScore: number
  tags: string[]
}

export class PatternExtractor {
  extract(completion: string, userPrompt: string): ExtractedPattern[] {
    const patterns: ExtractedPattern[] = []
    // Extract fenced code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]+?)```/g
    // ... implementation
    return patterns.filter(p => p.qualityScore >= 0.6)
  }

  private scoreQuality(text: string, type: string): number {
    // Factors: length (20-500 lines ideal), specificity, uniqueness
    // Returns 0.0-1.0
  }
}
```

### 4.4 Context Injector

**`apps/desktop/src/main/knowledge/ContextInjector.ts`**
```typescript
import { KnowledgeStorage } from './KnowledgeStorage'
import { KnowledgeServiceClient } from './KnowledgeServiceClient'

export class ContextInjector {
  private storage: KnowledgeStorage
  private client: KnowledgeServiceClient
  private maxTokens = 8192
  private similarityThreshold = 0.7

  async buildContext(userPrompt: string): Promise<string> {
    if (!this.isEnabled()) return ''

    const queryVector = await this.client.embed(userPrompt)
    const candidates = this.storage.searchByVector(queryVector, 20)
    const relevant = candidates.filter(c => c.similarity >= this.similarityThreshold)
    const topK = this.selectWithinBudget(relevant, 3)

    if (topK.length === 0) return ''

    return this.formatContext(topK)
  }

  private formatContext(results: SearchResult[]): string {
    return [
      '<knowledge_context>',
      'Based on your past work:',
      ...results.map(r => `\n${r.text}`),
      '</knowledge_context>',
    ].join('\n')
  }

  private selectWithinBudget(results: SearchResult[], maxCount: number): SearchResult[] {
    let tokens = 0
    return results.slice(0, maxCount).filter(r => {
      const est = r.text.length / 4  // rough token estimate
      if (tokens + est > this.maxTokens) return false
      tokens += est
      return true
    })
  }
}
```

### 4.5 Knowledge Screen

**`apps/desktop/src/renderer/screens/Knowledge.tsx`**
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs'
import { SnippetBrowser } from '../components/knowledge/SnippetBrowser'
import { DecisionLog } from '../components/knowledge/DecisionLog'
import { DomainExpertise } from '../components/knowledge/DomainExpertise'
import { BookOpen, Code2, GitFork, Gauge } from 'lucide-react'

export function Knowledge() {
  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border-subtle">
        <BookOpen size={20} aria-hidden="true" className="text-accent-400" />
        <h1 className="text-lg font-semibold text-text-primary">Knowledge Library</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="snippets" className="flex-1 flex flex-col min-h-0">
        <TabsList className="flex gap-1 px-6 pt-3 border-b border-border-subtle">
          <TabsTrigger value="snippets">Code Patterns</TabsTrigger>
          <TabsTrigger value="decisions">Decision Log</TabsTrigger>
          <TabsTrigger value="domains">Domain Expertise</TabsTrigger>
          <TabsTrigger value="notes">Memory Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="snippets" className="flex-1 overflow-auto p-6">
          <SnippetBrowser />
        </TabsContent>
        <TabsContent value="decisions" className="flex-1 overflow-auto p-6">
          <DecisionLog />
        </TabsContent>
        <TabsContent value="domains" className="flex-1 overflow-auto p-6">
          <DomainExpertise />
        </TabsContent>
        <TabsContent value="notes" className="flex-1 p-6">
          {/* Monaco editor for memory.md */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## 5. API Specification

### Knowledge Service (FastAPI, port 8003)

**`POST /embed`** — Generate embedding vector
```json
// Request
{
  "text": "string — text to embed",
  "batch": ["optional array for batch embedding"]
}

// Response
{
  "vector": [0.123, -0.456, ...],  // 384-dim float array
  "model": "e5-small-v2",
  "processing_time_ms": 23
}

// Batch Response
{
  "vectors": [[...], [...]],
  "count": 2,
  "processing_time_ms": 45
}
```

**`GET /search`** — Search knowledge by query
```json
// Query params: q (string), top_k (int, default 10), threshold (float, default 0.7)

// Response
{
  "results": [
    {
      "id": "snip_abc123",
      "text": "...",
      "similarity": 0.873,
      "language": "typescript",
      "domain": "react",
      "created_at": 1712345678
    }
  ],
  "count": 3,
  "query_time_ms": 12
}
```

**`GET /health`** — Service health
```json
{
  "status": "ok",
  "version": "0.1.0",
  "model_loaded": true,
  "db_connected": true,
  "snippet_count": 1247
}
```

### IPC Channels (Electron main ↔ renderer)

| Channel | Direction | Payload |
|---|---|---|
| `knowledge:search` | renderer → main | `{ query: string, topK: number }` |
| `knowledge:search:result` | main → renderer | `SearchResult[]` |
| `knowledge:save-snippet` | renderer → main | `Snippet` |
| `knowledge:delete-snippet` | renderer → main | `{ id: string }` |
| `knowledge:get-memory` | renderer → main | `{}` |
| `knowledge:save-memory` | renderer → main | `{ content: string }` |
| `knowledge:export` | renderer → main | `{}` |
| `knowledge:import` | renderer → main | `{ filePath: string }` |
| `knowledge:get-stats` | renderer → main | `{}` |
| `knowledge:stats` | main → renderer | `DomainStats[]` |

---

## 6. Database Schema

**`~/.sovereign-code/embeddings.db`** (SQLite)

```sql
-- migrations/001_initial.sql

CREATE TABLE IF NOT EXISTS snippets (
  id          TEXT PRIMARY KEY,
  text        TEXT NOT NULL,
  language    TEXT,
  domain      TEXT,
  quality     REAL DEFAULT 0.0,
  usage_count INTEGER DEFAULT 0,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  rejected    INTEGER DEFAULT 0,  -- boolean
  tags        TEXT DEFAULT '[]'   -- JSON array
);

-- FTS5 for keyword search
CREATE VIRTUAL TABLE IF NOT EXISTS snippets_fts
  USING fts5(id UNINDEXED, text, language, domain, content=snippets);

-- Embeddings stored as BLOB (Float32Array serialized)
CREATE TABLE IF NOT EXISTS embeddings (
  snippet_id  TEXT PRIMARY KEY REFERENCES snippets(id) ON DELETE CASCADE,
  vector      BLOB NOT NULL,         -- 384 x 4 bytes = 1536 bytes
  model       TEXT DEFAULT 'e5-small-v2'
);

CREATE TABLE IF NOT EXISTS decisions (
  id           TEXT PRIMARY KEY,
  summary      TEXT NOT NULL,
  rationale    TEXT,
  alternatives TEXT DEFAULT '[]',    -- JSON array
  outcome      TEXT,
  project_path TEXT,
  timestamp    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS domain_stats (
  domain       TEXT PRIMARY KEY,
  language     TEXT,
  snippet_count INTEGER DEFAULT 0,
  last_updated INTEGER
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_domain ON snippets(domain);
CREATE INDEX IF NOT EXISTS idx_snippets_quality ON snippets(quality DESC);
CREATE INDEX IF NOT EXISTS idx_snippets_created ON snippets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_timestamp ON decisions(timestamp DESC);
```

**Cosine Similarity Search (application-level)**

SQLite does not natively compute cosine similarity. Implementation:
1. Load all `embeddings` vectors into memory on service start (cached)
2. For search query: embed → compute dot product with all cached vectors → sort by score → return top-K
3. Cache refresh: triggered by new snippet save events
4. For scale > 10,000 snippets: switch to `faiss` index (planned for v0.6.0)

---

## 7. Integration Points

### 7.1 Chat Store Integration

**`apps/desktop/src/renderer/store/chatStore.ts`** modifications:

```typescript
// Before: submit message
async function submitMessage(userMessage: string) {
  // ADD: inject PKL context
  const pklContext = await window.electron.ipcRenderer.invoke(
    'knowledge:get-context',
    { query: userMessage }
  )
  
  const finalPrompt = pklContext
    ? `${pklContext}\n\n${userMessage}`
    : userMessage

  // existing model call with finalPrompt
}

// After: receive completion
function onCompletionReceived(completion: string, userMessage: string) {
  // ADD: async extraction (non-blocking)
  window.electron.ipcRenderer.send('knowledge:extract-from-completion', {
    completion,
    userPrompt: userMessage,
  })
  
  // existing store update
}
```

### 7.2 Sidebar Navigation

**`apps/desktop/src/renderer/components/layout/Sidebar.tsx`** modifications:

```typescript
// Add to NAV_ITEMS array (position 3, between Chat and Training):
{ id: 'knowledge', label: 'Knowledge', icon: BookOpen }
```

### 7.3 App Router

**`apps/desktop/src/renderer/App.tsx`** modifications:

```typescript
// Add import and route:
import { Knowledge } from './screens/Knowledge'

// In route switch:
case 'knowledge': return <Knowledge />
```

### 7.4 Status Bar

**`apps/desktop/src/renderer/components/layout/StatusBar.tsx`** modifications:

```typescript
// Add PKL item count segment:
{knowledgeItemCount > 0 && (
  <>
    <span aria-hidden="true">|</span>
    <span className="flex items-center gap-1 text-text-muted">
      <BookOpen size={14} aria-hidden="true" />
      {knowledgeItemCount} memories
    </span>
  </>
)}
```

### 7.5 Main Process Service Lifecycle

**`apps/desktop/src/main/index.ts`** modifications:

```typescript
// Start knowledge service alongside existing services
const knowledgeService = new ServiceManager({
  name: 'knowledge-service',
  port: 8003,
  cwd: path.join(__dirname, '../../../services/knowledge-service'),
  command: 'python -m uvicorn main:app --port 8003',
})

app.on('ready', async () => {
  await knowledgeService.start()
  // existing startup
})

app.on('before-quit', async () => {
  await knowledgeService.stop()
})
```

---

## 8. Test Plan

### 8.1 Unit Tests (Target: 70 tests)

| Module | Test File | Count | Focus |
|---|---|---|---|
| `KnowledgeStorage` | `KnowledgeStorage.test.ts` | 15 | CRUD, migration, exports |
| `PatternExtractor` | `PatternExtractor.test.ts` | 20 | Extraction accuracy, quality scoring |
| `QualityScorer` | `QualityScorer.test.ts` | 10 | Score range, edge cases |
| `DeduplicationEngine` | `Deduplication.test.ts` | 10 | Hash dedup, near-duplicate detection |
| `ContextInjector` | `ContextInjector.test.ts` | 10 | Budget, threshold, formatting |
| `TokenBudgetManager` | `TokenBudget.test.ts` | 5 | Budget enforcement |

### 8.2 UI Component Tests (Target: 25 tests)

| Component | Test File | Count | Focus |
|---|---|---|---|
| `Knowledge.tsx` | `Knowledge.test.tsx` | 8 | Tab rendering, navigation |
| `SnippetBrowser.tsx` | `SnippetBrowser.test.tsx` | 8 | Filter, search, delete |
| `KnowledgeCard.tsx` | `KnowledgeCard.test.tsx` | 5 | Render, copy, rate |
| `DecisionLog.tsx` | `DecisionLog.test.tsx` | 4 | Timeline, filtering |

### 8.3 Integration Tests (Target: 10 tests)

| Scenario | Test |
|---|---|
| Full auto-extraction pipeline | `completion → extract → store → searchable` |
| Context injection flow | `userPrompt → embed → search → inject → model` |
| Memory.md round-trip | `edit → save → reload → same content` |
| Export/import | `export ZIP → clear → import → same snippets` |
| Service lifecycle | `start/stop with Electron, health check` |

### 8.4 Service Tests (Target: 15 tests)

| Test | Description |
|---|---|
| `test_embed_single` | Single text embedding returns 384-dim vector |
| `test_embed_batch` | Batch of 10 texts, all return vectors |
| `test_search_returns_topk` | Search returns at most K results |
| `test_search_threshold` | Results below threshold excluded |
| `test_model_loads_once` | Model not reloaded on each request |
| `test_health_check` | Returns ok when service ready |
| `test_latency_single` | Single embed < 100ms |
| `test_latency_batch_10` | Batch of 10 < 300ms |

### 8.5 Running Tests

```bash
# Unit + UI tests
cd apps/desktop && npm test

# Run specific suite
cd apps/desktop && npm test -- --testPathPattern "Knowledge"

# Knowledge service tests
cd services/knowledge-service && pytest tests/ -v

# Integration tests (requires services running)
cd apps/desktop && npm run test:integration
```

---

## 9. Success Criteria

### 9.1 Technical Acceptance Criteria (Must Pass for GA)

- [ ] All 120 tests pass (`npm test` returns 0 failures)
- [ ] Knowledge service starts in < 5s on first launch (model download)
- [ ] Subsequent service start < 2s (model cached)
- [ ] Single embed request < 100ms (p95)
- [ ] Search query < 200ms (p95) across 1,000 snippets
- [ ] Context injection adds < 200ms to prompt build time
- [ ] Memory.md edits persist across app restarts
- [ ] No memory leaks over 8-hour session (< 50MB growth)
- [ ] Export ZIP < 50MB for 10,000 snippets
- [ ] WCAG AA: no automated accessibility violations

### 9.2 User Experience Criteria (Beta Feedback Must Show)

- [ ] ≥ 70% of beta users report injected context "relevant or very relevant"
- [ ] ≥ 80% of auto-extracted snippets rated "worth keeping" by users
- [ ] Knowledge screen found "intuitive" by ≥ 75% of beta testers
- [ ] Zero data loss incidents during beta

### 9.3 Performance Benchmarks

| Metric | Target | Stretch |
|---|---|---|
| Search latency (1K snippets) | < 200ms | < 50ms |
| Search latency (10K snippets) | < 500ms | < 200ms |
| Auto-extraction per session | ≥ 5 snippets | ≥ 15 snippets |
| Context relevance rate | ≥ 70% | ≥ 85% |
| Model accuracy delta | +15% on user tasks | +25% |

---

## 10. Dependencies and Risks

### 10.1 External Dependencies

| Dependency | Version | Risk | Mitigation |
|---|---|---|---|
| `sentence-transformers` | >=2.2.0 | Medium — first-run download | Cache model in app install |
| `better-sqlite3` | >=9.0.0 | Low | Well-maintained, prebuilds available |
| `@radix-ui/react-tabs` | >=1.0.0 | Low | Already in project |
| `monaco-editor` | >=0.46.0 | Medium — large bundle | Lazy load only on Knowledge screen |
| Python ≥3.10 | N/A | High — must be installed | Bundled Python env or clear install guide |

### 10.2 Technical Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| `e5-small-v2` download fails in offline env | Low | High | Bundle model with installer (adds ~120MB) |
| SQLite vector cosine search too slow at scale | Medium | Medium | Pre-filter by language/domain before vector match |
| Context injection degrades model quality | Low | High | A/B test with injection toggle; user opt-out |
| Pattern extraction too noisy | Medium | Medium | Tune quality threshold; add user feedback loop |
| Electron Worker thread crash corrupts DB | Low | High | WAL journal mode; atomic writes only |

### 10.3 Timeline Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Week 5-6 Python service delayed | Medium | 2-week delay | Start service scaffold in Week 3 in parallel |
| Monaco editor integration complex | Low | 1-week delay | Use simple `<textarea>` for v0.4.0, Monaco in v0.5.0 |
| Beta feedback requires major UX rework | Medium | 1-2 week delay | Build in buffer week before GA |

### 10.4 Soft Dependencies (Cross-Team)

- v0.3.x must be stable and deployed before v0.4.0 work begins
- Design review of Knowledge screen needed by end of Week 8
- Beta user recruitment (10-15 internal devs) needed by Week 9

---

## Appendix A: Directory Structure

The complete file tree for new v0.4.0 code:

```
services/
  knowledge-service/
    main.py
    requirements.txt
    pyproject.toml
    .env.example
    knowledge_service/
      embeddings.py          # e5-small-v2 wrapper
      search.py              # cosine similarity + hybrid ranker
      models.py              # Pydantic request/response models
    tests/
      test_embeddings.py
      test_search.py
      test_health.py

apps/desktop/src/
  main/
    knowledge/
      KnowledgeStorage.ts
      PatternExtractor.ts
      QualityScorer.ts
      DeduplicationEngine.ts
      ContextInjector.ts
      TokenBudgetManager.ts
      RelevanceFilter.ts
      KnowledgeServiceClient.ts
      IndexWorker.ts
      migrations/
        001_initial.sql
    ipc/
      knowledgeHandlers.ts   # IPC channel handlers

  renderer/
    screens/
      Knowledge.tsx

    components/
      knowledge/
        KnowledgeCard.tsx
        SnippetBrowser.tsx
        DecisionLog.tsx
        DomainExpertise.tsx
        MemoryEditor.tsx
        index.ts

    store/
      knowledgeLibraryStore.ts

    hooks/
      useKnowledgeLibrary.ts

    __tests__/
      screens/
        Knowledge.test.tsx
      components/
        knowledge/
          SnippetBrowser.test.tsx
          KnowledgeCard.test.tsx
          DecisionLog.test.tsx
      store/
        knowledgeLibraryStore.test.ts
      hooks/
        useKnowledgeLibrary.test.ts
```

---

## Appendix B: v0.4.0 Definition of Done

A task is complete when ALL of the following are true:
1. **Code written** — implementation matches spec
2. **Tests written** — unit + integration tests exist
3. **Tests passing** — `npm test` reports 0 failures
4. **Linting clean** — `npm run lint` returns no errors
5. **Type-safe** — `npm run type-check` returns no errors
6. **Accessible** — component tested with keyboard nav + screen reader check
7. **Performance** — latency budgets verified with local benchmark
8. **Committed** — `git commit -m "feat(knowledge): <description>"`

---

*Sovereign Code v0.4.0 Sprint Plan — Created 2026-04-02*
*Next plan: v0.5.0 Enterprise Data Integration Sprint*


