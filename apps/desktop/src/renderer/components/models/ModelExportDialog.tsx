import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useModelManagerStore } from '../../store/modelManagerStore'
import { ModelMetadata } from '../../services/modelManagerAPI'

export function ModelExportDialog({
  model,
  open,
  onOpenChange,
}: {
  model: ModelMetadata | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { exportModel, downloadModel, isLoading, error, exportProgress } = useModelManagerStore()
  const [format, setFormat] = useState<'gguf' | 'safetensors' | 'huggingface'>('gguf')
  const [exported, setExported] = useState(false)

  if (!model) return null

  const handleExport = async () => {
    if (!model) return
    try {
      await exportModel(model.name)
      setExported(true)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const handleDownload = async () => {
    if (!model) return
    try {
      // Construct filename based on model name and format
      const fileName = `${model.name}.${format === 'gguf' ? 'gguf' : format === 'safetensors' ? 'safetensors' : 'zip'}`
      await downloadModel(model.name, fileName)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-bg-surface-1 border border-border-default rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold text-text-primary">Export Model</Dialog.Title>
            <Dialog.Close className="p-1 hover:bg-bg-surface-2 rounded">
              <X size={20} className="text-text-muted" />
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            {/* Model Info */}
            <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4">
              <p className="text-sm font-medium text-text-primary mb-1">{model.name}</p>
              <p className="text-xs text-text-muted">{(model.size_gb || 0).toFixed(1)} GB • {model.status}</p>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Export Format</label>
              <div className="grid grid-cols-3 gap-2">
                {(['gguf', 'safetensors', 'huggingface'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`px-3 py-2 rounded text-sm font-medium transition ${
                      format === fmt
                        ? 'bg-accent-500 text-white'
                        : 'bg-bg-surface-2 border border-border-default text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Progress */}
            {exportProgress > 0 && exportProgress < 100 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Exporting</span>
                  <span>{exportProgress}%</span>
                </div>
                <div className="w-full h-2 bg-bg-surface-3 rounded overflow-hidden">
                  <div
                    className="h-full bg-accent-500 transition-all"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Success State */}
            {exported && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex gap-2">
                <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-600">Export complete!</p>
                  <p className="text-xs text-green-600/80">Ready to download</p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-2">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {!exported ? (
                <>
                  <Dialog.Close className="flex-1 px-4 py-2 bg-bg-surface-2 border border-border-default hover:bg-bg-surface-3 text-text-primary rounded font-medium transition">
                    Cancel
                  </Dialog.Close>
                  <button
                    onClick={handleExport}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-accent-500 hover:bg-accent-600 disabled:bg-text-muted text-white rounded font-medium transition flex items-center justify-center gap-2"
                  >
                    {isLoading && <Loader2 size={16} className="animate-spin" />}
                    {isLoading ? 'Exporting...' : 'Export'}
                  </button>
                </>
              ) : (
                <>
                  <Dialog.Close className="flex-1 px-4 py-2 bg-bg-surface-2 border border-border-default hover:bg-bg-surface-3 text-text-primary rounded font-medium transition">
                    Close
                  </Dialog.Close>
                  <button
                    onClick={handleDownload}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-accent-500 hover:bg-accent-600 disabled:bg-text-muted text-white rounded font-medium transition flex items-center justify-center gap-2"
                  >
                    {isLoading && <Loader2 size={16} className="animate-spin" />}
                    {isLoading ? 'Downloading...' : (
                      <>
                        <Download size={16} />
                        Download
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
