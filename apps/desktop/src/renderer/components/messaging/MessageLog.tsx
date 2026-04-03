import React from 'react'
import { MessageSquare, ArrowRight } from 'lucide-react'
import type { MessageLogEntry } from '../../../shared/messaging'
import { IM_PLATFORM_LABELS } from '../../../shared/messaging'

interface MessageLogProps {
  entries: MessageLogEntry[]
}

export function MessageLog({ entries }: MessageLogProps) {
  if (entries.length === 0) {
    return (
      <div className="space-y-2" role="log" aria-label="Message history">
        <div className="flex flex-col items-center justify-center h-32 gap-2">
          <MessageSquare size={24} aria-hidden="true" className="text-text-muted" />
          <p className="text-text-muted text-sm">No messages yet</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-2" role="log" aria-label="Message history">
      {entries.map((entry, idx) => {
        const platformLabel =
          IM_PLATFORM_LABELS[entry.platform as keyof typeof IM_PLATFORM_LABELS] ?? entry.platform
        const date = new Date(entry.timestamp * 1000)
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        return (
          <div key={idx} className="bg-bg-surface-2 border border-border-subtle rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-text-muted">{timeStr}</span>
              <span className="text-xs bg-bg-surface-3 text-text-secondary px-2 py-0.5 rounded-full">
                {platformLabel}
              </span>
              <span className="text-xs text-text-muted">from {entry.sender_id}</span>
            </div>
            <div className="flex items-start gap-2">
              <code className="text-accent-400 text-xs bg-bg-surface-3 px-2 py-1 rounded flex-shrink-0">
                {entry.command}
              </code>
              <ArrowRight size={12} aria-hidden="true" className="text-text-muted mt-1 flex-shrink-0" />
              <p className="text-text-secondary text-xs">
                {entry.response.slice(0, 120)}
                {entry.response.length > 120 ? '…' : ''}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
