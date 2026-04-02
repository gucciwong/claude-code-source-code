import React from 'react'
import { Code } from 'lucide-react'
import type { Completion } from '../../../shared/codeCompletion'

interface CompletionItemProps {
  completion: Completion
  isActive: boolean
  onAccept: (text: string) => void
}

export function CompletionItem({ completion, isActive, onAccept }: CompletionItemProps) {
  const pct = Math.round(completion.confidence * 100)
  return (
    <button
      onClick={() => onAccept(completion.text)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 text-left ${isActive ? 'bg-accent-500/20 text-text-primary' : 'text-text-secondary hover:bg-bg-surface-3'}`}
    >
      <Code size={14} aria-hidden="true" className="text-accent-400 shrink-0" />
      <span className="text-sm font-mono flex-1">{completion.text}</span>
      <span className="text-xs text-text-muted">{pct}%</span>
    </button>
  )
}
