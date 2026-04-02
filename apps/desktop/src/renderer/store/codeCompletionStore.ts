import { create } from 'zustand'
import type { Completion } from '../../shared/codeCompletion'

interface CodeCompletionStore {
  completions: Completion[]
  activeIndex: number
  isLoading: boolean
  prefix: string
  error: string | null
  setCompletions: (completions: Completion[]) => void
  setActiveIndex: (index: number) => void
  setLoading: (loading: boolean) => void
  setPrefix: (prefix: string) => void
  setError: (error: string | null) => void
}

export const useCodeCompletionStore = create<CodeCompletionStore>(set => ({
  completions: [],
  activeIndex: 0,
  isLoading: false,
  prefix: '',
  error: null,
  setCompletions: completions => set({ completions, activeIndex: 0 }),
  setActiveIndex: activeIndex => set({ activeIndex }),
  setLoading: isLoading => set({ isLoading }),
  setPrefix: prefix => set({ prefix }),
  setError: error => set({ error }),
}))
