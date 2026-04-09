import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/** Model loading configuration — mirrors LM Studio's model load settings */
export interface ModelLoadConfig {
  contextLength: number
  gpuOffloadLayers: number
  cpuThreads: number
  evalBatchSize: number
  maxConcurrentPredictions: number
  ropeFrequencyBase: number    // 0 = auto
  ropeFrequencyScale: number   // 0 = auto
  keepInMemory: boolean
  useMmap: boolean
  flashAttention: boolean
  unifiedKvCache: boolean
  kvOffloadToGpu: boolean
  seed: number                 // -1 = random
  kCacheQuantType: string      // 'f16' | 'q8_0' | 'q4_0'
  vCacheQuantType: string      // 'f16' | 'q8_0' | 'q4_0'
}

/** Inference / chat parameters — mirrors LM Studio's Model Parameters panel */
export interface InferenceParams {
  temperature: number
  maxTokens: number            // 0 = unlimited
  topP: number
  topK: number
  repeatPenalty: number
  frequencyPenalty: number
  presencePenalty: number
  minP: number
  systemPrompt: string
  stopStrings: string[]
  contextOverflow: 'truncate_middle' | 'truncate_start' | 'stop'
  cpuThreads: number
  // Speculative decoding
  draftModelId: string
  draftProbabilityThreshold: number
  minDraftLength: number
  maxDraftLength: number
  visualizeDraftTokens: boolean
}

export interface ModelParamsState {
  // Persisted per-model load configs  (key = model id)
  loadConfigs: Record<string, Partial<ModelLoadConfig>>
  // Active inference params
  inferenceParams: InferenceParams
  // Presets
  activePreset: string | null
  // Show advanced
  showAdvancedLoad: boolean
  showAdvancedInference: boolean
  // Sidebar visibility for chat
  paramsSidebarOpen: boolean

  // Actions
  setLoadConfig: (modelId: string, config: Partial<ModelLoadConfig>) => void
  getLoadConfig: (modelId: string) => ModelLoadConfig
  setInferenceParam: <K extends keyof InferenceParams>(key: K, value: InferenceParams[K]) => void
  setInferenceParams: (params: Partial<InferenceParams>) => void
  setActivePreset: (preset: string | null) => void
  setShowAdvancedLoad: (show: boolean) => void
  setShowAdvancedInference: (show: boolean) => void
  toggleParamsSidebar: () => void
  resetInferenceParams: () => void
  resetLoadConfig: (modelId: string) => void
}

export const DEFAULT_LOAD_CONFIG: ModelLoadConfig = {
  contextLength: 4096,
  gpuOffloadLayers: 0,
  cpuThreads: 4,
  evalBatchSize: 512,
  maxConcurrentPredictions: 4,
  ropeFrequencyBase: 0,
  ropeFrequencyScale: 0,
  keepInMemory: true,
  useMmap: true,
  flashAttention: true,
  unifiedKvCache: true,
  kvOffloadToGpu: true,
  seed: -1,
  kCacheQuantType: 'f16',
  vCacheQuantType: 'f16',
}

export const DEFAULT_INFERENCE_PARAMS: InferenceParams = {
  temperature: 0.8,
  maxTokens: 0,
  topP: 0.9,
  topK: 40,
  repeatPenalty: 1.1,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
  minP: 0.05,
  systemPrompt: '',
  stopStrings: [],
  contextOverflow: 'truncate_middle',
  cpuThreads: 4,
  draftModelId: '',
  draftProbabilityThreshold: 0.75,
  minDraftLength: 0,
  maxDraftLength: 16,
  visualizeDraftTokens: false,
}

/** Presets matching LM Studio patterns */
export const INFERENCE_PRESETS: Record<string, Partial<InferenceParams>> = {
  'Default': {},
  'Creative': { temperature: 1.2, topP: 0.95, topK: 80, repeatPenalty: 1.05 },
  'Precise': { temperature: 0.2, topP: 0.5, topK: 20, repeatPenalty: 1.2 },
  'Code': { temperature: 0.1, topP: 0.9, topK: 40, repeatPenalty: 1.0, systemPrompt: 'You are a helpful coding assistant. Provide clear, correct, and well-structured code.' },
  'Chat': { temperature: 0.7, topP: 0.9, topK: 40, repeatPenalty: 1.1 },
  'Deterministic': { temperature: 0.0, topP: 1.0, topK: 1, repeatPenalty: 1.0 },
}

export const useModelParamsStore = create<ModelParamsState>()(
  persist(
    (set, get) => ({
      loadConfigs: {},
      inferenceParams: { ...DEFAULT_INFERENCE_PARAMS },
      activePreset: null,
      showAdvancedLoad: false,
      showAdvancedInference: false,
      paramsSidebarOpen: false,

      setLoadConfig: (modelId, config) =>
        set(state => ({
          loadConfigs: {
            ...state.loadConfigs,
            [modelId]: { ...state.loadConfigs[modelId], ...config },
          },
        })),

      getLoadConfig: (modelId) => {
        const saved = get().loadConfigs[modelId]
        return { ...DEFAULT_LOAD_CONFIG, ...saved }
      },

      setInferenceParam: (key, value) =>
        set(state => ({
          inferenceParams: { ...state.inferenceParams, [key]: value },
          activePreset: null, // setting individual param clears preset
        })),

      setInferenceParams: (params) =>
        set(state => ({
          inferenceParams: { ...state.inferenceParams, ...params },
        })),

      setActivePreset: (preset) => {
        if (!preset || !INFERENCE_PRESETS[preset]) {
          set({ activePreset: null })
          return
        }
        set(state => ({
          activePreset: preset,
          inferenceParams: { ...DEFAULT_INFERENCE_PARAMS, ...INFERENCE_PRESETS[preset] },
        }))
      },

      setShowAdvancedLoad: (show) => set({ showAdvancedLoad: show }),
      setShowAdvancedInference: (show) => set({ showAdvancedInference: show }),
      toggleParamsSidebar: () => set(state => ({ paramsSidebarOpen: !state.paramsSidebarOpen })),

      resetInferenceParams: () => set({ inferenceParams: { ...DEFAULT_INFERENCE_PARAMS }, activePreset: null }),
      resetLoadConfig: (modelId) =>
        set(state => {
          const updated = { ...state.loadConfigs }
          delete updated[modelId]
          return { loadConfigs: updated }
        }),
    }),
    {
      name: 'sovereign-model-params',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        loadConfigs: state.loadConfigs,
        inferenceParams: state.inferenceParams,
        activePreset: state.activePreset,
        showAdvancedLoad: state.showAdvancedLoad,
        showAdvancedInference: state.showAdvancedInference,
      }),
    }
  )
)
