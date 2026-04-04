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
}

// Singleton instance
let instance: TrainingServiceClient
export function getTrainingClient(): TrainingServiceClient {
  if (!instance) {
    instance = new TrainingServiceClient()
  }
  return instance
}
