export interface Completion {
  text: string
  confidence: number
  source: 'ngram' | 'prefix' | 'template'
}

export interface CompletionRequest {
  prefix: string
  context?: string
  max_results?: number
}

export interface CompletionFeedback {
  completion: string
  accepted: boolean
}
