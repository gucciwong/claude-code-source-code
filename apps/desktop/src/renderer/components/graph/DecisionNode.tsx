import type { DecisionNode as DecisionNodeType } from '../../../../shared/enterprise'

const TYPE_COLORS: Record<DecisionNodeType['type'], string> = {
  ArchitectureDecision: 'text-accent-400 bg-accent-500/10',
  Refactor: 'text-blue-400 bg-blue-500/10',
  BugFix: 'text-red-400 bg-red-500/10',
  FeatureAdd: 'text-green-500 bg-green-500/10',
  DependencyChange: 'text-yellow-400 bg-yellow-500/10',
}

interface Props {
  node: DecisionNodeType
}

export function DecisionNodeCard({ node }: Props) {
  const colorClass = TYPE_COLORS[node.type]
  const date = new Date(node.timestamp * 1000).toLocaleDateString()

  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4 flex gap-4">
      <div className="flex flex-col items-center gap-1 pt-1">
        <div className="w-2 h-2 rounded-full bg-accent-500" aria-hidden="true" />
        <div className="w-px flex-1 bg-border-subtle" aria-hidden="true" />
      </div>
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${colorClass}`}>{node.type}</span>
          <span className="text-text-muted text-xs">{date}</span>
          <span className="text-text-muted text-xs" aria-hidden="true">·</span>
          <span className="text-text-muted text-xs font-mono">{node.commitHash.slice(0, 7)}</span>
        </div>
        <p className="text-text-primary text-sm font-medium truncate">{node.summary}</p>
        {node.rationale && <p className="text-text-secondary text-xs">{node.rationale}</p>}
        <p className="text-text-muted text-xs">{node.author}</p>
      </div>
    </div>
  )
}
