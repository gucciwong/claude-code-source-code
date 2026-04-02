import React from 'react'
import { Brain, Trash2, Tag } from 'lucide-react'
import type { Memory } from '../../../shared/conversationMemory'

interface MemoryCardProps {
  memory: Memory
  onDelete: (id: string) => void
}

export function MemoryCard({ memory, onDelete }: MemoryCardProps) {
  const date = new Date(memory.timestamp).toLocaleDateString()
  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <Brain size={14} aria-hidden="true" className="text-accent-400 mt-0.5 shrink-0" />
          <p className="text-text-primary text-sm flex-1 line-clamp-3">{memory.text}</p>
        </div>
        <button
          onClick={() => onDelete(memory.id)}
          className="p-1 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          aria-label={`Delete memory ${memory.id}`}
        >
          <Trash2 size={12} aria-hidden="true" />
        </button>
      </div>
      {memory.tags.length > 0 && (
        <div className="flex items-center gap-1 mt-2">
          <Tag size={11} aria-hidden="true" className="text-text-muted" />
          {memory.tags.map(t => (
            <span key={t} className="text-xs text-text-muted bg-bg-surface-3 px-1.5 py-0.5 rounded">{t}</span>
          ))}
        </div>
      )}
      <p className="text-text-muted text-xs mt-1">{date}</p>
    </div>
  )
}
