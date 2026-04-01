import { create } from 'zustand'

export interface OllamaModel {
  name: string
  size: number
  digest: string
  modified_at: string
}

interface ModelsState {
  installed: OllamaModel[]
  selected: string | null
  setSelected: (name: string) => void
  setInstalled: (models: OllamaModel[]) => void
}

export const useModelsStore = create<ModelsState>((set) => ({
  installed: [],
  selected: null,
  setSelected: (name) => set({ selected: name }),
  setInstalled: (models) => set({ installed: models, selected: models[0]?.name ?? null }),
}))
