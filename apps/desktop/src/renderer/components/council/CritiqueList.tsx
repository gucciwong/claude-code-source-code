import React from 'react'
import { AlertCircle, AlertTriangle, Info, XCircle } from 'lucide-react'
import type { CritiqueItem, Severity } from '../../../shared/personaCouncil'

const severityConfig: Record<Severity, { icon: React.ElementType; color: string; bg: string }> = {
  critical: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/5 border-red-500/15' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/5 border-yellow-500/20' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/15' },
}

interface CritiqueListProps {
  critiques: CritiqueItem[]
}

export function CritiqueList({ critiques }: CritiqueListProps) {
  if (critiques.length === 0) {
    return <p className="text-text-muted text-sm italic">No issues found by this reviewer.</p>
  }
  return (
    <div className="space-y-2">
      {critiques.map((item, i) => {
        const { icon: Icon, color, bg } = severityConfig[item.severity]
        return (
          <div key={i} className={`border rounded-lg p-3 ${bg}`}>
            <div className="flex items-start gap-2">
              <Icon size={15} aria-hidden="true" className={`${color} mt-0.5 shrink-0`} />
              <div>
                <p className="text-text-primary text-sm font-medium">
                  {item.title}
                  {item.line_hint ? (
                    <span className="text-text-muted font-normal ml-1 text-xs">(line {item.line_hint})</span>
                  ) : null}
                </p>
                <p className="text-text-secondary text-xs mt-0.5">{item.description}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
