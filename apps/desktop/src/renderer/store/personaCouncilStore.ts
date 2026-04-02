import { create } from 'zustand'
import type { CouncilReport } from '../../shared/personaCouncil'

interface PersonaCouncilStore {
  reports: CouncilReport[]
  activeReport: CouncilReport | null
  isReviewing: boolean
  error: string | null
  addReport: (report: CouncilReport) => void
  setActiveReport: (report: CouncilReport | null) => void
  setReviewing: (reviewing: boolean) => void
  setError: (error: string | null) => void
}

export const usePersonaCouncilStore = create<PersonaCouncilStore>(set => ({
  reports: [],
  activeReport: null,
  isReviewing: false,
  error: null,
  addReport: report => set(state => ({ reports: [report, ...state.reports] })),
  setActiveReport: activeReport => set({ activeReport }),
  setReviewing: isReviewing => set({ isReviewing }),
  setError: error => set({ error }),
}))
