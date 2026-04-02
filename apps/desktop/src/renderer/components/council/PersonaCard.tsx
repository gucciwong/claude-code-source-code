import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { PersonaReview } from '../../../shared/personaCouncil'
import { RiskScoreBadge } from './RiskScoreBadge'
import { CritiqueList } from './CritiqueList'

interface PersonaCardProps {
  review: PersonaReview
}

export function PersonaCard({ review }: PersonaCardProps) {
  const [expanded, setExpanded] = useState(true)
  const ChevronIcon = expanded ? ChevronDown : ChevronRight
  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <ChevronIcon size={16} aria-hidden="true" className="text-text-muted shrink-0" />
          <div className="text-left">
            <p className="text-text-primary text-sm font-medium">{review.persona_name}</p>
            <p className="text-text-muted text-xs">
              {review.critiques.length} issue{review.critiques.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <RiskScoreBadge score={review.risk_score} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-border-subtle pt-3">
          <p className="text-text-secondary text-xs mb-3">{review.persona_description}</p>
          <CritiqueList critiques={review.critiques} />
        </div>
      )}
    </div>
  )
}
