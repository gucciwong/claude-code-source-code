import { create } from 'zustand'

const pollIntervals = new Map<string, ReturnType<typeof setInterval>>()

export type Quantization = 'fp32' | 'int8' | 'int4'

export interface ModelInfo {
  id: string                    // huggingface.co model id
  name: string                  // Display name
  size_gb: number              // Approximate size
  cached: boolean              // Is downloaded locally
  downloaded: boolean          // Fully downloaded
  downloading: boolean         // Currently downloading
  download_progress: number    // 0-100
  quantizations: Quantization[] // Available quantization options
  selected_quantization?: Quantization
  requires_hf_token?: boolean
}

export interface ModelManagerStore {
  // Model lists
  available_models: ModelInfo[]
  cached_models: ModelInfo[]
  active_model: ModelInfo | null
  
  // Download state
  download_queue: string[]
  downloads_in_progress: Record<string, number> // model_id -> progress %
  cache_usage_gb: number
  
  // Actions
  list_available: () => Promise<void>
  list_cached: () => Promise<void>
  download_model: (model_id: string, quantization?: Quantization) => Promise<void>
  set_active_model: (model_id: string) => Promise<void>
  delete_model: (model_id: string) => Promise<void>
  search_models: (query: string) => Promise<ModelInfo[]>
  cancel_download: (model_id: string) => Promise<void>
  cleanup_polls: () => void
  get_popular_models: () => ModelInfo[]
  
  // Status tracking
  is_model_available: (model_id: string) => boolean
  get_download_progress: (model_id: string) => number
  is_service_available: boolean
  last_error: string | null
}

export const useModelManagerStore = create<ModelManagerStore>((set, get) => ({
  available_models: [],
  cached_models: [],
  active_model: null,
  download_queue: [],
  downloads_in_progress: {},
  cache_usage_gb: 0,
  is_service_available: false,
  last_error: null,

  list_available: async () => {
    try {
      const response = await fetch('http://localhost:8002/api/v1/models')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const data = await response.json()
      set({
        cached_models: data.cached_models || [],
        active_model: data.active_model,
        is_service_available: true,
        last_error: null
      })
    } catch (err) {
      set({
        last_error: `Failed to list models: ${err}`,
        is_service_available: false
      })
    }
  },

  list_cached: async () => {
    try {
      const response = await fetch('http://localhost:8002/api/v1/models')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const data = await response.json()
      const total_size = (data.cached_models || []).reduce(
        (sum: number, m: any) => sum + (m.size_bytes || 0),
        0
      )
      
      set({
        cached_models: data.cached_models || [],
        cache_usage_gb: total_size / (1024 ** 3)
      })
    } catch (err) {
      set({ last_error: `Failed to list cached models: ${err}` })
    }
  },

  download_model: async (model_id: string, quantization?: Quantization) => {
    if (get().downloads_in_progress[model_id] !== undefined) return // already downloading

    try {
      const response = await fetch(
        `http://localhost:8002/api/v1/models/${model_id}/download`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantization: quantization || 'fp32' })
        }
      )
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      set(state => ({
        download_queue: [...state.download_queue, model_id],
        downloads_in_progress: { ...state.downloads_in_progress, [model_id]: 0 }
      }))

      // Poll download progress
      let failCount = 0
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(
            'http://localhost:8002/api/v1/downloads/status'
          )
          const status = await statusResponse.json()
          failCount = 0 // reset on success
          
          if (status.queue?.[model_id]) {
            set(state => ({
              downloads_in_progress: {
                ...state.downloads_in_progress,
                [model_id]: status.queue[model_id].progress || 0
              }
            }))
          } else {
            // Download complete
            clearInterval(pollInterval)
            pollIntervals.delete(model_id)
            await get().list_cached()
            set(state => {
              const { [model_id]: _, ...rest } = state.downloads_in_progress
              return {
                downloads_in_progress: rest,
                download_queue: state.download_queue.filter(m => m !== model_id)
              }
            })
          }
        } catch (err) {
          failCount++
          if (failCount >= 5) {
            clearInterval(pollInterval)
            pollIntervals.delete(model_id)
            set(state => {
              const { [model_id]: _, ...rest } = state.downloads_in_progress
              return {
                downloads_in_progress: rest,
                download_queue: state.download_queue.filter(m => m !== model_id),
                last_error: `Download status polling failed after 5 retries`
              }
            })
          }
        }
      }, 1000)
      pollIntervals.set(model_id, pollInterval)
    } catch (err) {
      set({ last_error: `Download failed: ${err}` })
    }
  },

  set_active_model: async (model_id: string) => {
    try {
      const response = await fetch(
        `http://localhost:8002/api/v1/models/${model_id}/set-active`,
        { method: 'POST' }
      )
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const cached = get().cached_models.find(m => m.id === model_id)
      if (cached) {
        set({ active_model: cached })
      }
    } catch (err) {
      set({ last_error: `Failed to set active model: ${err}` })
    }
  },

  delete_model: async (model_id: string) => {
    try {
      const response = await fetch(
        `http://localhost:8002/api/v1/models/${model_id}`,
        { method: 'DELETE' }
      )
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      set(state => ({
        cached_models: state.cached_models.filter(m => m.id !== model_id),
        active_model: state.active_model?.id === model_id ? null : state.active_model
      }))
    } catch (err) {
      set({ last_error: `Delete failed: ${err}` })
    }
  },

  search_models: async (query: string) => {
    try {
      const params = new URLSearchParams({ q: query })
      const response = await fetch(
        `http://localhost:8002/api/v1/models/search?${params}`
      )
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (err) {
      set({ last_error: `Search failed: ${err}` })
      return []
    }
  },

  cancel_download: async (model_id: string) => {
    try {
      await fetch(
        `http://localhost:8002/api/v1/downloads/${model_id}/cancel`,
        { method: 'POST' }
      )
      
      const existingInterval = pollIntervals.get(model_id)
      if (existingInterval) {
        clearInterval(existingInterval)
        pollIntervals.delete(model_id)
      }

      set(state => {
        const { [model_id]: _, ...rest } = state.downloads_in_progress
        return {
          downloads_in_progress: rest,
          download_queue: state.download_queue.filter(m => m !== model_id)
        }
      })
    } catch (err) {
      set({ last_error: `Cancel failed: ${err}` })
    }
  },

  cleanup_polls: () => {
    for (const [, interval] of pollIntervals) {
      clearInterval(interval)
    }
    pollIntervals.clear()
  },

  get_popular_models: () => [
    {
      id: 'mistralai/Mistral-7B-Instruct-v0.1',
      name: 'Mistral 7B Instruct',
      size_gb: 14,
      cached: false,
      downloaded: false,
      downloading: false,
      download_progress: 0,
      quantizations: ['fp32', 'int8', 'int4'] as Quantization[]
    },
    {
      id: 'NousResearch/Nous-Hermes-2-7b-DPO',
      name: 'Nous Hermes 2 7B',
      size_gb: 14,
      cached: false,
      downloaded: false,
      downloading: false,
      download_progress: 0,
      quantizations: ['fp32', 'int8', 'int4'] as Quantization[]
    },
    {
      id: 'meta-llama/Llama-2-70b-chat-hf',
      name: 'Llama 2 70B Chat',
      size_gb: 140,
      cached: false,
      downloaded: false,
      downloading: false,
      download_progress: 0,
      quantizations: ['int8', 'int4'] as Quantization[],
      requires_hf_token: true
    }
  ],

  is_model_available: (model_id: string) => {
    const cached = get().cached_models.find(m => m.id === model_id)
    return cached?.downloaded || false
  },

  get_download_progress: (model_id: string) => {
    return get().downloads_in_progress[model_id] || 0
  }
}))
