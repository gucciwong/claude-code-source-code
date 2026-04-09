import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { Upload, X, Loader2, AlertCircle } from 'lucide-react'
import { useModelManagerStore } from '../../store/modelManagerStore'

export function ModelUploadDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { uploadModel, importGGUF, importFromHuggingFace, isLoading, error, uploadProgress } = useModelManagerStore()
  const [file, setFile] = useState<File | null>(null)
  const [modelName, setModelName] = useState('')
  const [huggingFaceRepo, setHuggingFaceRepo] = useState('')
  const [tab, setTab] = useState('upload')

  const handleUpload = async () => {
    if (!file || !modelName) return
    try {
      await uploadModel(file, modelName)
      setFile(null)
      setModelName('')
      onOpenChange(false)
    } catch (err) {
      console.error('Upload failed:', err)
    }
  }

  const handleImportGGUF = async () => {
    try {
      await importGGUF({ auto_find: true })
      onOpenChange(false)
    } catch (err) {
      console.error('Import failed:', err)
    }
  }

  const handleImportHuggingFace = async () => {
    if (!huggingFaceRepo) return
    try {
      await importFromHuggingFace(huggingFaceRepo)
      setHuggingFaceRepo('')
      onOpenChange(false)
    } catch (err) {
      console.error('Import failed:', err)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-bg-surface-1 border border-border-default rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold text-text-primary">Import Model</Dialog.Title>
            <Dialog.Close className="p-1 hover:bg-bg-surface-2 rounded">
              <X size={20} className="text-text-muted" />
            </Dialog.Close>
          </div>

          <Tabs.Root value={tab} onValueChange={setTab} className="space-y-4">
            <Tabs.List className="grid w-full grid-cols-3 gap-1 bg-bg-surface-2 rounded p-1">
              <Tabs.Trigger
                value="upload"
                className="px-3 py-2 rounded text-sm font-medium data-[state=active]:bg-bg-surface-3 data-[state=active]:text-text-primary text-text-muted hover:text-text-primary transition"
              >
                Upload
              </Tabs.Trigger>
              <Tabs.Trigger
                value="gguf"
                className="px-3 py-2 rounded text-sm font-medium data-[state=active]:bg-bg-surface-3 data-[state=active]:text-text-primary text-text-muted hover:text-text-primary transition"
              >
                Import GGUF
              </Tabs.Trigger>
              <Tabs.Trigger
                value="huggingface"
                className="px-3 py-2 rounded text-sm font-medium data-[state=active]:bg-bg-surface-3 data-[state=active]:text-text-primary text-text-muted hover:text-text-primary transition"
              >
                HuggingFace
              </Tabs.Trigger>
            </Tabs.List>

            {/* Upload Tab */}
            <Tabs.Content value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-border-default rounded-lg p-8 text-center hover:border-accent-500 transition cursor-pointer">
                <label className="cursor-pointer block">
                  <Upload size={32} className="mx-auto mb-2 text-text-muted" />
                  <span className="text-sm text-text-muted">Drop file or click to upload</span>
                  <input
                    type="file"
                    accept=".gguf,.safetensors,.bin"
                    className="hidden"
                    onChange={(e) => setFile(e.currentTarget.files?.[0] || null)}
                  />
                </label>
              </div>

              {file && (
                <div className="bg-bg-surface-2 rounded p-3">
                  <p className="text-sm font-medium text-text-primary mb-2">{file.name}</p>
                  <p className="text-xs text-text-muted mb-3">{(file.size / 1e9).toFixed(1)} GB</p>
                  <input
                    type="text"
                    placeholder="Model name (e.g., my-qwen-7b)"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-surface-3 border border-border-default rounded text-sm text-text-primary placeholder-text-muted"
                  />
                </div>
              )}

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-text-muted">
                    <span>Uploading</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-bg-surface-3 rounded overflow-hidden">
                    <div
                      className="h-full bg-accent-500 transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || !modelName || isLoading}
                className="w-full px-4 py-2 bg-accent-500 hover:bg-accent-600 disabled:bg-text-muted text-white rounded font-medium transition flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                {isLoading ? 'Uploading...' : 'Upload'}
              </button>
            </Tabs.Content>

            {/* Import GGUF Tab */}
            <Tabs.Content value="gguf" className="space-y-4">
              <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4">
                <p className="text-sm text-text-secondary mb-4">
                  Automatically finds and imports GGUF files from your system. Checks common locations like ~/Desktop, ~/Downloads, ~/.cache/huggingface, etc.
                </p>
                <button
                  onClick={handleImportGGUF}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-accent-500 hover:bg-accent-600 disabled:bg-text-muted text-white rounded font-medium transition flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  {isLoading ? 'Importing...' : 'Auto-Find & Import'}
                </button>
              </div>
            </Tabs.Content>

            {/* HuggingFace Tab */}
            <Tabs.Content value="huggingface" className="space-y-4">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="e.g., Qwen/Qwen-7B-Chat-GGUF"
                  value={huggingFaceRepo}
                  onChange={(e) => setHuggingFaceRepo(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-surface-2 border border-border-default rounded text-sm text-text-primary placeholder-text-muted"
                />
                <button
                  onClick={handleImportHuggingFace}
                  disabled={!huggingFaceRepo || isLoading}
                  className="w-full px-4 py-2 bg-accent-500 hover:bg-accent-600 disabled:bg-text-muted text-white rounded font-medium transition flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  {isLoading ? 'Downloading...' : 'Download from HF'}
                </button>
              </div>
            </Tabs.Content>
          </Tabs.Root>

          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded p-3 flex gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
