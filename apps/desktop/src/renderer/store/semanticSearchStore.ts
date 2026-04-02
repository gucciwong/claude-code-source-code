import { create } from 'zustand'
import type { CodeSnippet, IndexStatus } from '../../shared/semanticSearch'

interface SemanticSearchStore {
  results: CodeSnippet[]
  indexStatus: IndexStatus | null
  isSearching: boolean
  isIndexing: boolean
  error: string | null
  query: string
  setResults: (results: CodeSnippet[]) => void
  setIndexStatus: (status: IndexStatus) => void
  setSearching: (searching: boolean) => void
  setIndexing: (indexing: boolean) => void
  setError: (error: string | null) => void
  setQuery: (query: string) => void
}

export const useSemanticSearchStore = create<SemanticSearchStore>(set => ({
  results: [],
  indexStatus: null,
  isSearching: false,
  isIndexing: false,
  error: null,
  query: '',
  setResults: results => set({ results }),
  setIndexStatus: indexStatus => set({ indexStatus }),
  setSearching: isSearching => set({ isSearching }),
  setIndexing: isIndexing => set({ isIndexing }),
  setError: error => set({ error }),
  setQuery: query => set({ query }),
}))
