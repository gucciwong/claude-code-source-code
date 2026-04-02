import { create } from 'zustand'

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

interface KnowledgeLibraryState {
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
  setSnippets: (snippets: Snippet[]) => void
  setDecisions: (decisions: Decision[]) => void
  setSearchResults: (results: SearchResult[]) => void
  setMemoryMarkdown: (content: string) => void
  setDomainStats: (stats: DomainStat[]) => void
  setTotalItems: (count: number) => void
  setIsIndexing: (indexing: boolean) => void
  setSearchQuery: (query: string) => void
  setInjectionEnabled: (enabled: boolean) => void
  removeSnippet: (id: string) => void
}

export const useKnowledgeLibraryStore = create<KnowledgeLibraryState>((set) => ({
  // Initial state
  snippets: [],
  decisions: [],
  memoryMarkdown: '',
  domainStats: [],
  totalItems: 0,
  isIndexing: false,
  searchQuery: '',
  searchResults: [],
  injectionEnabled: true,

  // Actions
  setSnippets: (snippets) => set({ snippets }),
  setDecisions: (decisions) => set({ decisions }),
  setSearchResults: (results) => set({ searchResults: results }),
  setMemoryMarkdown: (content) => set({ memoryMarkdown: content }),
  setDomainStats: (stats) => set({ domainStats: stats }),
  setTotalItems: (count) => set({ totalItems: count }),
  setIsIndexing: (indexing) => set({ isIndexing: indexing }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setInjectionEnabled: (enabled) => set({ injectionEnabled: enabled }),
  removeSnippet: (id) =>
    set((state) => ({ snippets: state.snippets.filter((s) => s.id !== id) })),
}))
