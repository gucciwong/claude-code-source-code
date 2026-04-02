import { create } from 'zustand'
import type { SharedPattern, SkillGapReport, Bottleneck } from '../../../shared/orgIntelligence'

interface OrgIntelligenceStore {
  sharedPatterns: SharedPattern[]
  skillGapReport: SkillGapReport | null
  bottlenecks: Bottleneck[]
  searchResults: SharedPattern[]
  isLoading: boolean
  error: string | null
  setSharedPatterns: (patterns: SharedPattern[]) => void
  addPattern: (pattern: SharedPattern) => void
  setSkillGapReport: (report: SkillGapReport) => void
  setBottlenecks: (bottlenecks: Bottleneck[]) => void
  setSearchResults: (results: SharedPattern[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useOrgIntelligenceStore = create<OrgIntelligenceStore>(set => ({
  sharedPatterns: [],
  skillGapReport: null,
  bottlenecks: [],
  searchResults: [],
  isLoading: false,
  error: null,
  setSharedPatterns: sharedPatterns => set({ sharedPatterns }),
  addPattern: pattern => set(state => ({ sharedPatterns: [...state.sharedPatterns, pattern] })),
  setSkillGapReport: skillGapReport => set({ skillGapReport }),
  setBottlenecks: bottlenecks => set({ bottlenecks }),
  setSearchResults: searchResults => set({ searchResults }),
  setLoading: isLoading => set({ isLoading }),
  setError: error => set({ error }),
}))
