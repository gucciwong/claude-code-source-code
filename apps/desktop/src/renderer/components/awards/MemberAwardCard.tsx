import React from 'react'
import type { MemberAward } from '../../../shared/awards'
import { AwardBadge } from './AwardBadge'
import { Clock, Star, Code, Bug, BookOpen, type LucideIcon } from 'lucide-react'

interface MemberAwardCardProps {
  award: MemberAward
  onClose: () => void
}

interface StatRowProps {
  icon: LucideIcon
  label: string
  value: string | number
  barPct: number
}

function StatRow({ icon: Icon, label, value, barPct }: StatRowProps) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} aria-hidden="true" className="text-text-muted shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-text-secondary">{label}</span>
          <span className="text-text-primary font-medium">{value}</span>
        </div>
        <div className="h-1.5 bg-bg-surface-3 rounded-full">
          <div
            className="h-full bg-accent-500 rounded-full transition-all"
            style={{ width: `${Math.min(barPct, 100)}%` }}
            role="progressbar"
            aria-valuenow={barPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${label}: ${barPct.toFixed(0)}%`}
          />
        </div>
      </div>
    </div>
  )
}

export function MemberAwardCard({ award, onClose }: MemberAwardCardProps) {
  const { scores } = award

  return (
    <div className="bg-bg-surface-1 border border-border-subtle rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-text-primary text-lg font-semibold">{award.member_name}</h3>
          <p className="text-text-secondary text-sm">Rank #{award.rank} &middot; Score {award.composite_score.toFixed(1)}</p>
        </div>
        <div className="flex items-center gap-3">
          <AwardBadge tier={award.tier} size="lg" />
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 px-2 py-1 rounded"
            aria-label="Close member detail"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        <StatRow icon={Clock} label="Training Hours" value={scores.training_hours} barPct={scores.training_hours / 5} />
        <StatRow icon={Star} label="Arena Stars" value={scores.arena_stars} barPct={scores.arena_stars / 10} />
        <StatRow icon={Code} label="Skills Developed" value={`${scores.skills_developed} (★${scores.skills_star_ranking})`} barPct={scores.skills_developed * 2} />
        <StatRow icon={Bug} label="Issues Solved" value={scores.issues_solved} barPct={scores.issues_solved / 2} />
        <StatRow icon={BookOpen} label="Knowledge Contribution" value={`${scores.knowledge_contribution_pct.toFixed(1)}%`} barPct={scores.knowledge_contribution_pct} />
      </div>
    </div>
  )
}
