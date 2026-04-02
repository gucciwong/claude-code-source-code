import React from 'react'
import { CheckCircle2, Clock, Loader2, XCircle, AlertCircle } from 'lucide-react'
import type { TaskSpec } from '../../../shared/orchestration'

interface TaskNodeProps {
  task: TaskSpec
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-text-muted', bg: 'bg-bg-surface-3' },
  running: { icon: Loader2, color: 'text-accent-400', bg: 'bg-bg-surface-3' },
  completed: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  cancelled: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
}

export function TaskNode({ task }: TaskNodeProps) {
  const { icon: Icon, color, bg } = statusConfig[task.status]
  return (
    <div className={`${bg} border border-border-default rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon
          size={18}
          className={`${color} mt-0.5 shrink-0 ${task.status === 'running' ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-text-primary text-sm font-medium truncate">{task.title}</p>
          <p className="text-text-muted text-xs mt-1 line-clamp-2">{task.description}</p>
          {task.result && (
            <p className="text-text-secondary text-xs mt-2 line-clamp-2">{task.result}</p>
          )}
          {task.error && (
            <p className="text-red-400 text-xs mt-2">{task.error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
