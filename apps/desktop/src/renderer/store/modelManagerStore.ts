import { create } from 'zustand'
import { modelManagerAPI, ModelMetadata, TrainingJob, TrainingConfig, AutoTrainingOptions } from '../services/modelManagerAPI'
import { useSystemStore } from './systemStore'

export interface ModelManagerState {
  // Model lists
  models: ModelMetadata[]
  selectedModel: ModelMetadata | null

  // Training state
  trainingJobs: TrainingJob[]
  activeTrainingJob: TrainingJob | null

  // UI state
  isLoading: boolean
  error: string | null

  // Actions
  loadModels: () => Promise<void>
  selectModel: (id: string) => void
  setActiveModel: (modelId: string, loadConfig?: Record<string, unknown>) => Promise<void>
  deleteModel: (modelId: string) => Promise<void>
  startTraining: (config: TrainingConfig) => Promise<void>
  startOneClickTraining: (options?: AutoTrainingOptions, chatMessages?: Array<{ role: string; content: string; session_id?: string; model_id?: string }>) => Promise<void>
  getTrainingStatus: (jobId: string) => Promise<TrainingJob>
  exportModel: (modelId: string) => Promise<void>
  refreshModels: () => Promise<void>
  
  // Status
  isServiceAvailable: boolean
  checkServiceAvailable: () => Promise<boolean>

  // Error display
  last_error: string | null

  // Cleanup
  cleanup_polls: () => void
}

export const useModelManagerStore = create<ModelManagerState>((set, get) => ({
  models: [],
  selectedModel: null,
  trainingJobs: [],
  activeTrainingJob: null,
  isLoading: false,
  error: null,
  isServiceAvailable: false,
  last_error: null,

  loadModels: async () => {
    set({ isLoading: true, error: null, last_error: null })
    try {
      const { models, activeModel } = await modelManagerAPI.listModels()
      // Sync active model to systemStore
      if (activeModel) {
        useSystemStore.setState({ activeModel })
      }
      set({
        models,
        selectedModel: models[0] || null,
        isServiceAvailable: true,
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      set({ error: errorMsg, isServiceAvailable: false })
    } finally {
      set({ isLoading: false })
    }
  },

  selectModel: (id: string) => {
    const model = get().models.find(m => m.id === id || m.name === id)
    if (model) {
      set({ selectedModel: model })
    }
  },

  setActiveModel: async (modelId: string, loadConfig?: Record<string, unknown>) => {
    set({ isLoading: true, error: null, last_error: null })
    try {
      const result = await modelManagerAPI.setActiveModel(modelId, loadConfig)
      useSystemStore.setState({ activeModel: result.active_model })
      await get().loadModels()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      set({ error: errorMsg, last_error: errorMsg })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  deleteModel: async (modelId: string) => {
    set({ isLoading: true, error: null, last_error: null })
    try {
      await modelManagerAPI.deleteModel(modelId)
      if (useSystemStore.getState().activeModel === modelId) {
        useSystemStore.setState({ activeModel: null })
      }
      set(state => {
        const updated = state.models.filter(m => m.id !== modelId)
        return {
          models: updated,
          selectedModel: state.selectedModel?.id === modelId ? updated[0] || null : state.selectedModel,
        }
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      set({ error: errorMsg, last_error: errorMsg })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  startTraining: async (config: TrainingConfig) => {
    set({ isLoading: true, error: null })
    try {
      const job = await modelManagerAPI.startTraining(config)
      set(state => ({
        trainingJobs: [...state.trainingJobs, job],
        activeTrainingJob: job,
      }))
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      set({ error: errorMsg })
    } finally {
      set({ isLoading: false })
    }
  },

  startOneClickTraining: async (options?: AutoTrainingOptions, chatMessages?: Array<{ role: string; content: string; session_id?: string; model_id?: string }>) => {
    set({ isLoading: true, error: null })
    try {
      // If use_chat_history is enabled and we have chat messages, submit them first
      if (options?.use_chat_history && chatMessages && chatMessages.length > 0) {
        await modelManagerAPI.submitChatMessages(chatMessages)
      }

      const result = await modelManagerAPI.startOneClickTraining(options)
      const job: TrainingJob = {
        job_id: result.job_id,
        model_name: result.base_model ?? 'auto',
        status: result.status ?? 'queued',
        progress: 0,
        created_at: new Date().toISOString(),
      }
      set(state => ({
        trainingJobs: [...state.trainingJobs, job],
        activeTrainingJob: job,
      }))
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      set({ error: errorMsg })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  getTrainingStatus: async (jobId: string) => {
    try {
      const job = await modelManagerAPI.getTrainingStatus(jobId)
      set(state => ({
        trainingJobs: state.trainingJobs.map(j => j.job_id === jobId ? job : j),
        activeTrainingJob: state.activeTrainingJob?.job_id === jobId ? job : state.activeTrainingJob,
      }))
      return job
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      set({ error: errorMsg })
      throw err
    }
  },

  exportModel: async (modelId: string) => {
    set({ isLoading: true, error: null })
    try {
      await modelManagerAPI.exportModel(modelId)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      set({ error: errorMsg })
    } finally {
      set({ isLoading: false })
    }
  },

  refreshModels: async () => {
    return get().loadModels()
  },

  checkServiceAvailable: async () => {
    try {
      const available = await modelManagerAPI.isServiceAvailable()
      set({ isServiceAvailable: available })
      return available
    } catch {
      set({ isServiceAvailable: false })
      return false
    }
  },

  cleanup_polls: () => {
    // Polling is managed locally inside HuggingFacePanel; this is a no-op cleanup hook
  },
}))
