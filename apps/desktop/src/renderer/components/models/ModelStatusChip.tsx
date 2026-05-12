/**
 * ModelStatusChip — unified status chip for any model context.
 *
 * Renders a small inline pill showing the model's current state with a
 * coloured dot + label. Used by:
 *   - HuggingFace ModelCard footer (downloading / downloaded / error)
 *   - Installed-tab list items (ready / active)
 *   - Onboarding model phase (queued / downloading / warming)
 *
 * Pure presentational — no store access. Pass the status and an
 * optional progress percent when status === 'downloading' to get an
 * embedded "47%" suffix.
 */
import { Loader2, CheckCircle2, AlertCircle, Clock, Sparkle } from 'lucide-react'

export type ModelStatus =
  | 'ready'        // installed, not active
  | 'active'       // installed and the user's current selected model
  | 'queued'       // download queued, not yet started
  | 'downloading'  // download in progress (optional progressPct shown)
  | 'warming'      // post-download warmup inference
  | 'error'        // failed to download or load

interface ModelStatusChipProps {
  status: ModelStatus
  /** 0..100 — only used when status === 'downloading'. */
  progressPct?: number
  /** Override the default label for the status (e.g. "Queued #2"). */
  label?: string
  /** Compact mode strips the label and shows just the icon + dot. */
  compact?: boolean
}

const META: Record<
  ModelStatus,
  {
    label: string
    Icon: typeof Loader2
    iconClass: string
    pillClass: string
    spin?: boolean
  }
> = {
  ready: {
    label: 'Ready',
    Icon: CheckCircle2,
    iconClass: 'text-text-secondary',
    pillClass: 'bg-bg-surface-3 text-text-secondary border-border-default',
  },
  active: {
    label: 'Active',
    Icon: Sparkle,
    iconClass: 'text-accent-400',
    pillClass: 'bg-accent-500/15 text-accent-400 border-accent-500/40',
  },
  queued: {
    label: 'Queued',
    Icon: Clock,
    iconClass: 'text-text-muted',
    pillClass: 'bg-bg-surface-3 text-text-muted border-border-default',
  },
  downloading: {
    label: 'Downloading',
    Icon: Loader2,
    iconClass: 'text-accent-400',
    pillClass: 'bg-accent-500/10 text-accent-400 border-accent-500/30',
    spin: true,
  },
  warming: {
    label: 'Warming',
    Icon: Loader2,
    iconClass: 'text-yellow-400',
    pillClass: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    spin: true,
  },
  error: {
    label: 'Error',
    Icon: AlertCircle,
    iconClass: 'text-red-400',
    pillClass: 'bg-red-500/10 text-red-300 border-red-500/30',
  },
}

export function ModelStatusChip({ status, progressPct, label, compact = false }: ModelStatusChipProps) {
  const m = META[status]
  const text = label ?? m.label
  // When downloading and progress is known, append "47%" to the label.
  const suffix =
    status === 'downloading' && typeof progressPct === 'number'
      ? ` ${Math.max(0, Math.min(100, Math.round(progressPct)))}%`
      : ''

  return (
    <span
      role="status"
      aria-label={`${text}${suffix}`}
      data-status={status}
      className={[
        'inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md border font-medium',
        m.pillClass,
      ].join(' ')}
    >
      <m.Icon
        size={11}
        aria-hidden="true"
        className={[m.iconClass, m.spin ? 'animate-spin' : ''].join(' ')}
      />
      {!compact && (
        <span>
          {text}
          {suffix && <span className="font-mono ml-0.5">{suffix}</span>}
        </span>
      )}
    </span>
  )
}
