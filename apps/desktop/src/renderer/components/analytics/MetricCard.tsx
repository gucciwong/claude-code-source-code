import React from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  subtext?: string
  accent?: boolean
}

export function MetricCard({ label, value, subtext, accent }: MetricCardProps) {
  return (
    <div className={`bg-bg-surface-2 border rounded-lg p-5 ${accent ? 'border-accent-500/40' : 'border-border-default'}`}>
      <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-accent-400' : 'text-text-primary'}`}>{value}</p>
      {subtext && <p className="text-text-secondary text-xs mt-1">{subtext}</p>}
    </div>
  )
}
