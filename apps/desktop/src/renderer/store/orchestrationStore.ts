import { create } from 'zustand'
import type { OrchestratorSession } from '../../shared/orchestration'

interface OrchestrationStore {
  sessions: OrchestratorSession[]
  activeSessionId: string | null
  isLoading: boolean
  error: string | null
  setSessions: (sessions: OrchestratorSession[]) => void
  addSession: (session: OrchestratorSession) => void
  updateSession: (session: OrchestratorSession) => void
  setActiveSession: (id: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useOrchestrationStore = create<OrchestrationStore>(set => ({
  sessions: [],
  activeSessionId: null,
  isLoading: false,
  error: null,
  setSessions: sessions => set({ sessions }),
  addSession: session => set(state => ({ sessions: [...state.sessions, session] })),
  updateSession: session => set(state => ({
    sessions: state.sessions.map(s => s.id === session.id ? session : s),
  })),
  setActiveSession: id => set({ activeSessionId: id }),
  setLoading: isLoading => set({ isLoading }),
  setError: error => set({ error }),
}))
