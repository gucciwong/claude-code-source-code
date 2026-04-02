import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

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

export interface PKLConfig {
  injectionEnabled: boolean
  maxTokens: number
  qualityThreshold: number
  version: string
}

export interface VectorSearchResult {
  id: string
  similarity: number
}

// KnowledgeStorage is injected with a db interface so it can be tested without Electron
export interface Database {
  exec(sql: string): void
  prepare(sql: string): {
    run(...args: unknown[]): void
    get(...args: unknown[]): unknown
    all(...args: unknown[]): unknown[]
  }
  close(): void
}

const INITIAL_SCHEMA = `
CREATE TABLE IF NOT EXISTS snippets (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  language TEXT,
  domain TEXT,
  quality REAL DEFAULT 0.0,
  usage_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  rejected INTEGER DEFAULT 0,
  tags TEXT DEFAULT '[]'
);

CREATE VIRTUAL TABLE IF NOT EXISTS snippets_fts
  USING fts5(id UNINDEXED, text, language, domain, content=snippets);

CREATE TABLE IF NOT EXISTS embeddings (
  snippet_id TEXT PRIMARY KEY REFERENCES snippets(id) ON DELETE CASCADE,
  vector BLOB NOT NULL,
  model TEXT DEFAULT 'e5-small-v2'
);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  summary TEXT NOT NULL,
  rationale TEXT,
  alternatives TEXT DEFAULT '[]',
  outcome TEXT,
  project_path TEXT,
  timestamp INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS domain_stats (
  domain TEXT PRIMARY KEY,
  language TEXT,
  snippet_count INTEGER DEFAULT 0,
  last_updated INTEGER
);

CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_domain ON snippets(domain);
CREATE INDEX IF NOT EXISTS idx_snippets_quality ON snippets(quality DESC);
CREATE INDEX IF NOT EXISTS idx_snippets_created ON snippets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_timestamp ON decisions(timestamp DESC);
`

const DEFAULT_MEMORY_MARKDOWN = `# Personal Knowledge Library

## Summary
_This file is auto-managed by Sovereign Coder._

## Snippets
<!-- Snippets will be listed here -->

## Decisions
<!-- Architectural decisions will be recorded here -->
`

const DEFAULT_CONFIG: PKLConfig = {
  injectionEnabled: true,
  maxTokens: 2048,
  qualityThreshold: 0.7,
  version: '1.0.0',
}

export class KnowledgeStorage {
  private db: Database
  private knowledgeDir: string

  constructor(db: Database, knowledgeDir?: string) {
    this.knowledgeDir =
      knowledgeDir ?? path.join(os.homedir(), '.sovereign-code', 'knowledge')
    this.db = db
    this.ensureDirectories()
    this.runMigrations()
  }

  private ensureDirectories(): void {
    try {
      fs.mkdirSync(this.knowledgeDir, { recursive: true })
    } catch {
      // Directory may already exist or creation may be deferred in test environments
    }
  }

  private runMigrations(): void {
    this.db.exec(INITIAL_SCHEMA)
  }

  saveSnippet(snippet: Snippet): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO snippets
        (id, text, language, domain, quality, usage_count, created_at, updated_at, rejected, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      snippet.id,
      snippet.text,
      snippet.language,
      snippet.domain,
      snippet.qualityScore,
      snippet.usageCount,
      snippet.createdAt,
      snippet.updatedAt,
      snippet.rejected ? 1 : 0,
      JSON.stringify(snippet.tags),
    )
  }

  getSnippet(id: string): Snippet | null {
    const stmt = this.db.prepare(`SELECT * FROM snippets WHERE id = ?`)
    const row = stmt.get(id) as Record<string, unknown> | null | undefined
    if (!row) return null
    return {
      id: row.id as string,
      text: row.text as string,
      language: row.language as string,
      domain: row.domain as string,
      qualityScore: row.quality as number,
      usageCount: row.usage_count as number,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
      tags: JSON.parse((row.tags as string | undefined) ?? '[]') as string[],
      rejected: Boolean(row.rejected),
    }
  }

  getAllSnippets(): Snippet[] {
    const stmt = this.db.prepare(`SELECT * FROM snippets WHERE rejected = 0`)
    const rows = stmt.all() as Array<Record<string, unknown>>
    return rows.map((row) => ({
      id: row.id as string,
      text: row.text as string,
      language: row.language as string,
      domain: row.domain as string,
      qualityScore: row.quality as number,
      usageCount: row.usage_count as number,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
      tags: JSON.parse((row.tags as string | undefined) ?? '[]') as string[],
      rejected: false,
    }))
  }

  deleteSnippet(id: string): void {
    const stmt = this.db.prepare(`DELETE FROM snippets WHERE id = ?`)
    stmt.run(id)
  }

  updateUsageCount(id: string): void {
    const stmt = this.db.prepare(
      `UPDATE snippets SET usage_count = usage_count + 1 WHERE id = ?`,
    )
    stmt.run(id)
  }

  saveVector(id: string, vector: Float32Array): void {
    // Serialize Float32Array to a Buffer (little-endian floats)
    const byteLength = vector.length * 4
    const buffer = Buffer.alloc(byteLength)
    for (let i = 0; i < vector.length; i++) {
      buffer.writeFloatLE(vector[i], i * 4)
    }
    const stmt = this.db.prepare(
      `INSERT OR REPLACE INTO embeddings (snippet_id, vector) VALUES (?, ?)`,
    )
    stmt.run(id, buffer)
  }

  getVector(id: string): Float32Array | null {
    const stmt = this.db.prepare(
      `SELECT vector FROM embeddings WHERE snippet_id = ?`,
    )
    const row = stmt.get(id) as { vector: Buffer } | null | undefined
    if (!row) return null
    const result = new Float32Array(row.vector.byteLength / 4)
    for (let i = 0; i < result.length; i++) {
      result[i] = row.vector.readFloatLE(i * 4)
    }
    return result
  }

  getAllVectors(): Map<string, Float32Array> {
    const stmt = this.db.prepare(`SELECT snippet_id, vector FROM embeddings`)
    const rows = stmt.all() as Array<{ snippet_id: string; vector: Buffer }>
    const result = new Map<string, Float32Array>()
    for (const row of rows) {
      const vec = new Float32Array(row.vector.byteLength / 4)
      for (let i = 0; i < vec.length; i++) {
        vec[i] = row.vector.readFloatLE(i * 4)
      }
      result.set(row.snippet_id, vec)
    }
    return result
  }

  searchByVector(queryVector: Float32Array, topK: number): VectorSearchResult[] {
    const vectors = this.getAllVectors()
    if (vectors.size === 0) return []

    const results: VectorSearchResult[] = []
    for (const [id, vec] of vectors) {
      const similarity = cosineSimilarity(queryVector, vec)
      results.push({ id, similarity })
    }

    results.sort((a, b) => b.similarity - a.similarity)
    return results.slice(0, topK)
  }

  getMemoryMarkdown(): string {
    const filePath = path.join(this.knowledgeDir, 'memory.md')
    try {
      return fs.readFileSync(filePath, 'utf8')
    } catch {
      return DEFAULT_MEMORY_MARKDOWN
    }
  }

  saveMemoryMarkdown(content: string): void {
    const filePath = path.join(this.knowledgeDir, 'memory.md')
    fs.writeFileSync(filePath, content, 'utf8')
  }

  getConfig(): PKLConfig {
    const filePath = path.join(this.knowledgeDir, 'config.json')
    try {
      const raw = fs.readFileSync(filePath, 'utf8')
      return JSON.parse(raw) as PKLConfig
    } catch {
      return { ...DEFAULT_CONFIG }
    }
  }

  saveConfig(config: PKLConfig): void {
    const filePath = path.join(this.knowledgeDir, 'config.json')
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8')
  }

  getSnippetCount(): number {
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM snippets WHERE rejected = 0`,
    )
    const row = stmt.get() as { count: number } | null | undefined
    return row?.count ?? 0
  }

  getDomainStats(): Array<{ domain: string; language: string; count: number }> {
    const stmt = this.db.prepare(`
      SELECT domain, language, COUNT(*) as count
      FROM snippets
      WHERE rejected = 0
      GROUP BY domain, language
    `)
    return stmt.all() as Array<{ domain: string; language: string; count: number }>
  }
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length || a.length === 0) return 0

  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  if (denom === 0) return 0

  return dot / denom
}
