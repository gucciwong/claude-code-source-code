import React from 'react'
import { CheckCircle2, XCircle, Trash2, Settings } from 'lucide-react'
import type { PlatformStatus } from '../../../shared/messaging'
import { IM_PLATFORM_LABELS } from '../../../shared/messaging'

interface PlatformCardProps {
  platform: PlatformStatus
  onRemove: (platform: string) => void
  onConfigure: (platform: string) => void
}

export function PlatformCard({ platform, onRemove, onConfigure }: PlatformCardProps) {
  const label =
    IM_PLATFORM_LABELS[platform.platform as keyof typeof IM_PLATFORM_LABELS] ?? platform.platform
  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {platform.connected ? (
          <CheckCircle2 size={16} aria-hidden="true" className="text-green-500" />
        ) : (
          <XCircle size={16} aria-hidden="true" className="text-text-muted" />
        )}
        <div>
          <p className="text-text-primary text-sm font-medium">{label}</p>
          <p className="text-text-muted text-xs">
            {platform.connected ? 'Connected' : 'Not configured'}
            {platform.allowed_user_ids.length > 0 &&
              ` · ${platform.allowed_user_ids.length} authorized user(s)`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onConfigure(platform.platform)}
          className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-surface-3 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          aria-label={`Configure ${label}`}
        >
          <Settings size={14} aria-hidden="true" />
        </button>
        <button
          onClick={() => onRemove(platform.platform)}
          className="p-2 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          aria-label={`Remove ${label}`}
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
