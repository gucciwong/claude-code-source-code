import React from 'react'
import { FileText } from 'lucide-react'
import type { ContextSummary } from '../../../shared/conversationMemory'

interface ContextViewerProps {
  summary: ContextSummary
}

export function ContextViewer({ summary }: ContextViewerProps) {
  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={14} aria-hidden="true" className="text-accent-400" />
        <span className="text-text-primary text-sm font-medium">Context for: "{summary.query}"</span>
        <span className="text-text-muted text-xs ml-auto">~{summary.token_estimate} tokens</span>
      </div>
      <pre className="text-text-secondary text-xs bg-bg-surface-3 rounded p-3 overflow-x-auto whitespace-pre-wrap font-mono">
        {summary.compressed_context || '(empty)'}
      </pre>
      <p className="text-text-muted text-xs mt-2">{summary.relevant_memories.length} relevant memories</p>
    </div>
  )
}
