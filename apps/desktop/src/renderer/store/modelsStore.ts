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
}))
