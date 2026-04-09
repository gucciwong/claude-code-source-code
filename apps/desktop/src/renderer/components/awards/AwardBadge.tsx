import React from 'react'
import type { AwardTier } from '../../../shared/awards'

const TIER_CONFIG: Record<AwardTier, { label: string; bg: string; text: string; icon: string }> = {
  diamond:  { label: 'Diamond',  bg: 'bg-cyan-500/20',    text: 'text-cyan-300',    icon: '💎' },
  platinum: { label: 'Platinum', bg: 'bg-violet-500/20',  text: 'text-violet-300',  icon: '👑' },
  gold:     { label: 'Gold',     bg: 'bg-yellow-500/20',  text: 'text-yellow-300',  icon: '🥇' },
  silver:   { label: 'Silver',   bg: 'bg-gray-400/20',    text: 'text-gray-300',    icon: '🥈' },
  bronze:   { label: 'Bronze',   bg: 'bg-orange-500/20',  text: 'text-orange-300',  icon: '🥉' },
}

interface AwardBadgeProps {
  tier: AwardTier
  size?: 'sm' | 'md' | 'lg'
}

export function AwardBadge({ tier, size = 'md' }: AwardBadgeProps) {
  const config = TIER_CONFIG[tier]
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses[size]}`}
      aria-label={`${config.label} tier`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  )
}
