export interface SharedPattern {
  id: string
  language: string
  pattern_text: string
  contributor_count: number
  usage_count: number
  created_at: number
}

export interface ContributeRequest {
  pattern_text: string
  language: string
  contributor_id: string
}

export interface SkillGap {
  topic: string
  adoption_rate: number
  recommended_patterns: string[]
}

export interface SkillGapReport {
  gaps: SkillGap[]
  generated_at: number
}

export interface Bottleneck {
  area: string
  frequency: number
  description: string
  severity: 'low' | 'medium' | 'high'
}
