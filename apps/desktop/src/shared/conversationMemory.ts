export interface Memory {
  id: string
  text: string
  tags: string[]
  relevance_score: number
  timestamp: string
}

export interface MemorySearchResult {
  memory: Memory
  score: number
}

export interface ContextSummary {
  query: string
  relevant_memories: Memory[]
  compressed_context: string
  token_estimate: number
}
