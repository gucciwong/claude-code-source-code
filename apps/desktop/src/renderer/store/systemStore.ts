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
  ollamaConnectionError: string | null
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void
  uiTemplate: 'sentry' | 'sanity' | 'mistral' | 'replicate' | 'sovereign'
  setUiTemplate: (uiTemplate: 'sentry' | 'sanity' | 'mistral' | 'replicate' | 'sovereign') => void
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
  ollamaConnectionError: null,
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  // v1.0 GA — `sovereign` is the canonical theme (Stitch-distilled
  // Terminal Emerald dark palette). Legacy themes (sentry/sanity/
  // mistral/replicate) remain available for experimentation via
  // Settings → Appearance.
  uiTemplate: 'sovereign',
  setUiTemplate: (uiTemplate) => set({ uiTemplate }),
}))
