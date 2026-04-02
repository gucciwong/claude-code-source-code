import { create } from 'zustand'
import { Snippet, Decision, DomainStat, SearchResult } from '../../shared/knowledge'

export type { Snippet, Decision, DomainStat, SearchResult }

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
