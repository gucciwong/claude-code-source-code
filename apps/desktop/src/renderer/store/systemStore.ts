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
}

export const useSystemStore = create<SystemState>(() => ({
  activeModel: null,
  tokensPerSec: null,
  gpuName: null,
  vramUsed: null,
  vramTotal: null,
  gpuTemp: null,
  trainingStatus: 'idle',
  federationPeers: 0,
  ollamaOnline: false,
}))
