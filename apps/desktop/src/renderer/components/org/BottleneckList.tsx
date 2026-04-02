import React from 'react'
import { AlertCircle } from 'lucide-react'
import type { Bottleneck } from '../../../shared/orgIntelligence'

interface BottleneckListProps {
  bottlenecks: Bottleneck[]
}

const severityColors: Record<string, string> = {
  high: 'text-red-400',
  medium: 'text-yellow-400',
  low: 'text-text-muted',
}

export function BottleneckList({ bottlenecks }: BottleneckListProps) {
  if (bottlenecks.length === 0) {
    return <p className="text-text-muted text-sm text-center py-8">No bottlenecks detected</p>
  }
  return (
    <div className="space-y-2">
      {bottlenecks.map(b => (
        <div key={b.area} className="bg-bg-surface-2 border border-border-default rounded-lg p-4 flex items-center gap-4">
          <AlertCircle size={16} aria-hidden="true" className={severityColors[b.severity] ?? 'text-text-muted'} />
          <div className="flex-1">
            <p className="text-text-primary text-sm font-medium capitalize">{b.area.replace('_', ' ')}</p>
            <p className="text-text-secondary text-xs">{b.description}</p>
          </div>
          <span className={`text-xs font-medium ${severityColors[b.severity]}`}>{b.severity}</span>
        </div>
      ))}
    </div>
  )
}
