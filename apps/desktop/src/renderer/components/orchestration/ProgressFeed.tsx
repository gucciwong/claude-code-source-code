import React from 'react'
import type { OrchestratorSession } from '../../../shared/orchestration'
import { TaskNode } from './TaskNode'

interface ProgressFeedProps {
  session: OrchestratorSession
}

export function ProgressFeed({ session }: ProgressFeedProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-3">
        Tasks ({session.tasks.filter(t => t.status === 'completed').length}/{session.tasks.length})
      </h3>
      {session.tasks.map(task => (
        <TaskNode key={task.id} task={task} />
      ))}
    </div>
  )
}
