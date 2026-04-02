export type Severity = 'info' | 'warning' | 'error' | 'critical'

export interface CritiqueItem {
  title: string
  description: string
  severity: Severity
  line_hint?: number
}

export interface PersonaReview {
  persona_name: string
  persona_description: string
  critiques: CritiqueItem[]
  risk_score: number
}

export interface RiskScore {
  overall: number
  breakdown: Record<string, number>
}

export interface CouncilReport {
  session_id: string
  code_snippet: string
  language: string
  reviews: PersonaReview[]
  risk_score: RiskScore
  consensus_summary: string
}

export interface ReviewRequest {
  code: string
  language: string
  context: string
}
