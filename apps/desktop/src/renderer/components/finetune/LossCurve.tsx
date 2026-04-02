import React from 'react'

interface LossCurveProps {
  losses: number[]
  width?: number
  height?: number
}

export function LossCurve({ losses, width = 300, height = 80 }: LossCurveProps) {
  if (losses.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-text-muted text-xs">
        No loss data yet
      </div>
    )
  }

  const max = Math.max(...losses)
  const min = Math.min(...losses)
  const range = max - min || 1
  const pad = 8
  const w = width - pad * 2
  const h = height - pad * 2

  const points = losses
    .map((l, i) => {
      const x = pad + (i / Math.max(losses.length - 1, 1)) * w
      const y = pad + (1 - (l - min) / range) * h
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label={`Loss curve: ${losses.length} data points, current loss ${losses[losses.length - 1]?.toFixed(3)}`}
      className="w-full"
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="text-accent-400"
      />
      {losses.map((l, i) => {
        const x = pad + (i / Math.max(losses.length - 1, 1)) * w
        const y = pad + (1 - (l - min) / range) * h
        return <circle key={i} cx={x} cy={y} r={3} className="fill-accent-500" />
      })}
    </svg>
  )
}
