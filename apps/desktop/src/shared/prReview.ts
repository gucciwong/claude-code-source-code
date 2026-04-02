export interface ReviewComment {
  file_path: string
  line: number
  severity: 'error' | 'warning' | 'info'
  rule: string
  message: string
}

export interface ReviewSummary {
  total_files: number
  total_changes: number
  errors: number
  warnings: number
  infos: number
  score: number
}

export interface ReviewResult {
  summary: ReviewSummary
  comments: ReviewComment[]
  approved: boolean
}

export interface ReviewRule {
  id: string
  severity: 'error' | 'warning' | 'info'
  message: string
}
