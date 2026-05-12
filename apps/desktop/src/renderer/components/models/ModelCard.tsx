import { Download, Star, TrendingUp, Cpu, AlertCircle } from 'lucide-react'
import { CompatibilityStatus } from '../../utils/modelCompatibility'
import { ModelStatusChip } from './ModelStatusChip'

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

export interface ModelCardProps {
  id: string
  name: string
  params: string
  sizeLabel?: string | null
  arch: string
  format: string
  description: string
  downloadStatus: 'idle' | 'pending' | 'downloading' | 'done' | 'error'
  /** 0..100 — shown as inline progress bar when downloadStatus === 'downloading'. */
  progressPct?: number
  onPickFiles: (id: string) => void
  stars?: number
  downloads?: number
  addedDate?: string
  compatibility?: {
    status: CompatibilityStatus
    /** Short badge text, e.g. "Fits RAM" or "Needs 9.1 GB RAM" */
    label: string
    /** Tooltip / aria-description */
    detail?: string
  }
}

export function ModelCard({
  id,
  name,
  params,
  sizeLabel,
  arch,
  format,
  description,
  downloadStatus,
  progressPct,
  onPickFiles,
  stars,
  downloads,
  compatibility,
}: ModelCardProps) {
  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4 flex flex-col gap-3">
      {/* Inline progress bar — visible only while downloading.
       *  Sits at the top of the card so it reads as a header strip.
       *  Hairline track + emerald fill, matches the onboarding model
       *  phase pattern. Indeterminate (pulsing fill) when progressPct
       *  is undefined; deterministic when provided. */}
      {downloadStatus === 'downloading' && (
        <div className="flex items-center gap-2 -mt-1">
          <div
            className="flex-1 h-1 bg-bg-surface-3 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={typeof progressPct === 'number' ? Math.round(progressPct) : undefined}
            aria-label={`Downloading ${name}`}
          >
            <div
              className={[
                'h-full bg-accent-500 transition-[width] duration-300 ease-out',
                typeof progressPct !== 'number' ? 'animate-pulse w-full' : '',
              ].join(' ')}
              style={typeof progressPct === 'number' ? { width: `${Math.max(0, Math.min(100, progressPct))}%` } : undefined}
            />
          </div>
          {typeof progressPct === 'number' && (
            <span className="text-[10px] font-mono text-text-muted tabular-nums">
              {Math.round(progressPct)}%
            </span>
          )}
        </div>
      )}
      {/* Header row: params badge, arch tag, model name */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="bg-accent-500/10 text-accent-400 text-xs px-2 py-0.5 rounded font-mono">
          {params}
        </span>
        {sizeLabel && (
          <span className="bg-bg-surface-3 text-text-secondary text-xs px-2 py-0.5 rounded font-mono">
            {sizeLabel}
          </span>
        )}
        <span className="bg-bg-surface-3 text-text-secondary text-xs px-2 py-0.5 rounded">
          {arch}
        </span>
        <span className="text-sm font-medium text-text-primary">{name}</span>
      </div>

      {/* Description */}
      <p className="text-sm text-text-secondary line-clamp-2">{description}</p>

      {/* Stats row (optional) */}
      {(stars !== undefined || downloads !== undefined) && (
        <div className="flex items-center gap-4 text-xs text-text-muted">
          {stars !== undefined && (
            <span className="flex items-center gap-1">
              <Star size={11} aria-hidden="true" />
              {formatNum(stars)}
            </span>
          )}
          {downloads !== undefined && (
            <span className="flex items-center gap-1">
              <TrendingUp size={11} aria-hidden="true" />
              {formatNum(downloads)} / mo
            </span>
          )}
        </div>
      )}

      {/* Footer row: format tag + compat badge + action button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-bg-surface-3 text-text-secondary text-xs px-2 py-0.5 rounded">
            {format}
          </span>
          {compatibility && (
            <span
              className={[
                'flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium',
                compatibility.status === 'pass'
                  ? 'bg-green-500/10 text-green-300 border-green-500/30'
                  : compatibility.status === 'warn'
                    ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
                    : compatibility.status === 'fail'
                      ? 'bg-red-500/10 text-red-300 border-red-500/30'
                      : 'bg-bg-surface-3 text-text-muted border-border-default',
              ].join(' ')}
              title={compatibility.detail}
              aria-label={`Hardware compatibility: ${compatibility.label}`}
            >
              <Cpu size={10} aria-hidden="true" />
              {compatibility.label}
            </span>
          )}
        </div>

        {/* Right side of the footer: status chip + optional action.
         *  The chip is always visible (except when idle, where the
         *  "Download" CTA is the entire affordance); actions for
         *  retry and the post-download confirmation live next to it. */}
        <div className="flex items-center gap-2">
          {downloadStatus !== 'idle' && (
            <ModelStatusChip
              status={
                downloadStatus === 'done'
                  ? 'ready'
                  : downloadStatus === 'pending'
                    ? 'queued'
                    : downloadStatus
              }
              progressPct={progressPct}
              label={
                downloadStatus === 'done'
                  ? 'Downloaded'
                  : downloadStatus === 'pending'
                    ? 'Queued'
                    : undefined
              }
            />
          )}

          {downloadStatus === 'idle' && (
            <button
              type="button"
              className="bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              onClick={() => onPickFiles(id)}
              aria-label={`Download ${name}`}
            >
              <Download size={14} aria-hidden="true" />
              Download
            </button>
          )}

          {downloadStatus === 'error' && (
            <button
              type="button"
              className="border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-3 py-2 text-sm cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              onClick={() => onPickFiles(id)}
              aria-label={`Retry downloading ${name}`}
            >
              <AlertCircle size={14} className="text-red-400" aria-hidden="true" />
              Retry
            </button>
          )}
        </div>

        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {downloadStatus === 'done' ? `${name} downloaded` : ''}
        </div>
      </div>
    </div>
  )
}
