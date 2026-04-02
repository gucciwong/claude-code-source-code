import React from 'react'
import { Cpu } from 'lucide-react'
import type { OrchestratorSession } from '../../../shared/orchestration'

interface AgentCardProps {
  session: OrchestratorSession
  isActive?: boolean
  onClick?: () => void
}

const statusColors: Record<string, string> = {
  pending: 'text-text-muted',
  running: 'text-accent-400',
  completed: 'text-green-400',
  failed: 'text-red-400',
  cancelled: 'text-yellow-400',
}

export function AgentCard({ session, isActive, onClick }: AgentCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-bg-surface-2 border rounded-lg p-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors ${
        isActive ? 'border-accent-500' : 'border-border-default hover:border-border-strong'
      }`}
      aria-pressed={isActive}
    >
      <div className="flex items-center gap-3 mb-2">
        <Cpu size={16} aria-hidden="true" className="text-text-muted shrink-0" />
        <span className="text-text-primary text-sm font-medium truncate">{session.goal}</span>
      </div>
      <span className={`text-xs font-medium ${statusColors[session.status] ?? 'text-text-muted'}`}>
        {session.status.charAt(0).toUpperCase() + session.status.slice(1)} · {session.tasks.length} tasks
      </span>
    </button>
  )
}
