import { useCallback } from 'react'
import { useMemoryStore } from '../store/memoryStore'
import type { Memory, MemorySearchResult, ContextSummary } from '../../shared/conversationMemory'
import { parseResponse } from '../services/parseResponse'
import { MemoriesResponseSchema, MemorySchema, MemorySearchResponseSchema, ContextSummarySchema } from '../services/schemas'

const BASE_URL = 'http://localhost:8010'

export function useConversationMemory() {
  const { setMemories, addMemory, removeMemory, setSearchResults, setContextSummary, setLoading, setError } = useMemoryStore()

  const fetchMemories = useCallback(async (): Promise<Memory[]> => {
    try {
      const res = await fetch(`${BASE_URL}/memories`)
      if (!res.ok) return []
      const data = parseResponse(MemoriesResponseSchema, await res.json())
      setMemories(data.memories)
      return data.memories
    } catch {
      return []
    }
  }, [setMemories])

  const addMemoryItem = useCallback(async (text: string, tags: string[] = []): Promise<Memory | null> => {
    try {
      const res = await fetch(`${BASE_URL}/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, tags }),
      })
      if (!res.ok) return null
      const mem = parseResponse(MemorySchema, await res.json())
      addMemory(mem)
      return mem
    } catch {
      return null
    }
  }, [addMemory])

  const searchMemories = useCallback(async (query: string, top_k = 5): Promise<MemorySearchResult[]> => {
    try {
      const res = await fetch(`${BASE_URL}/memories/search?q=${encodeURIComponent(query)}&top_k=${top_k}`)
      if (!res.ok) return []
      const data = parseResponse(MemorySearchResponseSchema, await res.json())
      setSearchResults(data.results)
      return data.results
    } catch {
      return []
    }
  }, [setSearchResults])

  const deleteMemory = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/memories/${id}`, { method: 'DELETE' })
      if (res.ok) removeMemory(id)
      return res.ok
    } catch {
      return false
    }
  }, [removeMemory])

  const buildContext = useCallback(async (query: string, top_k = 5): Promise<ContextSummary | null> => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/context/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, top_k }),
      })
      if (!res.ok) return null
      const data = parseResponse(ContextSummarySchema, await res.json())
      setContextSummary(data)
      return data
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
      return null
    } finally {
      setLoading(false)
    }
  }, [setContextSummary, setLoading, setError])

  return { fetchMemories, addMemoryItem, searchMemories, deleteMemory, buildContext }
}
