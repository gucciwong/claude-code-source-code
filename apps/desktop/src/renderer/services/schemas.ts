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
  version: z.string().optional(),
  models: z
    .object({
      asr_loaded: z.boolean(),
      tts_loaded: z.boolean(),
    })
    .optional(),
})

export const TranscribeResponseSchema = z.object({
  text: z.string(),
  language: z.string(),
  confidence: z.number(),
  error: z.string().nullable().optional(),
})

export const SynthesizeResponseSchema = z.object({
  audio_url: z.string(),
  duration: z.number(),
})

// ── Code Completion ──

export const CompletionItemSchema = z.object({
  text: z.string(),
  score: z.number().optional(),
})

export const CompletionsResponseSchema = z.object({
  completions: z.array(CompletionItemSchema),
})

// ── Analytics ──

export const ProductivityMetricsSchema = z.object({
  completions_accepted: z.number(),
  completions_shown: z.number(),
  acceptance_rate: z.number(),
  time_saved_minutes: z.number().optional(),
})

export const QualityTrendSchema = z.object({
  date: z.string(),
  score: z.number(),
})

export const TrainingROISchema = z.object({
  hours_invested: z.number(),
  quality_improvement: z.number(),
  roi_factor: z.number().optional(),
})

// ── Conversation Memory ──

export const MemorySchema = z.object({
  id: z.string(),
  content: z.string(),
  type: z.string().optional(),
  created_at: z.string().optional(),
})

export const MemoriesResponseSchema = z.object({
  memories: z.array(MemorySchema),
})

export const MemorySearchResponseSchema = z.object({
  results: z.array(MemorySchema),
})

export const ContextSummarySchema = z.object({
  summary: z.string(),
  memory_count: z.number().optional(),
})
