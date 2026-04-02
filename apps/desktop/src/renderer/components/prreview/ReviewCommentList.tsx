import React from 'react'
import { AlertTriangle, XCircle, Info } from 'lucide-react'
import type { ReviewComment } from '../../../shared/prReview'

interface ReviewCommentListProps {
  comments: ReviewComment[]
}

const severityIcon = (s: ReviewComment['severity']) => {
  if (s === 'error') return <XCircle size={14} aria-hidden="true" className="text-red-400" />
  if (s === 'warning')
    return <AlertTriangle size={14} aria-hidden="true" className="text-yellow-400" />
  return <Info size={14} aria-hidden="true" className="text-blue-400" />
}

const severityClass = (s: ReviewComment['severity']) => {
  if (s === 'error') return 'border-l-2 border-red-400'
  if (s === 'warning') return 'border-l-2 border-yellow-400'
  return 'border-l-2 border-blue-400'
}

export function ReviewCommentList({ comments }: ReviewCommentListProps) {
  if (comments.length === 0) {
    return <p className="text-text-muted text-sm">No comments — looking clean!</p>
  }
  return (
    <div className="space-y-2">
      {comments.map((c, i) => (
        <div key={i} className={`bg-bg-surface-2 rounded-md p-3 ${severityClass(c.severity)}`}>
          <div className="flex items-center gap-2 mb-1">
            {severityIcon(c.severity)}
            <span className="text-text-secondary text-xs font-mono">
              {c.file_path}:{c.line}
            </span>
            <span className="text-text-muted text-xs ml-auto">{c.rule}</span>
          </div>
          <p className="text-text-primary text-xs">{c.message}</p>
        </div>
      ))}
    </div>
  )
}
