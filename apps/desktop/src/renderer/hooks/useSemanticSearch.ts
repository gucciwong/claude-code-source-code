import { useCallback } from 'react'
import { useSemanticSearchStore } from '../store/semanticSearchStore'
import type { CodeSnippet, IndexStatus, IndexRequest } from '../../shared/semanticSearch'

const BASE_URL = 'http://localhost:8017'

export function useSemanticSearch() {
  const { setResults, setIndexStatus, setSearching, setIndexing, setError } = useSemanticSearchStore()

  const search = useCallback(async (query: string, topK = 5): Promise<CodeSnippet[]> => {
    if (!query.trim()) return []
    setSearching(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}&top_k=${topK}`)
      if (!res.ok) throw new Error('Search failed')
      const data: CodeSnippet[] = await res.json()
      setResults(data)
      return data
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search error')
      return []
    } finally {
      setSearching(false)
    }
  }, [setResults, setSearching, setError])

  const indexContent = useCallback(async (req: IndexRequest): Promise<boolean> => {
    setIndexing(true)
    try {
      const res = await fetch(`${BASE_URL}/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      return res.ok
    } catch {
      return false
    } finally {
      setIndexing(false)
    }
  }, [setIndexing])

  const clearIndex = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/index`, { method: 'DELETE' })
      return res.ok
    } catch {
      return false
    }
  }, [])

  const fetchStatus = useCallback(async (): Promise<IndexStatus | null> => {
    try {
      const res = await fetch(`${BASE_URL}/index/status`)
      if (!res.ok) return null
      const data: IndexStatus = await res.json()
      setIndexStatus(data)
      return data
    } catch {
      return null
    }
  }, [setIndexStatus])

  return { search, indexContent, clearIndex, fetchStatus }
}
