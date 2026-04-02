import React from 'react'

interface RiskScoreBadgeProps {
  score: number
  size?: 'sm' | 'lg'
}

function getRiskColor(score: number): string {
  if (score >= 7) return 'text-red-400 bg-red-500/10 border-red-500/30'
  if (score >= 4) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
  if (score > 0) return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  return 'text-green-400 bg-green-500/10 border-green-500/30'
}

export function RiskScoreBadge({ score, size = 'sm' }: RiskScoreBadgeProps) {
  const color = getRiskColor(score)
  const label = score >= 7 ? 'High' : score >= 4 ? 'Medium' : score > 0 ? 'Low' : 'Clean'
  return (
    <span
      className={`inline-flex items-center gap-1 border rounded-full font-medium ${color} ${size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'}`}
    >
      {score.toFixed(1)} · {label}
    </span>
  )
}
