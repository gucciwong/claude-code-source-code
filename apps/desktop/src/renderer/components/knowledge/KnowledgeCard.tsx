import { Trash2 } from 'lucide-react'
import { Snippet } from '../../store/knowledgeLibraryStore'

interface KnowledgeCardProps {
  snippet: Snippet
  onDelete?: (id: string) => void
}

export function KnowledgeCard({ snippet, onDelete }: KnowledgeCardProps) {
  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4">
      {/* Top row: badges + quality score */}
      <div className="flex items-center gap-2 mb-2">
        <span className="bg-bg-surface-3 text-text-secondary text-xs px-2 py-0.5 rounded">
          {snippet.language}
        </span>
        <span className="bg-bg-surface-3 text-text-secondary text-xs px-2 py-0.5 rounded">
          {snippet.domain}
        </span>
        <span className="ml-auto text-text-muted text-xs">
          {Math.round(snippet.qualityScore * 100)}%
        </span>
      </div>

      {/* Content */}
      <pre className="text-text-primary text-sm font-mono overflow-hidden max-h-[7.5rem] leading-5 whitespace-pre-wrap break-all">
        {snippet.text}
      </pre>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-text-muted text-xs">
          {new Date(snippet.createdAt).toLocaleDateString()}
        </span>
        {onDelete && (
          <button
            onClick={() => onDelete(snippet.id)}
            aria-label="Delete snippet"
            className="text-red-400 hover:text-red-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
