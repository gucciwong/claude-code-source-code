/**
 * Hook for managing models via the Model Manager service
 * Handles communication with FastAPI backend on port 8002.
 *
 * W3-T8c: write/control endpoints (mirror/switch, download, cancel, pause,
 * resume) go through `authFetch` to attach the Authorization: Bearer header
 * required by `services/_shared/auth.verify_local_token`. Read-only routes
 * (mirror config, model list, search, file listing) remain plain `fetch`
 * since they are unprotected on the server side.
 */

import { useState, useCallback } from 'react'
import { authFetch } from '../services/authFetch'

const MODEL_MANAGER_BASE_URL = import.meta.env.VITE_MODEL_MANAGER_URL ?? 'http://localhost:8002'

export interface MirrorConfig {
  current_mirror: string
  is_china_mirror: boolean
  huggingface_endpoint: string
  api_endpoint: string
  available_mirrors: Array<{
    name: string
    display: string
    endpoint: string
    api_endpoint: string
  }>
}

export interface MirrorSwitchResult {
  success: boolean
  current_mirror: string
  huggingface_endpoint: string
  api_endpoint: string
  message: string
  note?: string
}

export interface HealthStatus {
  status: string
  version: string
  device: string
  cache_path: string
  cache_limit_gb: number
  mirror: string
  huggingface_endpoint: string
  api_endpoint: string
}

export interface ModelInfo {
  id: string
  name: string
  cached: boolean
  size_bytes?: number
  local_path?: string
}

export interface SearchResult {
  id: string
  name: string
  cached: boolean
  downloaded: boolean
  downloading: boolean
  download_progress: number
  size_gb: number
  quantizations: string[]
}

export interface DownloadQueueEntry {
  status: 'pending' | 'downloading' | 'done' | 'cancelled' | 'error' | 'paused'
  progress: number
  total_size_gb: number
  downloaded_gb: number
  model_name: string
  started_at: number
  speed_mbps?: number
  error?: string
}

export function useModelManager() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get health status including mirror info
  const checkHealth = useCallback(async (): Promise<HealthStatus | null> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${MODEL_MANAGER_BASE_URL}/health`)
      if (!response.ok) throw new Error(`Health check failed: ${response.statusText}`)
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get current mirror configuration
  const getMirrorInfo = useCallback(async (): Promise<MirrorConfig | null> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${MODEL_MANAGER_BASE_URL}/api/v1/mirror`)
      if (!response.ok) throw new Error(`Failed to get mirror info: ${response.statusText}`)
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get switch mirror instructions
  const getSwitchMirrorInstructions = useCallback(
    async (mirrorName: string): Promise<MirrorSwitchResult | null> => {
      setLoading(true)
      setError(null)
      try {
        const response = await authFetch(`${MODEL_MANAGER_BASE_URL}/api/v1/mirror/switch?mirror_name=${mirrorName}`, {
          method: 'POST',
        })
        if (!response.ok) throw new Error(`Failed to switch mirror: ${response.statusText}`)
        return await response.json()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // List all models
  const listModels = useCallback(async (): Promise<{ cached_models: ModelInfo[]; active_model: string | null } | null> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${MODEL_MANAGER_BASE_URL}/api/v1/models`)
      if (!response.ok) throw new Error(`Failed to list models: ${response.statusText}`)
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Download a model
  const downloadModel = useCallback(async (modelId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await authFetch(`${MODEL_MANAGER_BASE_URL}/api/v1/models/${modelId}/download`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error(`Failed to download model: ${response.statusText}`)
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Set active model
  const setActiveModel = useCallback(async (modelId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${MODEL_MANAGER_BASE_URL}/api/v1/models/${modelId}/set-active`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error(`Failed to set active model: ${response.statusText}`)
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Search HuggingFace models via backend
  const searchModels = useCallback(async (query: string, filters?: import('../components/models/HFFilterData').HFActiveFilters, limit = 20): Promise<SearchResult[] | null> => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ q: query, limit: String(limit) })
      if (filters?.task)     params.set('task',     filters.task)
      if (filters?.library)  params.set('library',  filters.library)
      if (filters?.language) params.set('language', filters.language)
      if (filters?.license)  params.set('license',  filters.license)
      if (filters?.other)    params.set('other',    filters.other)
      const response = await fetch(`${MODEL_MANAGER_BASE_URL}/api/v1/models/search?${params}`)
      if (!response.ok) throw new Error(`Search failed: ${response.statusText}`)
      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get status of all active downloads
  const getDownloadStatus = useCallback(async (): Promise<Record<string, DownloadQueueEntry> | null> => {
    try {
      const response = await fetch(`${MODEL_MANAGER_BASE_URL}/api/v1/downloads/status`)
      if (!response.ok) return null
      const data = await response.json()
      return (data.queue ?? {}) as Record<string, DownloadQueueEntry>
    } catch {
      return null
    }
  }, [])

  // Cancel an in-progress download
  const cancelDownload = useCallback(async (modelId: string): Promise<boolean> => {
    try {
      await authFetch(`${MODEL_MANAGER_BASE_URL}/api/v1/downloads/${modelId}/cancel`, { method: 'POST' })
      return true
    } catch {
      return false
    }
  }, [])

  // Pause an in-progress download
  const pauseDownload = useCallback(async (modelId: string): Promise<boolean> => {
    try {
      await authFetch(`${MODEL_MANAGER_BASE_URL}/api/v1/downloads/${modelId}/pause`, { method: 'POST' })
      return true
    } catch {
      return false
    }
  }, [])

  // Resume a paused download
  const resumeDownload = useCallback(async (modelId: string): Promise<boolean> => {
    try {
      await authFetch(`${MODEL_MANAGER_BASE_URL}/api/v1/downloads/${modelId}/resume`, { method: 'POST' })
      return true
    } catch {
      return false
    }
  }, [])

  // Fetch all files in a HuggingFace repository (for the file picker)
  const fetchModelFiles = useCallback(async (
    modelId: string,
  ): Promise<{ path: string; size_bytes: number; is_gguf: boolean }[] | null> => {
    try {
      const encoded = encodeURIComponent(modelId).replace(/%2F/g, '/')
      const response = await fetch(`${MODEL_MANAGER_BASE_URL}/api/v1/models/${encoded}/files`)
      if (!response.ok) throw new Error(`Files fetch failed: ${response.statusText}`)
      const data = await response.json()
      return data.files ?? null
    } catch {
      return null
    }
  }, [])

  return {
    loading,
    error,
    checkHealth,
    getMirrorInfo,
    getSwitchMirrorInstructions,
    listModels,
    downloadModel,
    setActiveModel,
    searchModels,
    fetchModelFiles,
    getDownloadStatus,
    cancelDownload,
    pauseDownload,
    resumeDownload,
  }
}
