import { create } from 'zustand'

interface SystemState {
  activeModel: string | null
  tokensPerSec: number | null
  gpuName: string | null
  vramUsed: number | null
  vramTotal: number | null
  gpuTemp: number | null
  trainingStatus: 'idle' | 'running' | 'complete'
  federationPeers: number
  ollamaOnline: boolean
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void
}

export const useSystemStore = create<SystemState>((set) => ({
  activeModel: null,
  tokensPerSec: null,
  gpuName: null,
  vramUsed: null,
  vramTotal: null,
  gpuTemp: null,
  trainingStatus: 'idle',
  federationPeers: 0,
  ollamaOnline: false,
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
}))
