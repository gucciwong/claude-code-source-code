import { Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export interface ModelCardProps {
  id: string
  name: string
  params: string
  arch: string
  format: string
  description: string
  downloadStatus: 'idle' | 'downloading' | 'done' | 'error'
  onDownload: (id: string) => void
}

export function ModelCard({
  id,
  name,
  params,
  arch,
  format,
  description,
  downloadStatus,
  onDownload,
}: ModelCardProps) {
  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4 flex flex-col gap-3">
      {/* Header row: params badge, arch tag, model name */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="bg-accent-500/10 text-accent-400 text-xs px-2 py-0.5 rounded font-mono">
          {params}
        </span>
        <span className="bg-bg-surface-3 text-text-secondary text-xs px-2 py-0.5 rounded">
          {arch}
        </span>
        <span className="text-sm font-medium text-text-primary">{name}</span>
      </div>

      {/* Description */}
      <p className="text-sm text-text-secondary line-clamp-2">{description}</p>

      {/* Footer row: format tag + action button */}
      <div className="flex items-center justify-between gap-2">
        <span className="bg-bg-surface-3 text-text-secondary text-xs px-2 py-0.5 rounded">
          {format}
        </span>

        {downloadStatus === 'idle' && (
          <button
            type="button"
            className="bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            onClick={() => onDownload(id)}
            aria-label={`Download ${name}`}
          >
            <Download size={14} aria-hidden="true" />
            Download
          </button>
        )}

        {downloadStatus === 'downloading' && (
          <button
            type="button"
            className="border border-border-default text-text-secondary rounded-md px-3 py-2 text-sm flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 cursor-not-allowed opacity-70"
            disabled
            aria-label={`Downloading ${name}`}
          >
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            Downloading…
          </button>
        )}

        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {downloadStatus === 'done' ? `${name} downloaded` : ''}
        </div>
        {downloadStatus === 'done' && (
          <div className="border border-border-default text-text-secondary rounded-md px-3 py-2 text-sm flex items-center gap-2">
            <CheckCircle2 size={14} className="text-green-400" aria-hidden="true" />
            Downloaded
          </div>
        )}

        {downloadStatus === 'error' && (
          <button
            type="button"
            className="border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-3 py-2 text-sm cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            onClick={() => onDownload(id)}
            aria-label={`Retry downloading ${name}`}
          >
            <AlertCircle size={14} className="text-red-400" aria-hidden="true" />
            Retry
          </button>
        )}
      </div>
    </div>
  )
}
