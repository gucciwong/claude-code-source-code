export type EventType = 
  | 'connector_query' | 'trace_executed' | 'pattern_saved'
  | 'training_run' | 'chat_session' | 'code_review' | 'token_usage'

export interface MetricEvent {
  event_type: EventType
  timestamp: number
  value: number
  metadata: Record<string, string>
}

export interface ProductivityMetrics {
  total_sessions: number
  total_tokens: number
  avg_tokens_per_session: number
  total_code_reviews: number
  total_training_runs: number
  acceptance_rate: number
}

export interface QualityTrend {
  date_label: string
  avg_quality_score: number
  pattern_count: number
}

export interface TrainingROI {
  total_training_runs: number
  avg_improvement_pct: number
  time_saved_hours: number
  estimated_roi_multiplier: number
}

export interface AnalyticsReport {
  generated_at: number
  total_events: number
  productivity: ProductivityMetrics
  quality_trends: QualityTrend[]
  training_roi: TrainingROI
}
