import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Search, RefreshCw, Trash2 } from 'lucide-react'
import { useSemanticSearch } from '../hooks/useSemanticSearch'
import { useSemanticSearchStore } from '../store/semanticSearchStore'
import { SearchResultCard, IndexStatusBadge, EmptySearchState } from '../components/search'

export function SemanticSearch() {
  const { search, clearIndex, fetchStatus } = useSemanticSearch()
  const { results, indexStatus, isSearching, query, setQuery } = useSemanticSearchStore()
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setHasSearched(true)
    await search(query)
  }, [query, search])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleClear = async () => {
    await clearIndex()
    await fetchStatus()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Search size={20} aria-hidden="true" className="text-accent-400" />
            <h1 className="text-text-primary text-xl font-semibold">Code Search</h1>
          </div>
          <div className="flex items-center gap-3">
            <IndexStatusBadge status={indexStatus} />
            <button
              onClick={() => fetchStatus()}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-surface-3 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              aria-label="Refresh index status"
            >
              <RefreshCw size={14} aria-hidden="true" />
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              aria-label="Clear search index"
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
        <p className="text-text-secondary text-sm mb-4">Search your codebase semantically — by meaning, not just keywords</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by intent, e.g. 'authentication middleware' …"
              className="w-full bg-bg-surface-2 border border-border-default rounded-lg pl-9 pr-4 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
              aria-label="Semantic search query"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="flex items-center gap-2 bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-text-primary text-sm font-medium px-4 py-2 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            {isSearching ? <RefreshCw size={14} className="animate-spin" aria-hidden="true" /> : <Search size={14} aria-hidden="true" />}
            {isSearching ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {!hasSearched ? (
          <EmptySearchState />
        ) : results.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-text-muted text-sm">No results found for "{query}"</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-text-muted text-xs mb-3">{results.length} result(s) for "{query}"</p>
            {results.map((r, i) => (
              <SearchResultCard key={`${r.file_path}-${r.start_line}`} result={r} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
