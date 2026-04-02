import React from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import type { FederationRound } from '../../../shared/federationCore'

interface RoundStatusCardProps {
  round: FederationRound
}

export function RoundStatusCard({ round }: RoundStatusCardProps) {
  const pct =
    round.participating_peers.length > 0
      ? Math.round(
          (round.submitted_peers.length / round.participating_peers.length) * 100,
        )
      : 0
  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        {round.status === 'complete' ? (
          <CheckCircle2 size={16} aria-hidden="true" className="text-green-500" />
        ) : (
          <Loader2 size={16} aria-hidden="true" className="text-yellow-400 animate-spin" />
        )}
        <span className="text-text-primary text-sm font-medium">
          Round {round.round_id.slice(0, 8)}
        </span>
        <span className="text-text-muted text-xs ml-auto">{round.status}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 bg-bg-surface-3 rounded-full h-1.5">
          <div className="bg-accent-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-text-muted text-xs">
          {round.submitted_peers.length}/{round.participating_peers.length}
        </span>
      </div>
      {round.dp_noise_applied && (
        <p className="text-xs text-blue-400">DP noise applied (ε={1.0})</p>
      )}
      {round.aggregated_gradients && (
        <p className="text-xs text-green-500">
          Aggregated: {round.aggregated_gradients.length} gradient values
        </p>
      )}
    </div>
  )
}
