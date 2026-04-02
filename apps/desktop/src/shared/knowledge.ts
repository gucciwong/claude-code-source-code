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

export interface DomainStat {
  domain: string
  language: string
  count: number
}

export interface SearchResult {
  id: string
  text: string
  similarity: number
  language: string
  domain: string
  createdAt: number
}

export interface VectorSearchResult {
  id: string
  similarity: number
}
