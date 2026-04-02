import { Decision } from '../../store/knowledgeLibraryStore'

interface DecisionLogProps {
  decisions: Decision[]
}

export function DecisionLog({ decisions }: DecisionLogProps) {
  if (decisions.length === 0) {
    return <p className="text-text-muted text-sm">No decisions logged yet.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {decisions.map((decision) => (
        <div
          key={decision.id}
          className="bg-bg-surface-2 border border-border-default rounded-lg p-4"
        >
          <span className="text-text-muted text-xs block mb-1">
            {new Date(decision.timestamp).toLocaleString()}
          </span>
          <p className="text-text-primary text-sm mb-1 font-medium">{decision.summary}</p>
          <p className="text-text-primary text-sm mb-1">{decision.rationale}</p>
          {decision.outcome && (
            <p className="text-text-secondary text-sm mb-2">Outcome: {decision.outcome}</p>
          )}
          {decision.alternatives && decision.alternatives.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {decision.alternatives.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-bg-surface-3 text-text-muted text-xs rounded px-2 py-0.5"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
