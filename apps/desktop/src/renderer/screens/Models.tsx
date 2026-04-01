import { useModelsStore, OllamaModel } from '../store/modelsStore'
import { useSystemStore } from '../store/systemStore'
import { Server, WifiOff, CheckCircle2, Zap, Trash2 } from 'lucide-react'

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
  const activeModel = useSystemStore(s => s.activeModel)
  const isActive = model.name === activeModel

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6">
        <div className="flex items-start gap-3 mb-2">
          <h2 className="text-xl font-semibold text-text-primary">{model.name}</h2>
          {isActive && (
            <CheckCircle2 size={20} className="text-green-500 mt-0.5" aria-label="Active model" />
          )}
        </div>
        <p className="text-xs text-text-muted">
          {formatSize(model.size)} · Modified {formatDate(model.modified_at)}
        </p>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-bg-surface-2 rounded-md border border-border-default px-3 py-2">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Digest</p>
          <p className="text-sm text-text-primary font-mono truncate">{model.digest.slice(0, 12)}...</p>
        </div>
        <div className="bg-bg-surface-2 rounded-md border border-border-default px-3 py-2">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Size</p>
          <p className="text-sm text-text-primary font-mono">{formatSize(model.size)}</p>
        </div>
        <div className="bg-bg-surface-2 rounded-md border border-border-default px-3 py-2">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Status</p>
          <p className="text-sm text-text-primary font-mono">{isActive ? 'Active' : 'Installed'}</p>
        </div>
        <div className="bg-bg-surface-2 rounded-md border border-border-default px-3 py-2">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Modified</p>
          <p className="text-sm text-text-primary font-mono">{formatDate(model.modified_at)}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          className="bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          onClick={() => useSystemStore.setState({ activeModel: model.name })}
          aria-label={`Set ${model.name} as active`}
        >
          <CheckCircle2 size={14} aria-hidden="true" />
          Set as Active
        </button>
        <button
          className="border border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-surface-3 text-sm font-medium px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors"
          aria-label={`Fine-tune ${model.name}`}
        >
          <Zap size={14} aria-hidden="true" />
          Fine-tune
        </button>
        <button
          className="border border-border-default text-red-400 hover:text-red-300 hover:border-red-400 text-sm font-medium px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
          aria-label={`Delete ${model.name}`}
        >
          <Trash2 size={14} aria-hidden="true" />
          Delete
        </button>
      </div>
    </div>
  )
}

export function Models() {
  const { installed, selected, setSelected } = useModelsStore()
  const activeModel = useSystemStore(s => s.activeModel)
  const ollamaOnline = useSystemStore(s => s.ollamaOnline)
  const selectedModel = installed.find(m => m.name === selected) ?? null

  return (
    <div data-testid="screen-models" className="flex h-full">
      {/* Left panel */}
      <div className="w-[200px] shrink-0 bg-bg-surface-1 border-r border-border-default overflow-y-auto flex flex-col">
        <p className="px-4 pt-4 pb-2 text-xs font-semibold text-text-secondary uppercase tracking-wide">
          Installed
        </p>
        {installed.length === 0 ? (
          <p className="px-4 py-2 text-xs text-text-muted">No models installed</p>
        ) : (
          <ul role="listbox" aria-label="Installed models">
            {installed.map(model => {
              const isSelected = model.name === selected
              const isActive = model.name === activeModel
              return (
                <li key={model.name}>
                  <button
                    role="option"
                    aria-selected={isSelected}
                    className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent-500 flex items-center gap-2 ${
                      isSelected
                        ? 'bg-accent-500/10 text-text-primary border-l-2 border-accent-500'
                        : 'text-text-secondary hover:bg-bg-surface-3'
                    }`}
                    onClick={() => setSelected(model.name)}
                  >
                    {isActive && (
                      <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" aria-hidden="true" />
                    )}
                    <span className="truncate">{model.name}</span>
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

