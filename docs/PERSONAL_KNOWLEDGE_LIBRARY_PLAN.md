# Personal Knowledge Library Implementation Plan
## Sovereign Code v0.4.0 - Execution Guide

**Phase:** 1 (Months April-June 2026)  
**Duration:** 8-10 weeks  
**Team Size:** 2-3 engineers + 1 PM  
**Sprint Duration:** 2 weeks

---

## Sprint Timeline & Deliverables

### Sprint 1-2: Core Storage & Data Model (Weeks 1-2)

#### Week 1: File Structure & Schema Design

**Goals:**
- Define directory structure
- Create data schemas (TypeScript interfaces)
- Implement file I/O with versioning

**Tasks:**

1. **Create directory structure** (Day 1)
```
~/.sovereign-code/
├── knowledge/
│   ├── memory.md              # Main knowledge base
│   ├── snippets/
│   │   ├── index.json         # Snippet catalog
│   │   ├── patterns/          # Design patterns
│   │   ├── utilities/         # Helper functions
│   │   ├── templates/         # Code templates
│   │   ├── api-calls/         # API integration examples
│   │   └── domain-specific/   # Domain knowledge
│   ├── decisions.md           # Decision log
│   ├── domains.json           # Domain expertise mapping
│   ├── learnings.json         # Pattern effectiveness tracking
│   └── metadata.json          # Library metadata & timestamps
├── cache/
│   ├── embeddings.json        # Cached embeddings
│   ├── search-index.json      # Full-text search index
│   └── metadata.json          # Cache metadata
└── config.json                # User configuration
```

**File:** `apps/desktop/src/renderer/store/knowledgeLibraryStore.ts`
- Initialize Zustand store for knowledge state
- Track loading, dirty, last-modified states
- Handle async file operations

2. **Define TypeScript schemas** (Day 1-2)

**File:** `apps/desktop/src/renderer/types/knowledge.ts`

```typescript
// Snippet with metadata
interface CodeSnippet {
  id: string
  title: string
  description: string
  code: string
  language: string
  category: 'pattern' | 'utility' | 'template' | 'api-call' | 'domain'
  tags: string[]
  created: number
  lastUsed: number
  useCount: number
  rating: 'good' | 'neutral' | 'needs-improvement'
  dependencies: string[]
}

// Decision entry in decision log
interface Decision {
  id: string
  title: string
  context: string // Why we're making this choice
  options: Array<{
    name: string
    pros: string[]
    cons: string[]
  }>
  decided: string // Which option we picked
  reasoning: string
  date: number
  status: 'active' | 'superseded' | 'archive'
  relatedCode?: string[]
}

// Domain expertise mapping
interface DomainExpertise {
  name: string
  description: string
  keywords: string[]
  level: 'beginner' | 'intermediate' | 'expert'
  snippetIds: string[]
  decisionIds: string[]
  notes: string
}

// Learning entry from extracted patterns
interface Learning {
  id: string
  pattern: string // e.g., "async-error-handling", "react-state"
  context: string // When this pattern applies
  effectiveness: number // 0-100 rating
  timesUsed: number
  timesSuccessful: number
  lastSuccessDate: number
  notes: string
}

// Library metadata
interface KnowledgeLibaryMetadata {
  version: string
  lastModified: number
  totalSnippets: number
  totalDecisions: number
  domains: string[]
  statistics: {
    createdSnippets: number
    lastDay: number
    lastWeek: number
    averageRating: number
  }
}
```

3. **File I/O layer** (Day 2-3)

**File:** `apps/desktop/src/main/knowledge-file-loader.ts`

```typescript
import { app } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'

class KnowledgeFileManager {
  private basePath: string
  
  constructor() {
    // Path: ~/.sovereign-code/knowledge/
    this.basePath = path.join(app.getPath('home'), '.sovereign-code', 'knowledge')
  }
  
  async initialize() {
    // Create directories if they don't exist
    const dirs = ['snippets/patterns', 'snippets/utilities', 'cache']
    for (const dir of dirs) {
      await fs.mkdir(path.join(this.basePath, dir), { recursive: true })
    }
  }
  
  async readMemory(): Promise<string> {
    // Read memory.md
  }
  
  async writeMemory(content: string): Promise<void> {
    // Write memory.md with backup
  }
  
  async readSnippets(): Promise<CodeSnippet[]> {
    // Read all snippets from snippets/
  }
  
  async addSnippet(snippet: CodeSnippet): Promise<void> {
    // Add new snippet, update index.json
  }
  
  // ... more methods
}
```

**Week 2: Persistence & Version Control**

1. **File versioning** (Day 4-5)
   - Git integration for memory.md and decisions.md
   - Auto-commit on significant changes
   - Maintain change history with timestamps

2. **Migration system** (Day 5-7)
   - Handle schema upgrades
   - Backward compatibility for older versions
   - Auto-migration on first launch

**PR:** `feat/knowledge-storage-layer`
- All file structures in place
- Test coverage: >90%
- Performance baseline established

---

### Sprint 3-4: Auto-Learning System (Weeks 3-4)

#### Goal: Automatically capture knowledge from user actions

**Tasks:**

1. **Completion tracking** (Day 1-3)

**File:** `apps/desktop/src/renderer/store/completionTracker.ts`

```typescript
class CompletionExtractor {
  // When user accepts a completion:
  
  async onCompletionAccepted(completion: {
    prompt: string
    code: string
    context: string
    language: string
  }) {
    // Extract knowledge
    const snippet = await this.extractSnippet(completion)
    const pattern = await this.identifyPattern(completion)
    const decision = await this.captureDecision(completion)
    
    // Store
    await knowledgeLibrary.addSnippet(snippet)
    await knowledgeLibrary.recordLearning(pattern)
    
    // Update statistics
    this.updatePatternsUsed(pattern)
  }
  
  private async extractSnippet(completion: any): Promise<CodeSnippet> {
    return {
      id: uuid(),
      title: await this.generateTitle(completion.prompt),
      code: completion.code,
      tags: await this.extractTags(completion),
      category: this.categorizeCode(completion.code),
      // ...
    }
  }
  
  private identifyPattern(completion: any): string {
    // ML: Classify what problem was solved
    // Examples: "async-error-handling", "ui-form-validation", etc
    return this.patternClassifier.classify(completion)
  }
}
```

2. **Hook into completion workflow** (Day 3-5)

**File:** `apps/desktop/src/renderer/services/completionService.ts`

```typescript
async function acceptCompletion(completion: Completion) {
  // Existing code...
  
  // NEW: Extract knowledge
  if (settingsStore.getState().autoLearnEnabled) {
    completionExtractor.onCompletionAccepted(completion)
  }
  
  // Apply completion
}
```

3. **Decision log capture** (Day 5-7)

**File:** `apps/desktop/src/renderer/hooks/useDecisionCapture.ts`

```typescript
// Trigger when user:
// - Chooses between multiple completions
// - Edits and significantly modifies completion
// - Solves recurring problem

interface DecisionEvent {
  userChose: string           // Selected option
  alternatives: string[]      // Other options shown
  context: string             // What problem
  timestamp: number
}

// Store as decision entry:
// "When [context], considered [alternatives], chose [userChose]"
```

4. **Testing & validation** (Week 4)
   - Unit tests for extractors (>85%)
   - Integration test: acceptance flow
   - Performance: Extraction should be <100ms

**PR:** `feat/auto-learning-system`
- Tracks 5+ types of user actions
- Extracts 50+ data points per action
- Test coverage: >80%

---

### Sprint 5-6: Embedding & Search (Weeks 5-6)

#### Goal: Enable semantic search on personal knowledge

**Tasks:**

1. **Embedding model integration** (Day 1-3)

**File:** `apps/desktop/src/main/embedding-service.ts`

```typescript
import { Env } from '@xenova/transformers'

class EmbeddingService {
  private model: any // transformers.js model
  
  async initialize() {
    // Download tiny ONNX model first time
    // Use: Xenova/all-MiniLM-L6-v2 (90MB)
    // Runs on CPU, fast enough
    Env.allowLocalModels = false // Don't download from HF
    this.model = await env.AutoModel.from_pretrained(
      'Xenova/all-MiniLM-L6-v2'
    )
  }
  
  async embed(text: string): Promise<number[]> {
    const { data } = await this.model({
      input_ids: this.tokenizer.encode(text),
      attention_mask: [1],
    })
    return Array.from(data)
  }
  
  async embedMultiple(texts: string[]): Promise<number[][]> {
    // Batch processing for efficiency
    return Promise.all(texts.map(t => this.embed(t)))
  }
}
```

2. **Vector database setup** (Day 3-5)

**File:** `apps/desktop/src/main/vector-db.ts`

```typescript
import sqlite3 from 'sqlite3'
import { DatabaseSync } from 'better-sqlite3'

class VectorDatabase {
  private db: any
  
  async initialize() {
    // Create SQLite database with vector extension
    this.db = new DatabaseSync(
      path.join(baseKnowledgePath, 'cache', 'vectors.db')
    )
    
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS embeddings (
        id TEXT PRIMARY KEY,
        source_type TEXT, -- 'snippet', 'decision', 'memory'
        source_id TEXT,
        text TEXT,
        embedding BLOB,  -- Stored as binary
        created INTEGER,
        updated INTEGER
      );
      
      CREATE INDEX idx_source ON embeddings(source_type, source_id);
    `)
  }
  
  async stored(text: string, vector: number[]) {
    // Store binary vector for fast retrieval
    const buffer = Buffer.from(new Float32Array(vector))
    this.db.prepare(`
      INSERT INTO embeddings VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, type, typeId, text, buffer, now, now)
  }
  
  async search(query: string, topK: number = 5): Promise<Match[]> {
    // Embed query
    const queryVec = await embedding.embed(query)
    
    // Find nearest neighbors (cosine similarity)
    const results = this.db.prepare(`
      SELECT id, source_type, source_id, text,
        similarity(embedding, ?) as score
      FROM embeddings
      ORDER BY score DESC
      LIMIT ?
    `).all(Buffer.from(new Float32Array(queryVec)), topK)
    
    return results
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  // Compute similarity between embeddings
}
```

3. **Full-text search fallback** (Day 5-7)

**File:** `apps/desktop/src/main/search-index.ts`

```typescript
class SearchIndexer {
  // For when semantic search isn't enough
  
  private ftsIndex: Map<string, Set<string>> = new Map()
  
  async indexSnippets(snippets: CodeSnippet[]) {
    // Build inverted index
    for (const snippet of snippets) {
      const tokens = this.tokenize(snippet.title + ' ' + snippet.code)
      for (const token of tokens) {
        if (!this.ftsIndex.has(token)) {
          this.ftsIndex.set(token, new Set())
        }
        this.ftsIndex.get(token)!.add(snippet.id)
      }
    }
  }
  
  search(query: string): string[] {
    const tokens = this.tokenize(query)
    const results = new Map<string, number>()
    
    for (const token of tokens) {
      const matching = this.ftsIndex.get(token) || new Set()
      for (const id of matching) {
        results.set(id, (results.get(id) || 0) + 1)
      }
    }
    
    // Return sorted by match count
    return Array.from(results.entries())
      .sort((a, b) => b[1] - a[1])
      .map(e => e[0])
  }
}
```

4. **Performance optimization** (Week 6)
   - Cache hot embeddings in memory
   - Lazy-load embeddings on demand
   - Benchmark: <50ms search on 1000 snippets

**PR:** `feat/embedding-and-search`
- Fast semantic search working
- Full-text search as fallback
- <50ms search latency
- Test coverage: >75%

---

### Sprint 7-8: Context Injection & UI (Weeks 7-10)

#### Goal: Integrate knowledge into model inference & build UI

**Week 7-8: Context Injection (Main Process)**

1. **Prompt enhancement** (Day 1-5)

**File:** `apps/desktop/src/renderer/services/promptBuilder.ts`

```typescript
class PromptBuilder {
  async buildPrompt(userPrompt: string): Promise<string> {
    const knowledge = await knowledgeLibrary.getRelevantContext(userPrompt)
    
    const systemPrompt = `
You are an AI coding assistant for ${userName}.

## User's Personal Knowledge

### Key Patterns & Preferences
${knowledge.preferredPatterns}

### Relevant Code Snippets
${knowledge.snippets.map(s => `
\`\`\`${s.language}
// ${s.title}
${s.code}
\`\`\`
`).join('\n')}

### Relevant Decisions
${knowledge.decisions.map(d => `
- "${d.title}": We decided on ${d.decided} because ${d.reasoning}
`).join('\n')}

### Effectiveness Data
- Pattern "${knowledge.topPattern}": Used ${knowledge.pattern Stats.timesUsed} times, successful ${knowledge.patternStats.successRate}%
${knowledge.personalNotes}

Remember to:
1. Follow ${userName}'s established patterns
2. Reference prior decisions when relevant
3. Build on previous solutions
4. Respect the domain expertise shown in the knowledge base
`;
    
    return systemPrompt + '\n\n' + userPrompt
  }
}
```

2. **Intelligent context selection** (Day 2-3)

```typescript
class ContextSelector {
  async getRelevantContext(query: string, maxTokens: number = 2000) {
    // Semantic search
    const semanticResults = await vectorDb.search(query, topK: 10)
    
    // Full-text search
    const ftsResults = await searchIndex.search(query)
    
    // Combine and deduplicate
    const combined = [...semanticResults, ...ftsResults]
      .filter((v, i, a) => a.findIndex(x => x.id === v.id) === i)
    
    // Select to fit token budget
    let selected = []
    let tokenCount = 0
    
    for (const result of combined) {
      const tokens = this.estimateTokens(result.text)
      if (tokenCount + tokens <= maxTokens) {
        selected.push(result)
        tokenCount += tokens
      } else {
        break
      }
    }
    
    return {
      snippets: selected.filter(r => r.type === 'snippet'),
      decisions: selected.filter(r => r.type === 'decision'),
      personalNotes: knowledge.getPersonalNotes(),
    }
  }
}
```

3. **Testing** (Day 4-5)
   - Test prompt building
   - Verify context relevance
   - Check token counting accuracy

**Week 9-10: UI Components**

1. **Knowledge library screen** (Day 1-3)

**File:** `apps/desktop/src/renderer/screens/KnowledgeLibrary.tsx`

```typescript
export function KnowledgeLibrary() {
  const [tab, setTab] = useState<'overview' | 'snippets' | 'decisions' | 'domains'>('overview')
  const knowledge = useKnowledgeLibrary()
  
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Personal Knowledge Library</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Snippets"
          value={knowledge.snippetCount}
          trend="+3 this week"
          icon={<Code size={20} />}
        />
        <StatCard
          label="Decisions"
          value={knowledge.decisionCount}
          trend="2 this month"
          icon={<CheckCircle2 size={20} />}
        />
        <StatCard
          label="Domains"
          value={knowledge.domains.length}
          icon={<Globe size={20} />}
        />
        <StatCard
          label="Last Updated"
          value={formatDate(knowledge.lastModified)}
          icon={<Clock size={20} />}
        />
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-default">
        {['overview', 'snippets', 'decisions', 'domains'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-4 py-2 font-medium text-sm ${
              tab === t ? 'text-accent-500 border-b-2 border-accent-500' : ''
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      {tab === 'snippets' && <SnippetsView />}
      {tab === 'decisions' && <DecisionsView />}
      {tab === 'domains' && <DomainsView />}
      {tab === 'overview' && <OverviewView />}
    </div>
  )
}
```

2. **Snippet editor** (Day 2-4)

```typedef
// Allow editing/adding snippets manually
<SnippetEditor
  snippet={selected}
  onSave={handleSave}
  onDelete={handleDelete}
/>
```

3. **Settings integration** (Day 4-5)

**File:** `apps/desktop/src/renderer/screens/Settings.tsx` (add Knowledge tab)

```typescript
// Settings → Knowledge tab

<div className="space-y-4">
  <h3 className="font-semibold">Auto-Learning</h3>
  <Toggle
    label="Track accepted completions"
    checked={settings.autoLearnCompletions}
  />
  <Toggle
    label="Learn from debugging sessions"
    checked={settings.autoLearnDebugging}
  />
  <Toggle
    label="Extract domain patterns"
    checked={settings.autoLearnDomains}
  />
  
  <h3 className="font-semibold">Privacy</h3>
  <Toggle
    label="Encrypt knowledge at rest"
    checked={settings.encryptKnowledge}
  />
  
  <h3 className="font-semibold">Maintenance</h3>
  <Button>Export Knowledge Library</Button>
  <Button>Import from Backup</Button>
  <Button>Clear & Reset</Button>
</div>
```

4. **Testing & Polish** (Week 10)
   - E2E tests for full UI workflow
   - Performance profiling
   - UX polish based on feedback

**PR:** `feat/knowledge-ui-and-integration`
- Full UI for knowledge management
- Context injection working
- Tests: E2E coverage >70%

---

## Development Checklist

### Code Organization

```
apps/desktop/src/
├── main/
│   ├── knowledge-file-loader.ts    ✓ Week 1
│   ├── embedding-service.ts        ✓ Week 5
│   ├── vector-db.ts               ✓ Week 5
│   └── search-index.ts            ✓ Week 5
├── renderer/
│   ├── types/
│   │   └── knowledge.ts           ✓ Week 1
│   ├── store/
│   │   ├── knowledgeLibraryStore.ts     ✓ Week 1
│   │   └── completionTracker.ts   ✓ Week 3
│   ├── services/
│   │   ├── promptBuilder.ts       ✓ Week 7
│   │   └── contextSelector.ts     ✓ Week 7
│   ├── hooks/
│   │   ├── useKnowledgeLibrary.ts      ✓ Week 7
│   │   └── useDecisionCapture.ts  ✓ Week 3
│   └── screens/
│       ├── KnowledgeLibrary.tsx        ✓ Week 9
│       └── Settings.tsx (extended)    ✓ Week 10
└── tests/
    ├── knowledge.test.ts
    ├── embedding.test.ts
    └── integration.test.ts
```

### Testing Strategy

| Level | Coverage | Tools |
|-------|----------|-------|
| Unit | >85% | Vitest + Testing Library |
| Integration | >70% | Vitest + custom fixtures |
| E2E | >60% | Playwright |
| Performance | Baseline | Custom benchmarks |

### Rollout Plan

1. **Alpha** (Internal team - Week 8)
   - Core devs use for 1 week
   - Gather feedback
   - Fix critical bugs

2. **Beta** (10-15 users - Week 9)
   - Active developers opt-in
   - Monitor usage patterns
   - Iterate on UX

3. **GA** (All users - Week 10)
   - Public release in v0.4.0
   - Documentation & tutorials
   - Community announcements

---

## Success Criteria

### Completion Quality
- [ ] 90%+ of tests passing
- [ ] <50ms search latency
- [ ] All core features implemented
- [ ] Documentation complete

### User Experience
- [ ] Knowledge screen loads in <1s
- [ ] Search results relevant & useful
- [ ] Auto-learning feels non-intrusive
- [ ] Setup takes <5 minutes

### Performance
- [ ] Background extraction: <100ms
- [ ] Embedding: <500ms per 1000 words
- [ ] Search: <50ms for 1000 snippets
- [ ] Memory overhead: <200MB

### Adoption
- [ ] 50% of users have Memory.md by month 1
- [ ] 30% use personal snippets in generation
- [ ] Positive NPS score (>50)
- [ ] <5% bug report rate

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Embedding model too slow | Medium | High | Use smaller model, optimize |
| Knowledge explosion | Low | Medium | Implement cleanup/archiving |
| Privacy concerns | Low | High | Encrypt by default, document |
| Integration complexity | Medium | Medium | Start with minimal scope |

