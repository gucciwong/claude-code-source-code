import axios, { AxiosInstance } from 'axios'

export interface CompletionEvent {
  prompt: string
  completion: string
  event_type: 'completion_accepted' | 'completion_rejected' | 'completion_edited'
  language: string
  file_path?: string
  line_number?: number
  timestamp?: string
}

export interface TrainingStats {
  total_events: number
  completion_accepted: number
  completion_rejected: number
  completion_edited: number
  task_completed_total: number
  task_success_rate: number
  recent_events_24h: number
}

export interface TrainingStatus {
  is_training: boolean
  current_model: string | null
  progress_percent: number
  uptime_seconds: number
  last_event_time: string | null
}

export interface TrainingServiceResponse {
  event_id: string
  created_at: string
}

/**
 * VSCode extension client for training service integration
 * Provides non-blocking event logging and stats retrieval
 */
export class TrainingServiceClient {
  private client: AxiosInstance
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:8001') {
    this.baseUrl = baseUrl
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 5000, // 5s timeout (won't block editor)
    })
  }

  /**
   * Log a completion event to training service
   * Non-blocking: errors silently logged
   */
  async logCompletionEvent(event: CompletionEvent): Promise<TrainingServiceResponse | null> {
    try {
      const response = await this.client.post<TrainingServiceResponse>(
        '/api/v1/training/event',
        event
      )
      return response.data
    } catch (error) {
      console.error('[Training] Failed to log completion:', error)
      return null
    }
  }

  /**
   * Get training statistics
   */
  async getStats(): Promise<TrainingStats | null> {
    try {
      const response = await this.client.get<TrainingStats>('/api/v1/training/stats')
      return response.data
    } catch (error) {
      console.error('[Training] Failed to fetch stats:', error)
      return null
    }
  }

  /**
   * Get training status
   */
  async getStatus(): Promise<TrainingStatus | null> {
    try {
      const response = await this.client.get<TrainingStatus>('/api/v1/training/status')
      return response.data
    } catch (error) {
      console.error('[Training] Failed to fetch status:', error)
      return null
    }
  }

  /**
   * Check if service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health')
      return response.status === 200
    } catch (error) {
      return false
    }
  }

  /**
   * Update service URL dynamically
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url
    this.client = axios.create({
      baseURL: url,
      timeout: 5000,
    })
  }
}

let trainingClient: TrainingServiceClient | null = null

/**
 * Get or create singleton training client
 */
export function getTrainingClient(baseUrl?: string): TrainingServiceClient {
  if (!trainingClient) {
    trainingClient = new TrainingServiceClient(baseUrl || 'http://localhost:8001')
  } else if (baseUrl) {
    trainingClient.setBaseUrl(baseUrl)
  }
  return trainingClient
}
