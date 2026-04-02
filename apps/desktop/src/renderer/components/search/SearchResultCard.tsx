import React from 'react'
import { FileCode } from 'lucide-react'
import type { CodeSnippet } from '../../../shared/semanticSearch'

interface SearchResultCardProps {
  result: CodeSnippet
  rank: number
}

export function SearchResultCard({ result, rank }: SearchResultCardProps) {
  const scorePercent = Math.round(Math.max(0, result.score) * 100)
  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-xs font-mono">#{rank}</span>
          <FileCode size={14} aria-hidden="true" className="text-accent-400" />
          <span className="text-text-primary text-sm font-medium truncate max-w-xs">{result.file_path}</span>
          <span className="text-text-muted text-xs">L{result.start_line}–{result.end_line}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted bg-bg-surface-3 px-2 py-0.5 rounded-full">{result.language}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            scorePercent >= 70 ? 'text-green-500 bg-green-500/10' :
            scorePercent >= 40 ? 'text-yellow-400 bg-yellow-400/10' :
            'text-text-muted bg-bg-surface-3'
          }`}>
            {scorePercent}% match
          </span>
        </div>
      </div>
      <pre className="text-text-code text-xs bg-bg-surface-3 rounded-md p-3 overflow-x-auto max-h-24">
        {result.chunk_text.slice(0, 300)}{result.chunk_text.length > 300 ? '…' : ''}
      </pre>
    </div>
  )
}
