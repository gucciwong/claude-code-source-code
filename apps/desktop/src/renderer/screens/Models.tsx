import { useEffect } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { useModelsStore, OllamaModel } from '../store/modelsStore'
import { useSystemStore } from '../store/systemStore'
import { useModelManagerStore } from '../store/modelManagerStore'
import { Server, WifiOff, CheckCircle2, Zap, Trash2 } from 'lucide-react'
import { HuggingFacePanel } from '../components/models/HuggingFacePanel'
import { OrgInsightsPanel } from '../components/models/OrgInsightsPanel'

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
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h2 
              className="text-2xl font-semibold text-text-primary break-words flex items-center gap-2 flex-wrap"
              title={model.name}
            >
              {model.name}
              {model.details?.quantization_level && (
                <span className="bg-bg-surface-3 text-text-muted text-xs px-2 py-0.5 rounded font-normal">
                  {model.details.quantization_level}
                </span>
              )}
            </h2>
          </div>
          {isActive && (
            <div className="flex-shrink-0">
              <CheckCircle2 size={24} className="text-green-500" role="img" aria-label="Active model" />
            </div>
          )}
        </div>
        <p className="text-sm text-text-muted">
          {formatSize(model.size)} • Modified {formatDate(model.modified_at)}
        </p>
      </div>

      {/* Info Grid - 4 columns */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-bg-surface-2 rounded-md border border-border-default px-3 py-3 min-h-[80px] flex flex-col">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 font-semibold">Parameters</p>
          <p className="text-xs text-text-primary font-mono">
            {model.details?.parameter_size ?? '\u2014'}
          </p>
        </div>
        <div className="bg-bg-surface-2 rounded-md border border-border-default px-3 py-3 min-h-[80px] flex flex-col">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 font-semibold">Size</p>
          <p className="text-xs text-text-primary font-mono">{formatSize(model.size)}</p>
        </div>
        <div className="bg-bg-surface-2 rounded-md border border-border-default px-3 py-3 min-h-[80px] flex flex-col">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 font-semibold">Status</p>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-yellow-500'}`} aria-hidden="true" />
            <p className="text-xs text-text-primary font-mono">{isActive ? 'Active' : 'Installed'}</p>
          </div>
        </div>
        <div className="bg-bg-surface-2 rounded-md border border-border-default px-3 py-3 min-h-[80px] flex flex-col">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 font-semibold">Modified</p>
          <p className="text-xs text-text-primary font-mono">{formatDate(model.modified_at)}</p>
        </div>
      </div>

      {/* Architecture + Format cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-bg-surface-2 rounded-md border border-border-default px-3 py-3 flex flex-col">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 font-semibold">Architecture</p>
          <p className="text-xs text-text-primary font-mono">
            {model.details?.family ?? '\u2014'}
          </p>
        </div>
        <div className="bg-bg-surface-2 rounded-md border border-border-default px-3 py-3 flex flex-col">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 font-semibold">Format</p>
          <p className="text-xs text-text-primary font-mono">
            {model.details?.format ?? '\u2014'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          className="bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          onClick={() => useSystemStore.setState({ activeModel: model.name })}
          aria-label={`Set ${model.name} as active`}
        >
          <CheckCircle2 size={14} aria-hidden="true" />
          Set as Active
        </button>
        <button
          type="button"
          disabled
          className="border border-border-default text-text-secondary text-sm font-medium px-4 py-2 rounded-md cursor-not-allowed opacity-50 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors"
          aria-label={`Fine-tune ${model.name}`}
        >
          <Zap size={14} aria-hidden="true" />
          Fine-tune
        </button>
        <button
          type="button"
          disabled
          className="border border-border-default text-red-400 text-sm font-medium px-4 py-2 rounded-md cursor-not-allowed opacity-50 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
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
  const { installed, selected, setSelected, setModelDetails } = useModelsStore()
  const activeModel = useSystemStore(s => s.activeModel)
  const ollamaOnline = useSystemStore(s => s.ollamaOnline)
  const selectedModel = installed.find(m => m.name === selected) ?? null

  useEffect(() => {
    if (!selected) return
    const controller = new AbortController()
    fetch('http://localhost:11434/api/show', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: selected }),
      signal: controller.signal,
    })
      .then(r => r.json())
      .then(data => {
        if (data?.details) {
          setModelDetails(selected, {
            parameter_size: data.details.parameter_size,
            quantization_level: data.details.quantization_level,
            family: data.details.family,
            format: data.details.format,
          })
        }
      })
      .catch(err => {
        if ((err as Error).name !== 'AbortError') {
          // Network error or Ollama not running — leave details undefined
        }
      })
    return () => controller.abort()
  }, [selected, setModelDetails])

  const lastError = useModelManagerStore(s => s.last_error)

  return (
    <div data-testid="screen-models" className="flex flex-col h-full">
      {lastError && (
        <div role="alert" className="mx-4 mt-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400 flex items-center justify-between">
          <span>{lastError}</span>
          <button
            type="button"
            className="text-red-400 hover:text-red-300 ml-2 text-xs"
            onClick={() => useModelManagerStore.setState({ last_error: null })}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}
      <Tabs.Root defaultValue="installed" className="flex flex-col h-full">
        {/* Tab bar */}
        <Tabs.List
          className="flex shrink-0 border-b border-border-default bg-bg-surface-1 px-4 gap-1"
          aria-label="Models navigation"
        >
          <Tabs.Trigger
            value="installed"
            className="px-4 py-2.5 text-sm font-medium text-text-secondary cursor-pointer border-b-2 border-transparent data-[state=active]:border-accent-500 data-[state=active]:text-text-primary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors -mb-px"
          >
            Installed ({installed.length})
          </Tabs.Trigger>
          <Tabs.Trigger
            value="download"
            className="px-4 py-2.5 text-sm font-medium text-text-secondary cursor-pointer border-b-2 border-transparent data-[state=active]:border-accent-500 data-[state=active]:text-text-primary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors -mb-px"
          >
            Download from HuggingFace
          </Tabs.Trigger>
          <Tabs.Trigger
            value="org"
            className="px-4 py-2.5 text-sm font-medium text-text-secondary cursor-pointer border-b-2 border-transparent data-[state=active]:border-accent-500 data-[state=active]:text-text-primary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors -mb-px"
          >
            Org Insights
          </Tabs.Trigger>
        </Tabs.List>

        {/* Installed tab */}
        <Tabs.Content value="installed" className="flex flex-1 overflow-hidden">
          {/* Left panel */}
          <div className="w-[200px] shrink-0 bg-bg-surface-1 border-r border-border-default overflow-y-auto flex flex-col">
            <p className="px-4 pt-4 pb-2 text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Installed
            </p>
            {installed.length === 0 ? (
              <p className="px-4 py-2 text-xs text-text-muted">No models installed</p>
            ) : (
              <ul role="list" aria-label="Installed models">
                {installed.map(model => {
                  const isSelected = model.name === selected
                  const isActive = model.name === activeModel
                  return (
                    <li key={model.name}>
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        aria-label={isActive ? `${model.name} (active)` : model.name}
                        title={model.name}
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
                        <span className="truncate flex-1" title={model.name}>{model.name}</span>
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
        </Tabs.Content>

        {/* Download from HuggingFace tab */}
        <Tabs.Content value="download" className="flex-1 overflow-auto bg-bg-base">
          <HuggingFacePanel />
        </Tabs.Content>

        {/* Org Insights tab */}
        <Tabs.Content value="org" className="flex-1 overflow-auto bg-bg-base">
          <OrgInsightsPanel />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}

