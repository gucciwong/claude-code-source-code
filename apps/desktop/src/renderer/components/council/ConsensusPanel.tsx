import React from 'react'
import type { CouncilReport } from '../../../shared/personaCouncil'
import { RiskScoreBadge } from './RiskScoreBadge'

interface ConsensusPanelProps {
  report: CouncilReport
}

export function ConsensusPanel({ report }: ConsensusPanelProps) {
  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-text-primary text-sm font-semibold">Council Consensus</h3>
        <RiskScoreBadge score={report.risk_score.overall} size="lg" />
      </div>
      <p className="text-text-secondary text-sm mb-4">{report.consensus_summary}</p>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(report.risk_score.breakdown).map(([name, score]) => (
          <div
            key={name}
            className="flex items-center justify-between bg-bg-surface-3 rounded-md px-3 py-2"
          >
            <span className="text-text-muted text-xs truncate">{name.split(' ')[0]}</span>
            <RiskScoreBadge score={score} />
          </div>
        ))}
      </div>
    </div>
  )
}
