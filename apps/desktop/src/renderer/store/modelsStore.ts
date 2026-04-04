import { create } from 'zustand'

export interface OllamaModelDetails {
  parameter_size?: string
  quantization_level?: string
  family?: string
  format?: string
}

export interface OllamaModel {
  name: string
  size: number
  digest: string
  modified_at: string
  details?: OllamaModelDetails
}

interface ModelsState {
  installed: OllamaModel[]
  selected: string | null
  setSelected: (name: string) => void
  setInstalled: (models: OllamaModel[]) => void
  setModelDetails: (name: string, details: OllamaModelDetails) => void
  deleteModel: (name: string) => Promise<void>
}

export const useModelsStore = create<ModelsState>((set) => ({
  installed: [],
  selected: null,
  setSelected: (name) => set({ selected: name }),
  setInstalled: (models) => set({ installed: models, selected: models[0]?.name ?? null }),
  setModelDetails: (name, details) =>
    set(state => ({
      installed: state.installed.map(m => m.name === name ? { ...m, details } : m),
    })),
  deleteModel: async (name) => {
    const res = await fetch('http://localhost:11434/api/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`Delete failed: HTTP ${res.status}`)
    set(state => ({
      installed: state.installed.filter(m => m.name !== name),
      selected: state.selected === name ? (state.installed.filter(m => m.name !== name)[0]?.name ?? null) : state.selected,
    }))
  },
}))
