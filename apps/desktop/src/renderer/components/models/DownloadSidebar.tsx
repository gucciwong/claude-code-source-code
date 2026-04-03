import { X, Download, AlertCircle } from 'lucide-react'
import { DownloadQueueEntry } from '../../hooks/useModelManager'

export interface DownloadSidebarProps {
  downloads: Record<string, DownloadQueueEntry>
  onCancel: (modelId: string) => void
}

function formatGb(gb: number): string {
  if (gb === 0) return '0 GB'
  return `${gb.toFixed(1)} GB`
}

function formatEta(startedAt: number, progress: number): string {
  if (progress <= 0) return '—'
  if (progress >= 100) return 'Done'
  const elapsedMs = Date.now() - startedAt * 1000
  if (elapsedMs < 800) return '—'
  const ratePerMs = progress / elapsedMs
  const remainingPct = 100 - progress
  const etaMs = remainingPct / ratePerMs
  const s = Math.round(etaMs / 1000)
  if (s < 60) return `~${s}s left`
  const m = Math.round(s / 60)
  return `~${m}m left`
}

export function DownloadSidebar({ downloads, onCancel }: DownloadSidebarProps) {
  const allEntries = Object.entries(downloads)
  const activeEntries = allEntries.filter(
    ([, d]) => d.status === 'pending' || d.status === 'downloading'
  )
  const errorEntries = allEntries.filter(([, d]) => d.status === 'error')

  if (activeEntries.length === 0 && errorEntries.length === 0) return null

  const totalGb = activeEntries.reduce((sum, [, d]) => sum + (d.total_size_gb ?? 0), 0)
  const avgProgress =
    activeEntries.length > 0
      ? activeEntries.reduce((sum, [, d]) => sum + (d.progress ?? 0), 0) / activeEntries.length
      : 0

  return (
    <aside
      aria-label="Download progress"
      className="w-[280px] flex-shrink-0 border-l border-border-subtle bg-bg-surface-1 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-2 flex-shrink-0">
        <Download size={14} className="text-accent-400" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-text-primary">
          Downloads ({activeEntries.length}{errorEntries.length > 0 ? ` · ${errorEntries.length} failed` : ''})
        </h3>
      </div>

      {/* Per-download list */}
      <ul
        role="list"
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: 'thin' }}
      >
        {activeEntries.map(([modelId, info]) => {
          const modelName = info.model_name || modelId.split('/').pop() || modelId
          const progress = info.progress ?? 0
          const totalSize = info.total_size_gb ?? 0
          const downloadedGb = info.downloaded_gb ?? (totalSize * progress) / 100

          return (
            <li
              key={modelId}
              className="px-4 py-3 border-b border-border-subtle last:border-b-0 flex flex-col gap-2"
            >
              {/* Name + cancel */}
              <div className="flex items-start justify-between gap-2">
                <span
                  className="text-sm font-medium text-text-primary leading-snug min-w-0 truncate flex-1"
                  title={modelId}
                >
                  {modelName}
                </span>
                <button
                  type="button"
                  onClick={() => onCancel(modelId)}
                  className="text-text-muted hover:text-red-400 cursor-pointer flex-shrink-0 mt-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500"
                  aria-label={`Cancel download of ${modelName}`}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>

              {/* Progress bar */}
              <div
                className="h-1.5 bg-bg-surface-3 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${modelName} download progress`}
              >
                <div
                  className="h-full bg-accent-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Stats: percent · downloaded/total   ETA */}
              <div className="flex items-center justify-between gap-2 text-xs text-text-muted">
                <span>
                  {Math.round(progress)}%
                  {totalSize > 0 && (
                    <span className="text-text-muted/70">
                      {' '}· {formatGb(downloadedGb)} / {formatGb(totalSize)}
                    </span>
                  )}
                </span>
                <span className="flex-shrink-0">{formatEta(info.started_at, progress)}</span>
              </div>
            </li>
          )
        })}

        {/* Error entries */}
        {errorEntries.map(([modelId, info]) => {
          const modelName = info.model_name || modelId.split('/').pop() || modelId

          return (
            <li
              key={modelId}
              className="px-4 py-3 border-b border-border-subtle last:border-b-0 flex flex-col gap-2 bg-red-500/5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <AlertCircle size={13} className="text-red-400 flex-shrink-0" aria-hidden="true" />
                  <span
                    className="text-sm font-medium text-text-primary leading-snug truncate"
                    title={modelId}
                  >
                    {modelName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onCancel(modelId)}
                  className="text-text-muted hover:text-red-400 cursor-pointer flex-shrink-0 mt-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500"
                  aria-label={`Dismiss failed download of ${modelName}`}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
              <p className="text-xs text-red-400">
                {info.error ?? 'Download failed'}
              </p>
            </li>
          )
        })}
      </ul>

      {/* Summary footer — only shown when there are active downloads */}
      {activeEntries.length > 0 && (
      <div className="px-4 py-3 border-t border-border-subtle flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
          <span>Total: {formatGb(totalGb)}</span>
          <span>{Math.round(avgProgress)}% done</span>
        </div>
        {/* Overall progress bar */}
        <div
          className="h-1 bg-bg-surface-3 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(avgProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall download progress"
        >
          <div
            className="h-full bg-accent-400 rounded-full transition-all duration-500"
            style={{ width: `${avgProgress}%` }}
          />
        </div>
      </div>
      )}
    </aside>
  )
}
