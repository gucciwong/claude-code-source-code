import React from 'react'
import { Code2, Users } from 'lucide-react'
import type { SharedPattern } from '../../../shared/orgIntelligence'

interface PatternCardProps {
  pattern: SharedPattern
}

export function PatternCard({ pattern }: PatternCardProps) {
  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-text-muted text-xs font-mono bg-bg-surface-3 px-2 py-0.5 rounded">{pattern.language}</span>
        <div className="flex items-center gap-1 text-text-muted text-xs">
          <Users size={12} aria-hidden="true" />
          <span>{pattern.contributor_count}</span>
        </div>
      </div>
      <pre className="text-text-primary text-xs font-mono overflow-x-auto whitespace-pre-wrap line-clamp-5">{pattern.pattern_text}</pre>
    </div>
  )
}
