/**
 * Model Manager API Client
 * Communicates with model-manager service (http://localhost:8002)
 * Handles all model lifecycle operations: list, download, load, inference, export
 */

const API_BASE = import.meta.env.VITE_MODEL_MANAGER_URL ?? 'http://localhost:8002'

/** Matches the shape returned by GET /api/v1/models cached_models[] */
export interface ModelMetadata {
  id: string
  name: string
  cached: boolean
  size_bytes: number
  local_path: string
  format: string
  source: string
  status?: string
}

function shouldPreferModel(candidate: ModelMetadata, current: ModelMetadata): boolean {
  const candidateReady = candidate.status === 'ready'
  const currentReady = current.status === 'ready'
  if (candidateReady !== currentReady) {
    return candidateReady
  }

  const candidateCanonical = candidate.id.includes('/')
  const currentCanonical = current.id.includes('/')
  if (candidateCanonical !== currentCanonical) {
    return candidateCanonical
  }

  return candidate.size_bytes >= current.size_bytes
}

function dedupeModels(models: ModelMetadata[]): ModelMetadata[] {
  const byPath = new Map<string, ModelMetadata>()

  for (const model of models) {
    const key = model.local_path || model.id
    const existing = byPath.get(key)
    if (!existing || shouldPreferModel(model, existing)) {
      byPath.set(key, model)
    }
  }

  return Array.from(byPath.values())
}

export interface TrainingConfig {
  base_model: string
  dataset_path: string
  output_path: string
  epochs: number
  batch_size: number
  learning_rate: number
  lora_r: number
  lora_alpha: number
}

export interface TrainingJob {
  job_id: string
  model_name: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  progress: number
  created_at: string
  started_at?: string
  completed_at?: string
  error?: string
}

/** Options for the one-click beginner training mode. All fields optional — defaults used when absent. */
export interface AutoTrainingOptions {
  base_model?: string
  use_completion_events?: boolean
  use_corrections?: boolean
  use_task_trajectories?: boolean
  use_chat_history?: boolean
  use_knowledge?: boolean
  epochs?: number
  batch_size?: number
  learning_rate?: number
  lora_rank?: number
}

export interface AutoDatasetStats {
  completion_event_count: number
  correction_count: number
  trajectory_count: number
  chat_message_count: number
  total_pairs: number
  estimated_model: string
}

export interface DownloadStatus {
  status: string
  progress: number
  total_size_gb: number
  downloaded_gb: number
  model_name?: string
  error?: string
  local_path?: string
}

class ModelManagerAPI {
  /**
   * List all cached models from the model-manager registry
   */
  async listModels(): Promise<{ models: ModelMetadata[]; activeModel: string | null }> {
    const res = await fetch(`${API_BASE}/api/v1/models`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`Failed to list models: HTTP ${res.status}`)
    const data = await res.json() as { cached_models: ModelMetadata[]; active_model: string | null }
    return {
      models: dedupeModels(data.cached_models || []),
      activeModel: data.active_model ?? null,
    }
  }

  /**
   * Set a model as the active model (loads it into memory for inference)
   */
  async setActiveModel(modelId: string, loadConfig?: Record<string, unknown>): Promise<{ active_model: string }> {
    const res = await fetch(`${API_BASE}/api/v1/models/${encodeURIComponent(modelId)}/set-active`, {
      method: 'POST',
      headers: loadConfig ? { 'Content-Type': 'application/json' } : {},
      body: loadConfig ? JSON.stringify(loadConfig) : undefined,
      signal: AbortSignal.timeout(120_000), // loading can take time
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { detail?: string }
      throw new Error(body.detail || `Failed to set active model: HTTP ${res.status}`)
    }
    return res.json()
  }

  /**
   * Unload a model from memory
   */
  async unloadModel(modelId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/v1/models/${encodeURIComponent(modelId)}/unload`, {
      method: 'POST',
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) throw new Error(`Failed to unload model: HTTP ${res.status}`)
  }

  /**
   * Download model from HuggingFace Hub
   */
  async downloadFromHuggingFace(modelId: string, ggufFile?: string): Promise<any> {
    const url = new URL(`${API_BASE}/api/v1/models/${encodeURIComponent(modelId)}/download`)
    if (ggufFile) url.searchParams.set('gguf_file', ggufFile)
    const res = await fetch(url.toString(), {
      method: 'POST',
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) throw new Error(`Failed to start download: HTTP ${res.status}`)
    return res.json()
  }

  /**
   * Get download status for all in-progress downloads
   */
  async getDownloadStatus(): Promise<Record<string, DownloadStatus>> {
    const res = await fetch(`${API_BASE}/api/v1/downloads/status`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`Failed to get download status: HTTP ${res.status}`)
    const data = await res.json()
    return data.queue || {}
  }

  /**
   * Cancel a download
   */
  async cancelDownload(modelId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/v1/downloads/${encodeURIComponent(modelId)}/cancel`, {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`Failed to cancel download: HTTP ${res.status}`)
  }

  /**
   * Pause an in-progress download
   */
  async pauseDownload(modelId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/v1/downloads/${encodeURIComponent(modelId)}/pause`, {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`Failed to pause download: HTTP ${res.status}`)
  }

  /**
   * Resume a paused download
   */
  async resumeDownload(modelId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/v1/downloads/${encodeURIComponent(modelId)}/resume`, {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`Failed to resume download: HTTP ${res.status}`)
  }

  /**
   * Export model to a different format
   */
  async exportModel(modelId: string, targetFormat: string = 'safetensors'): Promise<any> {
    const res = await fetch(`${API_BASE}/api/v1/models/${encodeURIComponent(modelId)}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_format: targetFormat }),
      signal: AbortSignal.timeout(300_000),
    })
    if (!res.ok) throw new Error(`Failed to export model: HTTP ${res.status}`)
    return res.json()
  }

  /**
   * Delete a cached model
   */
  async deleteModel(modelId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/v1/models/${encodeURIComponent(modelId)}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) throw new Error(`Failed to delete model: HTTP ${res.status}`)
  }

  /**
   * Run streaming inference via model-manager SSE endpoint
   */
  async *streamInference(
    prompt: string,
    options?: {
      model_id?: string
      max_tokens?: number
      temperature?: number
      top_p?: number
      top_k?: number
      min_p?: number
      repeat_penalty?: number
      frequency_penalty?: number
      presence_penalty?: number
      seed?: number
      stop?: string
      signal?: AbortSignal
    }
  ): AsyncGenerator<string> {
    const params = new URLSearchParams({ prompt })
    if (options?.model_id) params.set('model_id', options.model_id)
    if (options?.max_tokens) params.set('max_tokens', String(options.max_tokens))
    if (options?.temperature !== undefined) params.set('temperature', String(options.temperature))
    if (options?.top_p !== undefined) params.set('top_p', String(options.top_p))
    if (options?.top_k !== undefined) params.set('top_k', String(options.top_k))
    if (options?.min_p !== undefined) params.set('min_p', String(options.min_p))
    if (options?.repeat_penalty !== undefined) params.set('repeat_penalty', String(options.repeat_penalty))
    if (options?.frequency_penalty !== undefined) params.set('frequency_penalty', String(options.frequency_penalty))
    if (options?.presence_penalty !== undefined) params.set('presence_penalty', String(options.presence_penalty))
    if (options?.seed !== undefined && options.seed >= 0) params.set('seed', String(options.seed))
    if (options?.stop) params.set('stop', options.stop)

    const res = await fetch(`${API_BASE}/api/v1/inference?${params}`, {
      method: 'POST',
      signal: options?.signal,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { detail?: string }
      throw new Error(body.detail || `Inference failed: HTTP ${res.status}`)
    }
    if (!res.body) return

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue
          try {
            const json = JSON.parse(line.slice(6)) as { token?: string }
            if (json.token) yield json.token
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * Non-streaming inference
   */
  async completeInference(
    prompt: string,
    options?: { model_id?: string; max_tokens?: number; temperature?: number }
  ): Promise<string> {
    const params = new URLSearchParams({ prompt })
    if (options?.model_id) params.set('model_id', options.model_id)
    if (options?.max_tokens) params.set('max_tokens', String(options.max_tokens))
    if (options?.temperature !== undefined) params.set('temperature', String(options.temperature))

    const res = await fetch(`${API_BASE}/api/v1/inference/complete?${params}`, {
      method: 'POST',
      signal: AbortSignal.timeout(120_000),
    })
    if (!res.ok) throw new Error(`Inference failed: HTTP ${res.status}`)
    const data = await res.json()
    return data.text
  }

  /**
   * Start training job — delegates to training-service on port 8001
   */
  async startTraining(config: TrainingConfig): Promise<TrainingJob> {
    const res = await fetch('http://localhost:8001/finetune/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) throw new Error(`Failed to start training: HTTP ${res.status}`)
    const data = await res.json()
    return data.job
  }

  /**
   * Start one-click beginner training — auto-collects user data, no config required.
   * Backend assembles a JSONL dataset from accepted completions, corrections and task
   * trajectories already stored in the training service DB, then launches a fine-tune job.
   */
  async startOneClickTraining(options?: AutoTrainingOptions): Promise<TrainingJob & { data_stats?: AutoDatasetStats; base_model?: string; message?: string }> {
    const res = await fetch('http://localhost:8001/finetune/auto-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options ?? {}),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail ?? `Failed to start one-click training: HTTP ${res.status}`)
    }
    return res.json()
  }

  /**
   * Fetch how much auto-collectable data is available before starting a job.
   */
  async getAutoDatasetStats(): Promise<AutoDatasetStats> {
    const res = await fetch('http://localhost:8001/finetune/auto-dataset-stats', {
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`Failed to fetch auto dataset stats: HTTP ${res.status}`)
    return res.json()
  }

  /**
   * Submit chat messages to the training service for use in fine-tuning.
   */
  async submitChatMessages(messages: Array<{ role: string; content: string; session_id?: string; model_id?: string }>): Promise<{ stored: number }> {
    const res = await fetch('http://localhost:8001/finetune/chat-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) throw new Error(`Failed to submit chat messages: HTTP ${res.status}`)
    return res.json()
  }

  /**
   * Get training job status — delegates to training-service on port 8001
   */
  async getTrainingStatus(jobId: string): Promise<TrainingJob> {
    const res = await fetch(`http://localhost:8001/finetune/status/${encodeURIComponent(jobId)}`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`Failed to get training status: HTTP ${res.status}`)
    const data = await res.json()
    return data.job
  }

  /**
   * Search HuggingFace for models
   */
  async searchModels(query: string, limit: number = 20): Promise<any[]> {
    const params = new URLSearchParams({ q: query, limit: String(limit) })
    const res = await fetch(`${API_BASE}/api/v1/models/search?${params}`, {
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`Search failed: HTTP ${res.status}`)
    return res.json()
  }

  /**
   * Get health / service status
   */
  async getHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) throw new Error(`Health check failed: HTTP ${res.status}`)
    return res.json()
  }

  /**
   * Check if model-manager service is available
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`, {
        signal: AbortSignal.timeout(5_000),
      })
      return res.ok
    } catch {
      return false
    }
  }
}

export const modelManagerAPI = new ModelManagerAPI()

// Convenience named exports used by Models.tsx
export const downloadFromHuggingFace = (modelId: string, ggufFile?: string) =>
  modelManagerAPI.downloadFromHuggingFace(modelId, ggufFile)

export const getDownloadStatus = () =>
  modelManagerAPI.getDownloadStatus()

export const cancelDownload = (modelId: string) =>
  modelManagerAPI.cancelDownload(modelId)

export const pauseDownload = (modelId: string) =>
  modelManagerAPI.pauseDownload(modelId)

export const resumeDownload = (modelId: string) =>
  modelManagerAPI.resumeDownload(modelId)
