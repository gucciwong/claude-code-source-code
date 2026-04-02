import React from 'react'
import { Database } from 'lucide-react'
import type { IndexStatus } from '../../../shared/semanticSearch'

interface IndexStatusBadgeProps {
  status: IndexStatus | null
}

export function IndexStatusBadge({ status }: IndexStatusBadgeProps) {
  if (!status) return null
  const color = status.status === 'ready' ? 'text-green-500' :
                status.status === 'indexing' ? 'text-yellow-400' : 'text-text-muted'
  return (
    <div className="flex items-center gap-2 text-xs">
      <Database size={12} aria-hidden="true" className={color} />
      <span className={color}>{status.total_chunks} chunks</span>
      <span className="text-text-muted">·</span>
      <span className="text-text-muted">{status.indexed_files} files</span>
    </div>
  )
}
