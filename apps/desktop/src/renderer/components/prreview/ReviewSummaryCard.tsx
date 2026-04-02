import React from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'
import type { ReviewSummary } from '../../../shared/prReview'

interface ReviewSummaryCardProps {
  summary: ReviewSummary
  approved: boolean
}

export function ReviewSummaryCard({ summary, approved }: ReviewSummaryCardProps) {
  return (
    <div
      className={`bg-bg-surface-2 border rounded-lg p-4 ${
        approved ? 'border-green-500/50' : 'border-red-500/50'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        {approved ? (
          <CheckCircle2 size={18} aria-hidden="true" className="text-green-500" />
        ) : (
          <XCircle size={18} aria-hidden="true" className="text-red-400" />
        )}
        <span className="text-text-primary text-sm font-semibold">
          {approved ? 'Approved' : 'Changes Required'}
        </span>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-bg-surface-3 text-text-secondary">
          Score: {summary.score}/100
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3 text-center">
        <div>
          <p className="text-text-muted text-xs">Files</p>
          <p className="text-text-primary text-sm font-bold">{summary.total_files}</p>
        </div>
        <div>
          <p className="text-red-400 text-xs">Errors</p>
          <p className="text-red-400 text-sm font-bold">{summary.errors}</p>
        </div>
        <div>
          <p className="text-yellow-400 text-xs">Warnings</p>
          <p className="text-yellow-400 text-sm font-bold">{summary.warnings}</p>
        </div>
        <div>
          <p className="text-text-muted text-xs">Infos</p>
          <p className="text-text-primary text-sm font-bold">{summary.infos}</p>
        </div>
      </div>
    </div>
  )
}
