import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConversationMemory } from './useConversationMemory'
import { useMemoryStore } from '../store/memoryStore'

const makeMemory = (id = 'mem-1') => ({
  id,
  text: 'test memory',
  tags: [],
  relevance_score: 0,
  timestamp: new Date().toISOString(),
})

const makeFetch = (data: unknown, ok = true) =>
  vi.fn().mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(data),
  })

describe('useConversationMemory', () => {
  beforeEach(() => {
    useMemoryStore.setState({
      memories: [],
      searchResults: [],
      contextSummary: null,
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetchMemories calls GET /memories and calls setMemories', async () => {
    const mem = makeMemory()
    vi.stubGlobal('fetch', makeFetch({ memories: [mem] }))
    const { result } = renderHook(() => useConversationMemory())
    await act(async () => { await result.current.fetchMemories() })
    expect(fetch).toHaveBeenCalledWith('http://localhost:8016/memories')
    expect(useMemoryStore.getState().memories).toEqual([mem])
  })

  it('fetchMemories returns empty array on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network failed')))
    const { result } = renderHook(() => useConversationMemory())
    let returned: unknown
    await act(async () => { returned = await result.current.fetchMemories() })
    expect(returned).toEqual([])
  })

  it('addMemoryItem POSTs to /memories and calls addMemory', async () => {
    const mem = makeMemory()
    vi.stubGlobal('fetch', makeFetch(mem))
    const { result } = renderHook(() => useConversationMemory())
    await act(async () => { await result.current.addMemoryItem('test memory') })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8016/memories',
      expect.objectContaining({ method: 'POST' })
    )
    expect(useMemoryStore.getState().memories).toContainEqual(mem)
  })

  it('addMemoryItem returns null on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')))
    const { result } = renderHook(() => useConversationMemory())
    let returned: unknown
    await act(async () => { returned = await result.current.addMemoryItem('test') })
    expect(returned).toBeNull()
  })

  it('searchMemories calls GET /memories/search with encoded query', async () => {
    const results = [{ memory: makeMemory(), score: 0.9 }]
    vi.stubGlobal('fetch', makeFetch({ results }))
    const { result } = renderHook(() => useConversationMemory())
    await act(async () => { await result.current.searchMemories('hello world') })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/memories/search?q=hello%20world')
    )
    expect(useMemoryStore.getState().searchResults).toEqual(results)
  })

  it('deleteMemory sends DELETE to /memories/{id}', async () => {
    useMemoryStore.setState({ memories: [makeMemory('del-1')] })
    vi.stubGlobal('fetch', makeFetch({ status: 'ok' }))
    const { result } = renderHook(() => useConversationMemory())
    await act(async () => { await result.current.deleteMemory('del-1') })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8016/memories/del-1',
      expect.objectContaining({ method: 'DELETE' })
    )
    expect(useMemoryStore.getState().memories).toHaveLength(0)
  })

  it('buildContext POSTs to /context/build and calls setContextSummary', async () => {
    const summary = {
      query: 'test',
      relevant_memories: [],
      compressed_context: 'ctx',
      token_estimate: 5,
    }
    vi.stubGlobal('fetch', makeFetch(summary))
    const { result } = renderHook(() => useConversationMemory())
    await act(async () => { await result.current.buildContext('test') })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8016/context/build',
      expect.objectContaining({ method: 'POST' })
    )
    expect(useMemoryStore.getState().contextSummary).toEqual(summary)
  })

  it('buildContext returns null on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))
    const { result } = renderHook(() => useConversationMemory())
    let returned: unknown
    await act(async () => { returned = await result.current.buildContext('fail') })
    expect(returned).toBeNull()
    expect(useMemoryStore.getState().isLoading).toBe(false)
  })
})
