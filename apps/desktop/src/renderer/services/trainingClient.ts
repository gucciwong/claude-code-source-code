/**
 * Training Service Client - Logs completions to training backend
 * Communicates with: services/training-service (FastAPI)
 */

import type { TelemetryEnvelope } from './telemetry'
import { parseResponse } from './parseResponse'
import { TrainingEventResponseSchema, TrainingStatsSchema, TrainingStatusSchema, TrainingVersionSchema } from './schemas'

/** §3.2 Completion event payload — envelope + completion-specific KPI fields */
export interface CompletionEventPayload extends Partial<TelemetryEnvelope> {
  // Required by backend
  prompt: string
  completion: string
  event_type: 'completion_suggested' | 'completion_accepted' | 'completion_rejected' | 'completion_edited' | 'completion_edited_after_accept'
  language?: string
  model_id?: string
  temperature?: number
  top_p?: number
  // §3.2 Completion-specific KPI fields
  completion_type?: 'chat' | 'inline' | 'agent'
  suggestion_length_tokens?: number
  accepted_boolean?: boolean
  edit_distance_after_accept?: number
}

/** §3.2 Inference event payload — envelope + inference-specific KPI fields */
export interface InferenceEventPayload extends TelemetryEnvelope {
  // event_name is one of the 4 inference event names
  prompt_tokens?: number
  completion_tokens?: number
  first_token_latency_ms?: number
  tokens_per_second?: number
  backend_name?: string
  model_quantization?: string
  error_message?: string
}

interface TrainingStats {
  total_events: number
  completion_accepted: number
  completion_rejected: number
  completion_edited: number
  task_completed_total: number
  task_success_rate: number
  recent_events_24h: number
}

interface TrainingStatus {
  model_id: string
  active_cycle: 'quick' | 'full'
  quick_train_count: number
  next_full_train_in: number
  is_training: boolean
}

export class TrainingServiceClient {
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || import.meta.env.VITE_TRAINING_SERVICE_URL || 'http://localhost:8001'
  }

  /**
   * Log a completion event with full KPI envelope (§3.2 completion events)
   */
  async logCompletionEvent(payload: CompletionEventPayload): Promise<{ event_id: string; created_at: string }> {
    const response = await fetch(`${this.baseUrl}/api/v1/training/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      throw new Error(`[Training] Failed to log event: ${response.status}`)
    }

    return parseResponse(TrainingEventResponseSchema, await response.json())
  }

  /**
   * Log an inference event with full KPI envelope (§3.2 inference events)
   * Fires-and-forgets — never throws, never blocks the UI.
   */
  async logInferenceEvent(payload: InferenceEventPayload): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/training/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, event_type: payload.event_name }),
        signal: AbortSignal.timeout(10_000),
      })
      if (!response.ok) {
        console.warn(`[Telemetry] inference event ${payload.event_name} → ${response.status}`)
      }
    } catch {
      // Non-critical — telemetry must never affect UX
    }
  }

  /**
   * Get training statistics (total events, success rate, etc.)
   */
  async getStats(): Promise<TrainingStats | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/training/stats`, { signal: AbortSignal.timeout(10_000) })

      if (!response.ok) {
        console.error(`[Training] Failed to get stats: ${response.status}`)
        return null
      }

      return parseResponse(TrainingStatsSchema, await response.json())
    } catch (error) {
      console.error('[Training] Error fetching stats:', error)
      return null
    }
  }

  /**
   * Get current training status (active cycle, progress, etc.)
   */
  async getStatus(): Promise<TrainingStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/training/status`, { signal: AbortSignal.timeout(10_000) })

      if (!response.ok) {
        console.error(`[Training] Failed to get status: ${response.status}`)
        return null
      }

      return parseResponse(TrainingStatusSchema, await response.json())
    } catch (error) {
      console.error('[Training] Error fetching status:', error)
      return null
    }
  }

  /**
   * Get current deployed model version
   */
  async getVersion(modelId: string): Promise<{ version_id: string; status: string; quality_score: number } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/training/version/${modelId}`, { signal: AbortSignal.timeout(10_000) })

      if (!response.ok) {
        console.error(`[Training] Failed to get version: ${response.status}`)
        return null
      }

      return parseResponse(TrainingVersionSchema, await response.json())
    } catch (error) {
      console.error('[Training] Error fetching version:', error)
      return null
    }
  }

  /**
   * Check if training service is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(5_000) })
      return response.ok
    } catch {
      return false
    }
  }

  // ============================================================================
  // RESEARCH API METHODS - Phase 5
  // ============================================================================

  /**
   * Check if research service is reachable
   * Falls back to the main /health endpoint if the research-specific one is not available
   */
  async healthCheckResearch(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/research/health`, { signal: AbortSignal.timeout(5_000) })
      if (response.ok) return true
      // Fallback: try the main service health endpoint
      return await this.healthCheck()
    } catch {
      // Fallback, try the main service health endpoint
      return await this.healthCheck()
    }
  }

  /**
   * Create a new research program
   */
  async createProgram(data: Partial<any>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/research/programs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      throw new Error(`[Research] Failed to create program: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * List all research programs
   */
  async listPrograms(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/research/programs`, {
        signal: AbortSignal.timeout(10_000),
      })

      if (!response.ok) {
        console.error(`[Research] Failed to list programs: ${response.status}`)
        return []
      }

      const data = await response.json()
      // API returns { items: [...], total, limit, offset } — extract the items array
      // and map fields to match the ResearchProgram interface (program_id, name)
      const rawItems = Array.isArray(data) ? data : (data.items ? Object.values(data.items) : [])
      return rawItems.map((item: any) => ({
        ...item,
        program_id: item.id || item.program_id,
        name: item.run_tag || item.name || item.goal || 'Untitled',
      }))
    } catch (error) {
      console.error('[Research] Error fetching programs:', error)
      return []
    }
  }

  /**
   * Get a specific research program
   */
  async getProgram(programId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/research/programs/${programId}`, {
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      throw new Error(`[Research] Failed to fetch program: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * List experiments for a program
   */
  async listExperiments(programId: string, runTag?: string): Promise<any[]> {
    try {
      const url = new URL(`${this.baseUrl}/api/v1/research/programs/${programId}/experiments`)
      if (runTag) {
        url.searchParams.append('run_tag', runTag)
      }

      const response = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) })

      if (!response.ok) {
        console.error(`[Research] Failed to list experiments: ${response.status}`)
        return []
      }

      const data = await response.json()
      // API returns { items: [...], total, limit, offset } — extract the items array
      // and map fields to match the Experiment interface (experiment_id, duration_seconds, metrics)
      const rawItems = Array.isArray(data) ? data : (data.items ? Object.values(data.items) : [])
      return rawItems.map((item: any) => ({
        ...item,
        experiment_id: item.id || item.experiment_id,
        program_id: item.program_id || programId,
        duration_seconds: item.training_seconds || item.total_seconds || item.duration_seconds || 0,
        metrics: item.metrics || {
          accuracy: item.secondary_metrics?.accuracy ?? 0,
          f1_score: item.secondary_metrics?.f1_score ?? 0,
          loss: item.val_loss ?? 0,
          vram_peak_mb: item.peak_vram_mb ?? 0,
        },
      }))
    } catch (error) {
      console.error('[Research] Error fetching experiments:', error)
      return []
    }
  }

  /**
   * Get a specific experiment
   */
  async getExperiment(experimentId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/research/experiments/${experimentId}`, {
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      throw new Error(`[Research] Failed to fetch experiment: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * List available presets
   */
  async listPresets(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/research/programs/presets`, {
        signal: AbortSignal.timeout(10_000),
      })

      if (!response.ok) {
        console.error(`[Research] Failed to list presets: ${response.status}`)
        return []
      }

      const data = await response.json()
      // API returns { "preset-name": {...}, ... } — convert to array
      // and map fields to match the Preset interface (preset_id, name, description, config)
      const rawPresets = Array.isArray(data) ? data : Object.entries(data).map(([key, value]: [string, any]) => ({
        preset_id: key,
        name: value.run_tag || key,
        description: value.description || value.goal || '',
        config: value,
      }))
      return rawPresets
    } catch (error) {
      console.error('[Research] Error fetching presets:', error)
      return []
    }
  }

  /**
   * Submit a new experiment for a program
   */
  async submitExperiment(programId: string, config: Record<string, unknown>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/research/programs/${programId}/experiments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      throw new Error(`[Research] Failed to submit experiment: ${response.status}`)
    }

    return await response.json()
  }
}

// Singleton instance
let instance: TrainingServiceClient
export function getTrainingClient(): TrainingServiceClient {
  if (!instance) {
    instance = new TrainingServiceClient()
  }
  return instance
}

/**
 * Get research client - uses same backing service but scoped to research endpoints
 * For now, returns the same TrainingServiceClient since research endpoints are
 * part of the training service (port 8001)
 */
export function getResearchClient(): TrainingServiceClient {
  return getTrainingClient()
}
