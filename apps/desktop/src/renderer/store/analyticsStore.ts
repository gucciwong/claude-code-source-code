import { create } from 'zustand'
import type { AnalyticsReport } from '../../shared/analytics'

interface AnalyticsStore {
  report: AnalyticsReport | null
  isLoading: boolean
  error: string | null
  setReport: (report: AnalyticsReport) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useAnalyticsStore = create<AnalyticsStore>(set => ({
  report: null,
  isLoading: false,
  error: null,
  setReport: report => set({ report }),
  setLoading: isLoading => set({ isLoading }),
  setError: error => set({ error }),
}))
