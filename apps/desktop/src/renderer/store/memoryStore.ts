import { create } from 'zustand'
import type { Memory, MemorySearchResult, ContextSummary } from '../../shared/conversationMemory'

interface MemoryStore {
  memories: Memory[]
  searchResults: MemorySearchResult[]
  contextSummary: ContextSummary | null
  isLoading: boolean
  error: string | null
  setMemories: (memories: Memory[]) => void
  addMemory: (memory: Memory) => void
  removeMemory: (id: string) => void
  setSearchResults: (results: MemorySearchResult[]) => void
  setContextSummary: (summary: ContextSummary | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useMemoryStore = create<MemoryStore>(set => ({
  memories: [],
  searchResults: [],
  contextSummary: null,
  isLoading: false,
  error: null,
  setMemories: memories => set({ memories }),
  addMemory: memory => set(state => ({ memories: [...state.memories, memory] })),
  removeMemory: id => set(state => ({ memories: state.memories.filter(m => m.id !== id) })),
  setSearchResults: searchResults => set({ searchResults }),
  setContextSummary: contextSummary => set({ contextSummary }),
  setLoading: isLoading => set({ isLoading }),
  setError: error => set({ error }),
}))
