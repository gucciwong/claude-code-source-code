export type AwardTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

export interface MemberScores {
  member_id: string
  member_name: string
  training_hours: number
  arena_stars: number
  skills_developed: number
  skills_star_ranking: number
  issues_solved: number
  knowledge_contribution_pct: number
}

export interface MemberAward {
  member_id: string
  member_name: string
  scores: MemberScores
  composite_score: number
  tier: AwardTier
  rank: number
}

export interface OrgLeaderboard {
  org_id: string
  generated_at: number
  members: MemberAward[]
}
