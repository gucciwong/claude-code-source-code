import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, WifiOff, Clock, Star, TrendingUp, Loader2 } from 'lucide-react'
import { ModelCard } from './ModelCard'
import { DownloadSidebar } from './DownloadSidebar'
import { useModelManager, ModelInfo, SearchResult, DownloadQueueEntry } from '../../hooks/useModelManager'

type DownloadStatus = 'idle' | 'pending' | 'downloading' | 'done' | 'error'
type SortOrder = 'newest' | 'stars' | 'downloads'

interface HFModel {
  id: string
  name: string
  params: string
  arch: string
  format: string
  description: string
  stars: number
  downloads: number
  addedDate: string
}

const SORT_OPTIONS: { value: SortOrder; label: string; icon: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' }> }[] = [
  { value: 'newest', label: 'Newest', icon: Clock },
  { value: 'stars', label: 'Stars', icon: Star },
  { value: 'downloads', label: 'Downloads', icon: TrendingUp },
]

const STAFF_PICKS: HFModel[] = [
  {
    id: 'meta-llama/Llama-3.1-8B-Instruct',
    name: 'Llama 3.1 8B Instruct',
    params: '8B',
    arch: 'llama',
    format: 'GGUF',
    description: "Meta's latest instruction-tuned Llama model, excellent for coding and chat",
    stars: 25400,
    downloads: 15200000,
    addedDate: '2024-07-15',
  },
  {
    id: 'mistralai/Mistral-7B-Instruct-v0.3',
    name: 'Mistral 7B Instruct v0.3',
    params: '7B',
    arch: 'mistral',
    format: 'GGUF',
    description: 'Fast and capable instruction model from Mistral AI',
    stars: 8200,
    downloads: 12000000,
    addedDate: '2024-05-22',
  },
  {
    id: 'Qwen/Qwen2.5-Coder-7B-Instruct',
    name: 'Qwen 2.5 Coder 7B',
    params: '7B',
    arch: 'qwen2',
    format: 'GGUF',
    description: 'Specialized coding model with strong code generation',
    stars: 6400,
    downloads: 4200000,
    addedDate: '2024-09-19',
  },
  {
    id: 'microsoft/Phi-3.5-mini-instruct',
    name: 'Phi-3.5 Mini Instruct',
    params: '3.8B',
    arch: 'phi3',
    format: 'GGUF',
    description: "Microsoft's compact model with surprisingly strong reasoning",
    stars: 4100,
    downloads: 3100000,
    addedDate: '2024-08-20',
  },
  {
    id: 'google/gemma-2-9b-it',
    name: 'Gemma 2 9B Instruct',
    params: '9B',
    arch: 'gemma2',
    format: 'GGUF',
    description: "Google's latest efficient instruction model",
    stars: 3500,
    downloads: 2100000,
    addedDate: '2024-07-25',
  },
  {
    id: 'deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct',
    name: 'DeepSeek Coder V2 Lite',
    params: '16B',
    arch: 'deepseek',
    format: 'GGUF',
    description: 'Powerful coding model with strong algorithmic reasoning',
    stars: 3200,
    downloads: 1500000,
    addedDate: '2024-06-14',
  },
  {
    id: 'NousResearch/Hermes-3-Llama-3.1-8B',
    name: 'Hermes 3 Llama 3.1 8B',
    params: '8B',
    arch: 'llama',
    format: 'GGUF',
    description: 'Fine-tuned for function calling and agentic tasks',
    stars: 1800,
    downloads: 820000,
    addedDate: '2024-08-12',
  },
  {
    id: 'codellama/CodeLlama-13b-Instruct-hf',
    name: 'Code Llama 13B Instruct',
    params: '13B',
    arch: 'llama',
    format: 'GGUF',
    description: "Meta's specialized code generation model",
    stars: 2400,
    downloads: 1200000,
    addedDate: '2023-08-25',
  },
]

function sortModels(models: HFModel[], order: SortOrder): HFModel[] {
  return [...models].sort((a, b) => {
    if (order === 'stars') return b.stars - a.stars
    if (order === 'downloads') return b.downloads - a.downloads
    // newest: sort by addedDate descending
    return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
  })
}

export function HuggingFacePanel() {
  const { checkHealth, listModels, downloadModel, searchModels, getDownloadStatus, cancelDownload } = useModelManager()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('downloads')
  const [downloadStatuses, setDownloadStatuses] = useState<Map<string, DownloadStatus>>(new Map())
  const [isOffline, setIsOffline] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [downloadDetails, setDownloadDetails] = useState<Record<string, DownloadQueueEntry>>({})
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

  // Call backend search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults(null)
      return
    }
    setIsSearching(true)
    searchModels(debouncedQuery.trim()).then(results => {
      setSearchResults(results)
      setIsSearching(false)
    })
  }, [debouncedQuery, searchModels])

  // Poll listModels every 3 seconds while panel is mounted (and immediately on mount)
  useEffect(() => {
    const poll = async () => {
      const result = await listModels()
      if (!result) return
      setDownloadStatuses(prev => {
        const next = new Map(prev)
        result.cached_models.forEach((m: ModelInfo) => {
          if (m.cached && prev.get(m.id) !== 'done') {
            next.set(m.id, 'done')
          }
        })
        return next
      })
    }
    void poll()
    const id = setInterval(poll, 3000)
    return () => clearInterval(id)
  }, [listModels])

  const handleDownload = useCallback(
    async (modelId: string) => {
      setDownloadStatuses(prev => new Map(prev).set(modelId, 'downloading'))
      try {
        const result = await downloadModel(modelId)
        if (!result) {
          setDownloadStatuses(prev => new Map(prev).set(modelId, 'error'))
        }
      } catch {
        setDownloadStatuses(prev => new Map(prev).set(modelId, 'error'))
      }
    },
    [downloadModel]
  )

  const handleCancelDownload = useCallback(
    async (modelId: string) => {
      await cancelDownload(modelId)
      setDownloadStatuses(prev => {
        const next = new Map(prev)
        next.set(modelId, 'idle')
        return next
      })
      setDownloadDetails(prev => {
        const next = { ...prev }
        delete next[modelId]
        return next
      })
    },
    [cancelDownload]
  )

  const showSearchResults = debouncedQuery.trim().length > 0
  const staffPicksFiltered = sortModels(STAFF_PICKS, sortOrder)

  // Active downloads — anything not yet settled (pending / downloading)
  const activeDownloads = Array.from(downloadStatuses.entries()).filter(
    ([, s]) => s === 'downloading' || s === 'pending'
  )

  // Entries to show in sidebar: active + errored (so user can see failures)
  const sidebarDownloads = Array.from(downloadStatuses.entries()).filter(
    ([, s]) => s === 'downloading' || s === 'pending' || s === 'error'
  )

  // Poll download status every second while downloads are active
  useEffect(() => {
    if (activeDownloads.length === 0) return
    const poll = async () => {
      const status = await getDownloadStatus()
      if (!status) return
      setDownloadDetails(status)
      // Sync done/error entries back into downloadStatuses
      setDownloadStatuses(prev => {
        const next = new Map(prev)
        for (const [id, entry] of Object.entries(status)) {
          if (entry.status === 'done' && prev.get(id) !== 'done') {
            next.set(id, 'done')
          }
          if (entry.status === 'error' && prev.get(id) !== 'error') {
            next.set(id, 'error')
          }
        }
        return next
      })
    }
    void poll()
    const id = setInterval(poll, 1000)
    return () => clearInterval(id)
  }, [activeDownloads.length, getDownloadStatus])

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main scrollable content */}
      <div className="flex-1 min-w-0 overflow-y-auto p-6 flex flex-col gap-6 max-w-3xl">
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
          <p className="text-sm text-yellow-400 flex-1">
            Model Manager service is offline (port 8002). Start it to enable HuggingFace downloads.
          </p>
          <button
            onClick={() => checkHealth().then(result => setIsOffline(result === null))}
            className="text-xs text-yellow-400 border border-yellow-400/40 rounded px-2 py-1 hover:bg-yellow-400/20 cursor-pointer flex-shrink-0"
          >
            Retry
          </button>
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

      {/* Active downloads section — replaced by DownloadSidebar, hidden here */}

      {/* Staff Picks / Search results */}
      <div>
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            {showSearchResults
              ? isSearching
                ? 'Searching…'
                : `Search results (${searchResults?.length ?? 0})`
              : 'Staff Picks'}
          </h3>

          {/* Sort controls — only shown when not in search mode */}
          {!showSearchResults && (
            <div className="flex items-center gap-2" role="group" aria-label="Sort models by">
              <span className="text-xs text-text-muted">Sort:</span>
              <div className="flex rounded-md border border-border-default overflow-hidden">
                {SORT_OPTIONS.map((opt, i) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSortOrder(opt.value)}
                    aria-pressed={sortOrder === opt.value}
                    className={[
                      'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-500',
                      i > 0 ? 'border-l border-border-default' : '',
                      sortOrder === opt.value
                        ? 'bg-accent-500/10 text-accent-400'
                        : 'bg-bg-surface-2 text-text-muted hover:text-text-secondary hover:bg-bg-surface-3',
                    ].join(' ')}
                  >
                    <opt.icon size={11} aria-hidden="true" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {showSearchResults ? (
          isSearching ? (
            <div className="flex items-center gap-2 text-sm text-text-muted py-4">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              Searching HuggingFace…
            </div>
          ) : !searchResults || searchResults.length === 0 ? (
            <p className="text-sm text-text-muted">No models found for &ldquo;{debouncedQuery}&rdquo;</p>
          ) : (
            <ul role="list" className="flex flex-col gap-3 list-none p-0 m-0">
              {searchResults.map(model => {
                const [owner] = model.id.split('/')
                return (
                  <li key={model.id}>
                    <ModelCard
                      id={model.id}
                      name={model.name}
                      params=""
                      arch=""
                      format="GGUF"
                      description={`by ${owner}`}
                      stars={0}
                      downloads={0}
                      addedDate=""
                      downloadStatus={downloadStatuses.get(model.id) ?? 'idle'}
                      onDownload={handleDownload}
                    />
                  </li>
                )
              })}
            </ul>
          )
        ) : staffPicksFiltered.length === 0 ? (
          <p className="text-sm text-text-muted">No staff picks available</p>
        ) : (
          <ul role="list" className="flex flex-col gap-3 list-none p-0 m-0">
            {staffPicksFiltered.map(model => (
              <li key={model.id}>
                <ModelCard
                  {...model}
                  stars={model.stars}
                  downloads={model.downloads}
                  downloadStatus={downloadStatuses.get(model.id) ?? 'idle'}
                  onDownload={handleDownload}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>

      {/* Download progress sidebar — visible when ≥1 active or errored download */}
      {sidebarDownloads.length > 0 && (
        <DownloadSidebar downloads={downloadDetails} onCancel={handleCancelDownload} />
      )}
    </div>
  )
}
