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
