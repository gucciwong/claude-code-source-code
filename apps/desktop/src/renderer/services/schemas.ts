import { z } from 'zod'

// ── Model Manager ──

export const ModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.string().optional(),
  quantization: z.string().optional(),
  format: z.string().optional(),
  status: z.string().optional(),
})

export const ModelsResponseSchema = z.object({
  models: z.array(ModelSchema).optional(),
  cached_models: z.array(ModelSchema).optional(),
  active_model: ModelSchema.nullable().optional(),
})

export const DownloadStatusSchema = z.object({
  status: z.string().optional(),
  progress: z.number().optional(),
  error: z.string().optional(),
  queue: z.record(z.object({
    progress: z.number().optional(),
    status: z.string().optional(),
  })).optional(),
})

export const SearchModelsSchema = z.array(ModelSchema)

// ── Training Service ──

export const TrainingEventResponseSchema = z.object({
  event_id: z.string(),
  created_at: z.string(),
})

export const TrainingStatsSchema = z.object({
  total_events: z.number(),
  total_tasks: z.number(),
  events_today: z.number(),
  top_languages: z.array(z.object({ language: z.string(), count: z.number() })),
})

export const TrainingStatusSchema = z.object({
  status: z.string(),
  last_export: z.string().nullable().optional(),
  pending_events: z.number(),
})

export const TrainingVersionSchema = z.object({
  version_id: z.string(),
  status: z.string(),
  quality_score: z.number().optional(),
})

// ── Voice Service ──

export const HealthResponseSchema = z.object({
  status: z.string(),
  asr_loaded: z.boolean(),
  tts_loaded: z.boolean(),
})

export const TranscribeResponseSchema = z.object({
  text: z.string(),
  language: z.string(),
  confidence: z.number(),
  duration: z.number(),
})

export const SynthesizeResponseSchema = z.object({
  audio_url: z.string(),
  duration: z.number(),
})

// ── Code Completion ──

export const CompletionItemSchema = z.object({
  text: z.string(),
  confidence: z.number(),
  source: z.enum(['ngram', 'prefix', 'template']),
})

export const CompletionsResponseSchema = z.object({
  completions: z.array(CompletionItemSchema),
})

// ── Analytics ──

export const ProductivityMetricsSchema = z.object({
  total_sessions: z.number(),
  total_tokens: z.number(),
  avg_tokens_per_session: z.number(),
  total_code_reviews: z.number(),
  total_training_runs: z.number(),
  acceptance_rate: z.number(),
})

export const QualityTrendSchema = z.object({
  date_label: z.string(),
  avg_quality_score: z.number(),
  pattern_count: z.number(),
})

export const TrainingROISchema = z.object({
  total_training_runs: z.number(),
  avg_improvement_pct: z.number(),
  time_saved_hours: z.number(),
  estimated_roi_multiplier: z.number(),
})

// ── Conversation Memory ──

export const MemorySchema = z.object({
  id: z.string(),
  text: z.string(),
  tags: z.array(z.string()),
  relevance_score: z.number(),
  timestamp: z.string(),
})

export const MemoriesResponseSchema = z.object({
  memories: z.array(MemorySchema),
})

export const MemorySearchResponseSchema = z.object({
  results: z.array(z.object({
    memory: MemorySchema,
    score: z.number(),
  })),
})

export const ContextSummarySchema = z.object({
  query: z.string(),
  relevant_memories: z.array(MemorySchema),
  compressed_context: z.string(),
  token_estimate: z.number(),
})
