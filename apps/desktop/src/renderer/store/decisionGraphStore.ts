import { create } from 'zustand'
import type { DecisionNode } from '../../../shared/enterprise'

type DecisionGraphStore = {
  nodes: DecisionNode[]
  filteredNodes: DecisionNode[]
  searchQuery: string
  isLoading: boolean
  setNodes: (nodes: DecisionNode[]) => void
  setFilteredNodes: (nodes: DecisionNode[]) => void
  setSearchQuery: (q: string) => void
  setIsLoading: (loading: boolean) => void
  clearGraph: () => void
}

export const useDecisionGraphStore = create<DecisionGraphStore>(set => ({
  nodes: [],
  filteredNodes: [],
  searchQuery: '',
  isLoading: false,
  setNodes: nodes => set({ nodes, filteredNodes: nodes }),
  setFilteredNodes: filteredNodes => set({ filteredNodes }),
  setSearchQuery: searchQuery => set({ searchQuery }),
  setIsLoading: isLoading => set({ isLoading }),
  clearGraph: () => set({ nodes: [], filteredNodes: [], searchQuery: '' }),
}))
