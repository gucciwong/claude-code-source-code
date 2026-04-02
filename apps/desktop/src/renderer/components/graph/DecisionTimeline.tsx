import type { DecisionNode } from '../../../../shared/enterprise'
import { DecisionNodeCard } from './DecisionNode'
import { GitBranch } from 'lucide-react'

interface Props {
  nodes: DecisionNode[]
}

export function DecisionTimeline({ nodes }: Props) {
  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <GitBranch size={48} aria-hidden="true" className="text-text-muted" />
        <p className="text-text-muted text-sm">No decision nodes. Click &quot;Load History&quot; to parse git log.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto">
      {nodes.map(node => (
        <DecisionNodeCard key={node.id} node={node} />
      ))}
    </div>
  )
}
