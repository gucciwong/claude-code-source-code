import { useModelsStore, OllamaModel } from '../store/modelsStore'
import { useSystemStore } from '../store/systemStore'
import { Server, WifiOff } from 'lucide-react'

function formatSize(bytes: number): string {
  return (bytes / 1e9).toFixed(1) + ' GB'
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString()
  } catch {
    return dateStr
  }
}

function EmptySelection() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <Server size={48} className="text-text-muted" aria-hidden="true" />
      <h2 className="text-lg font-semibold text-text-primary">Select a model</h2>
      <p className="text-sm text-text-muted">Choose a model from the list to view details</p>
    </div>
  )
}

function ModelDetail({ model }: { model: OllamaModel }) {
  const setActiveModel = () => useSystemStore.setState({ activeModel: model.name })

  return (
    <div className="p-6">
      <div className="bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4 max-w-2xl">
        <h2 className="text-xl font-semibold text-text-primary">{model.name}</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-text-muted w-24 shrink-0">Size</dt>
            <dd className="text-text-primary">{formatSize(model.size)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-text-muted w-24 shrink-0">Modified</dt>
            <dd className="text-text-primary">{formatDate(model.modified_at)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-text-muted w-24 shrink-0">Digest</dt>
            <dd className="text-text-primary font-mono text-xs truncate">{model.digest.slice(0, 12)}</dd>
          </div>
        </dl>
        <button
          className="bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          onClick={setActiveModel}
        >
          Load Model
        </button>
      </div>
    </div>
  )
}

export function Models() {
  const { installed, selected, setSelected } = useModelsStore()
  const ollamaOnline = useSystemStore(s => s.ollamaOnline)
  const selectedModel = installed.find(m => m.name === selected) ?? null

  return (
    <div data-testid="screen-models" className="flex h-full">
      {/* Left panel */}
      <div className="w-[200px] shrink-0 bg-bg-surface-1 border-r border-border-default overflow-y-auto flex flex-col">
        <p className="px-4 pt-4 pb-2 text-xs font-semibold text-text-secondary uppercase tracking-wide">
          Installed Models
        </p>
        {installed.length === 0 ? (
          <p className="px-4 py-2 text-xs text-text-muted">No models installed</p>
        ) : (
          <ul role="listbox" aria-label="Installed models">
            {installed.map(model => {
              const isSelected = model.name === selected
              return (
                <li key={model.name}>
                  <button
                    role="option"
                    aria-selected={isSelected}
                    className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500 ${
                      isSelected
                        ? 'bg-accent-500/10 text-text-primary border-l-2 border-accent-500'
                        : 'text-text-secondary hover:bg-bg-surface-3'
                    }`}
                    onClick={() => setSelected(model.name)}
                  >
                    {model.name}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {!ollamaOnline && (
          <div className="px-4 py-2 text-xs text-text-muted flex items-center gap-1.5">
            <WifiOff size={12} aria-hidden="true" />
            Ollama offline
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="flex-1 bg-bg-base overflow-auto">
        {selectedModel ? <ModelDetail model={selectedModel} /> : <EmptySelection />}
      </div>
    </div>
  )
}

