import { create } from 'zustand'
import type { PlatformStatus, MessageLogEntry } from '../../shared/messaging'

interface MessagingStore {
  platforms: PlatformStatus[]
  messageLog: MessageLogEntry[]
  isLoading: boolean
  error: string | null
  setPlatforms: (platforms: PlatformStatus[]) => void
  addLogEntry: (entry: MessageLogEntry) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useMessagingStore = create<MessagingStore>(set => ({
  platforms: [],
  messageLog: [],
  isLoading: false,
  error: null,
  setPlatforms: platforms => set({ platforms }),
  addLogEntry: entry =>
    set(state => ({ messageLog: [entry, ...state.messageLog].slice(0, 100) })),
  setLoading: isLoading => set({ isLoading }),
  setError: error => set({ error }),
}))
