/**
 * ModelFilePickerDialog — lists every file in a HuggingFace repo and lets the
 * user pick which file(s) to download before committing.
 */
import { useEffect, useState } from 'react'
import { Download, FileText, Loader2, AlertCircle, X, CheckSquare, Square } from 'lucide-react'

export interface ModelFile {
  path: string
  size_bytes: number
  is_gguf: boolean
}

interface ModelFilePickerDialogProps {
  modelId: string
  /** Async callback that fetches the file list from the backend */
  onFetchFiles: (modelId: string) => Promise<ModelFile[] | null>
  /** Called when the user confirms — receives the chosen file path */
  onConfirm: (modelId: string, filePath: string) => void
  onClose: () => void
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '–'
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

/** Returns a simple color-coded badge for the file extension */
function FileTypeBadge({ path }: { path: string }) {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  const styles: Record<string, string> = {
    gguf:        'bg-violet-500/15 text-violet-300 border-violet-500/25',
    safetensors: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    bin:         'bg-amber-500/15 text-amber-300 border-amber-500/25',
    pt:          'bg-amber-500/15 text-amber-300 border-amber-500/25',
    json:        'bg-teal-500/15 text-teal-300 border-teal-500/25',
    md:          'bg-zinc-500/15 text-zinc-300 border-zinc-500/25',
  }
  const cls = styles[ext] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
  return (
    <span className={`inline-block border rounded px-1.5 py-0 text-[10px] font-mono leading-5 ${cls}`}>
      {ext || '?'}
    </span>
  )
}

export function ModelFilePickerDialog({
  modelId,
  onFetchFiles,
  onConfirm,
  onClose,
}: ModelFilePickerDialogProps) {
  const [files, setFiles] = useState<ModelFile[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [filterText, setFilterText] = useState('')

  useEffect(() => {
    setLoading(true)
    setError(null)
    onFetchFiles(modelId).then(result => {
      if (result === null) {
        setError('Could not fetch file list. Check the Model Manager service is running.')
      } else {
        setFiles(result)
        // Pre-select first GGUF file if available
        const firstGguf = result.find(f => f.is_gguf)
        if (firstGguf) setSelected(firstGguf.path)
      }
      setLoading(false)
    })
  }, [modelId, onFetchFiles])

  const displayFiles = (files ?? []).filter(f =>
    !filterText || f.path.toLowerCase().includes(filterText.toLowerCase()),
  )

  const repoName = modelId.split('/').pop() ?? modelId

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-picker-title"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-bg-surface-1 border border-border-default rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-border-default">
          <div className="min-w-0">
            <h2 id="file-picker-title" className="text-base font-semibold text-text-primary">
              Choose a file to download
            </h2>
            <p className="text-xs text-text-muted mt-0.5 truncate">{modelId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:text-text-primary transition-colors cursor-pointer flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col gap-3 p-4 overflow-hidden flex-1 min-h-0">

          {loading && (
            <div className="flex items-center gap-2 text-sm text-text-muted py-6 justify-center">
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Loading file list for <span className="font-mono text-text-secondary">{repoName}</span>…
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-md p-3 text-sm text-red-400">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
              {error}
            </div>
          )}

          {!loading && !error && files && (
            <>
              {/* Filter input */}
              <input
                type="text"
                placeholder="Filter files…"
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                className="w-full bg-bg-surface-2 border border-border-default rounded-md px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-500"
                aria-label="Filter files"
              />

              {/* File list */}
              <ul
                role="listbox"
                aria-label="Repository files"
                className="overflow-y-auto flex flex-col gap-1 flex-1 min-h-0"
              >
                {displayFiles.length === 0 ? (
                  <li className="text-sm text-text-muted py-4 text-center">No files match "{filterText}"</li>
                ) : (
                  displayFiles.map(file => (
                    <li key={file.path}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected === file.path}
                        onClick={() => setSelected(file.path)}
                        className={[
                          'w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-xs transition-colors cursor-pointer',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
                          selected === file.path
                            ? 'bg-accent-500/15 border border-accent-500/30'
                            : 'bg-bg-surface-2 border border-transparent hover:border-border-hover hover:bg-bg-surface-3',
                        ].join(' ')}
                      >
                        {selected === file.path
                          ? <CheckSquare size={13} className="text-accent-400 flex-shrink-0" aria-hidden="true" />
                          : <Square size={13} className="text-text-muted flex-shrink-0" aria-hidden="true" />
                        }
                        <FileText size={12} className="text-text-muted flex-shrink-0" aria-hidden="true" />
                        <span className="flex-1 font-mono truncate text-text-primary">{file.path}</span>
                        <FileTypeBadge path={file.path} />
                        <span className="text-text-muted flex-shrink-0 w-16 text-right">
                          {formatBytes(file.size_bytes)}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>

              <p className="text-[10px] text-text-muted">
                {files.length} file{files.length !== 1 ? 's' : ''} in repo
                {filterText ? ` · ${displayFiles.length} shown` : ''}
              </p>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        {!loading && !error && (
          <div className="flex justify-end gap-2 p-4 border-t border-border-default">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm text-text-secondary bg-bg-surface-2 border border-border-default hover:border-border-hover cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selected}
              onClick={() => { if (selected) onConfirm(modelId, selected) }}
              className={[
                'inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                selected
                  ? 'bg-accent-500 text-white hover:bg-accent-600 cursor-pointer'
                  : 'bg-accent-500/30 text-accent-400/50 cursor-not-allowed',
              ].join(' ')}
            >
              <Download size={14} aria-hidden="true" />
              Download
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
