import React from 'react'
import { RefreshCw, CheckCircle2, XCircle, Clock, Square } from 'lucide-react'
import type { FinetuneJob } from '../../../shared/finetuning'

interface JobStatusCardProps {
  job: FinetuneJob
  onStop?: (id: string) => void
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'running') {
    return <RefreshCw size={14} aria-hidden="true" className="text-yellow-400 animate-spin" />
  }
  if (status === 'complete') {
    return <CheckCircle2 size={14} aria-hidden="true" className="text-green-500" />
  }
  if (status === 'failed' || status === 'stopped') {
    return <XCircle size={14} aria-hidden="true" className="text-red-400" />
  }
  return <Clock size={14} aria-hidden="true" className="text-text-muted" />
}

export function JobStatusCard({ job, onStop }: JobStatusCardProps) {
  const pct = Math.round(job.progress * 100)
  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusIcon status={job.status} />
          <span className="text-text-primary text-sm font-medium truncate max-w-xs font-mono">
            {job.job_id.slice(0, 8)}
          </span>
          <span className="text-text-muted text-xs">{job.status}</span>
        </div>
        {job.status === 'running' && onStop && (
          <button
            onClick={() => onStop(job.job_id)}
            className="flex items-center gap-1 text-xs text-red-400 hover:bg-red-500/10 rounded px-2 py-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            aria-label="Stop fine-tune job"
          >
            <Square size={10} aria-hidden="true" />
            Stop
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 bg-bg-surface-3 rounded-full h-1.5">
          <div className="bg-accent-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-text-muted text-xs">{pct}%</span>
      </div>
      <p className="text-text-muted text-xs">
        Epoch {job.current_epoch}/{job.total_epochs} · {pct}% complete
      </p>
    </div>
  )
}
