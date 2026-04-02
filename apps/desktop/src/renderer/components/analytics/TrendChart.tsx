import React from 'react'
import type { QualityTrend } from '../../../shared/analytics'

interface TrendChartProps {
  trends: QualityTrend[]
}

export function TrendChart({ trends }: TrendChartProps) {
  if (trends.length === 0 || trends.every(t => t.avg_quality_score === 0)) {
    return (
      <div className="h-32 flex items-center justify-center bg-bg-surface-2 border border-border-default rounded-lg">
        <p className="text-text-muted text-sm">No quality data yet</p>
      </div>
    )
  }
  const max = Math.max(...trends.map(t => t.avg_quality_score), 1)
  const width = 600
  const height = 120
  const padding = 20
  const plotWidth = width - padding * 2
  const plotHeight = height - padding * 2
  const points = trends.map((t, i) => {
    const x = padding + (i / Math.max(trends.length - 1, 1)) * plotWidth
    const y = padding + plotHeight - (t.avg_quality_score / max) * plotHeight
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4">
      <h3 className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-3">Quality Score Trend</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" aria-label="Quality trend chart" role="img">
        <polyline points={points} fill="none" stroke="#8B5CF6" strokeWidth="2" />
        {trends.map((t, i) => {
          const x = padding + (i / Math.max(trends.length - 1, 1)) * plotWidth
          const y = padding + plotHeight - (t.avg_quality_score / max) * plotHeight
          return <circle key={i} cx={x} cy={y} r="3" fill="#8B5CF6" />
        })}
      </svg>
      <div className="flex justify-between mt-2">
        <span className="text-text-muted text-xs">{trends[0]?.date_label}</span>
        <span className="text-text-muted text-xs">{trends[trends.length - 1]?.date_label}</span>
      </div>
    </div>
  )
}
