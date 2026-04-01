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
