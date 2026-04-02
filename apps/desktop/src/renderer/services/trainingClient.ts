/**
 * Training Service Client - Logs completions to training backend
 * Communicates with: services/training-service (FastAPI)
 */

interface CompletionEventPayload {
  prompt: string
  completion: string
  event_type: 'completion_accepted' | 'completion_rejected' | 'completion_edited'
  language?: string
  model_id?: string
  temperature?: number
  top_p?: number
  [key: string]: unknown
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
   * Log a completion event (code accepted, rejected, or edited)
   */
  async logCompletionEvent(payload: CompletionEventPayload): Promise<{ event_id: string; created_at: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/training/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        console.error(`[Training] Failed to log event: ${response.status}`)
        return { event_id: 'error', created_at: new Date().toISOString() }
      }

      return await response.json()
    } catch (error) {
      console.error('[Training] Error logging completion event:', error)
      return { event_id: 'error', created_at: new Date().toISOString() }
    }
  }

  /**
   * Get training statistics (total events, success rate, etc.)
   */
  async getStats(): Promise<TrainingStats | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/training/stats`)

      if (!response.ok) {
        console.error(`[Training] Failed to get stats: ${response.status}`)
        return null
      }

      return await response.json()
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
      const response = await fetch(`${this.baseUrl}/api/v1/training/status`)

      if (!response.ok) {
        console.error(`[Training] Failed to get status: ${response.status}`)
        return null
      }

      return await response.json()
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
      const response = await fetch(`${this.baseUrl}/api/v1/training/version/${modelId}`)

      if (!response.ok) {
        console.error(`[Training] Failed to get version: ${response.status}`)
        return null
      }

      return await response.json()
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
      const response = await fetch(`${this.baseUrl}/health`)
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
