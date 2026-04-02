import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, WifiOff } from 'lucide-react'
import { ModelCard } from './ModelCard'
import { useModelManager, ModelInfo } from '../../hooks/useModelManager'

type DownloadStatus = 'idle' | 'downloading' | 'done' | 'error'

interface StaffPick {
  id: string
  name: string
  params: string
  arch: string
  format: string
  description: string
}

const STAFF_PICKS: StaffPick[] = [
  {
    id: 'meta-llama/Llama-3.1-8B-Instruct',
    name: 'Llama 3.1 8B Instruct',
    params: '8B',
    arch: 'llama',
    format: 'GGUF',
    description: "Meta's latest instruction-tuned Llama model, excellent for coding and chat",
  },
  {
    id: 'mistralai/Mistral-7B-Instruct-v0.3',
    name: 'Mistral 7B Instruct v0.3',
    params: '7B',
    arch: 'mistral',
    format: 'GGUF',
    description: 'Fast and capable instruction model from Mistral AI',
  },
  {
    id: 'Qwen/Qwen2.5-Coder-7B-Instruct',
    name: 'Qwen 2.5 Coder 7B',
    params: '7B',
    arch: 'qwen2',
    format: 'GGUF',
    description: 'Specialized coding model with strong code generation',
  },
  {
    id: 'microsoft/Phi-3.5-mini-instruct',
    name: 'Phi-3.5 Mini Instruct',
    params: '3.8B',
    arch: 'phi3',
    format: 'GGUF',
    description: "Microsoft's compact model with surprisingly strong reasoning",
  },
  {
    id: 'google/gemma-2-9b-it',
    name: 'Gemma 2 9B Instruct',
    params: '9B',
    arch: 'gemma2',
    format: 'GGUF',
    description: "Google's latest efficient instruction model",
  },
  {
    id: 'deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct',
    name: 'DeepSeek Coder V2 Lite',
    params: '16B',
    arch: 'deepseek',
    format: 'GGUF',
    description: 'Powerful coding model with strong algorithmic reasoning',
  },
  {
    id: 'NousResearch/Hermes-3-Llama-3.1-8B',
    name: 'Hermes 3 Llama 3.1 8B',
    params: '8B',
    arch: 'llama',
    format: 'GGUF',
    description: 'Fine-tuned for function calling and agentic tasks',
  },
  {
    id: 'codellama/CodeLlama-13b-Instruct-hf',
    name: 'Code Llama 13B Instruct',
    params: '13B',
    arch: 'llama',
    format: 'GGUF',
    description: "Meta's specialized code generation model",
  },
]

export function HuggingFacePanel() {
  const { checkHealth, listModels, downloadModel } = useModelManager()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [downloadStatuses, setDownloadStatuses] = useState<Map<string, DownloadStatus>>(new Map())
  const [isOffline, setIsOffline] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Check service health on mount
  useEffect(() => {
    checkHealth().then(result => {
      setIsOffline(result === null)
    })
  }, [checkHealth])

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  // Poll listModels every 3 seconds while panel is mounted
  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await listModels()
      if (!result) return
      setDownloadStatuses(prev => {
        const next = new Map(prev)
        result.cached_models.forEach((m: ModelInfo) => {
          if (prev.get(m.id) === 'downloading' && m.cached) {
            next.set(m.id, 'done')
          }
        })
        return next
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [listModels])

  const handleDownload = useCallback(
    async (modelId: string) => {
      setDownloadStatuses(prev => new Map(prev).set(modelId, 'downloading'))
      const result = await downloadModel(modelId)
      if (!result) {
        setDownloadStatuses(prev => new Map(prev).set(modelId, 'error'))
      }
    },
    [downloadModel]
  )

  const showSearchResults = debouncedQuery.trim().length > 0
  const displayedModels = showSearchResults
    ? STAFF_PICKS.filter(
        m =>
          m.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          m.id.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          m.arch.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : STAFF_PICKS

  // Active downloads (downloading status in local map)
  const activeDownloads = Array.from(downloadStatuses.entries()).filter(([, s]) => s === 'downloading')

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Download from HuggingFace</h2>
        <p className="text-sm text-text-secondary mt-1">
          Models are downloaded via the local Model Manager service
        </p>
      </div>

      {/* Offline warning */}
      {isOffline && (
        <div
          role="alert"
          className="bg-yellow-400/10 border border-yellow-400/30 rounded-md px-4 py-3 flex items-center gap-3"
        >
          <WifiOff size={16} className="text-yellow-400 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm text-yellow-400">
            Model Manager service is offline (port 8002). Start it to enable HuggingFace downloads.
          </p>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Search HuggingFace models (e.g. mistral, llama, gemma)..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-bg-surface-2 border border-border-default rounded-md pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
          aria-label="Search HuggingFace models"
        />
      </div>

      {/* Active downloads section */}
      {activeDownloads.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Active Downloads
          </h3>
          <ul className="flex flex-col gap-2">
            {activeDownloads.map(([modelId]) => {
              const model = STAFF_PICKS.find(m => m.id === modelId)
              return (
                <li
                  key={modelId}
                  className="text-sm text-text-secondary flex items-center gap-2 bg-bg-surface-2 border border-border-default rounded-md px-4 py-2"
                >
                  <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse flex-shrink-0" aria-hidden="true" />
                  {model ? model.name : modelId} — downloading
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Staff Picks / Search results */}
      <div>
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
          {showSearchResults ? 'Search results' : 'Staff Picks'}
        </h3>
        {displayedModels.length === 0 ? (
          <p className="text-sm text-text-muted">No models found for &ldquo;{debouncedQuery}&rdquo;</p>
        ) : (
          <div className="flex flex-col gap-3">
            {displayedModels.map(model => (
              <ModelCard
                key={model.id}
                {...model}
                downloadStatus={downloadStatuses.get(model.id) ?? 'idle'}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
