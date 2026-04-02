import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSemanticSearch } from './useSemanticSearch'
import { useSemanticSearchStore } from '../store/semanticSearchStore'

const mockFetch = vi.fn()

describe('useSemanticSearch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    useSemanticSearchStore.setState({
      results: [],
      indexStatus: null,
      isSearching: false,
      isIndexing: false,
      error: null,
      query: '',
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('search with empty query returns empty array without fetch', async () => {
    const { result } = renderHook(() => useSemanticSearch())
    let data: unknown
    await act(async () => {
      data = await result.current.search('')
    })
    expect(data).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('search calls /search endpoint with encoded query', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })
    const { result } = renderHook(() => useSemanticSearch())
    await act(async () => {
      await result.current.search('authentication middleware')
    })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/search?q=authentication%20middleware')
    )
  })

  it('search returns results array on 200', async () => {
    const mockResults = [
      { file_path: 'auth.py', chunk_text: 'def auth():', start_line: 1, end_line: 5, score: 0.9, language: 'python' },
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResults,
    })
    const { result } = renderHook(() => useSemanticSearch())
    let data: unknown
    await act(async () => {
      data = await result.current.search('auth')
    })
    expect(data).toEqual(mockResults)
  })

  it('search returns empty array when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useSemanticSearch())
    let data: unknown
    await act(async () => {
      data = await result.current.search('auth')
    })
    expect(data).toEqual([])
  })

  it('indexContent POSTs to /index and returns true on 200', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })
    const { result } = renderHook(() => useSemanticSearch())
    let ok: unknown
    await act(async () => {
      ok = await result.current.indexContent({
        content: 'def foo(): pass',
        file_path: 'foo.py',
        language: 'python',
        metadata: {},
      })
    })
    expect(ok).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/index'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('indexContent returns false on error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'))
    const { result } = renderHook(() => useSemanticSearch())
    let ok: unknown
    await act(async () => {
      ok = await result.current.indexContent({
        content: 'def foo(): pass',
        file_path: 'foo.py',
        language: 'python',
        metadata: {},
      })
    })
    expect(ok).toBe(false)
  })

  it('clearIndex sends DELETE to /index', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })
    const { result } = renderHook(() => useSemanticSearch())
    await act(async () => {
      await result.current.clearIndex()
    })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/index'),
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('fetchStatus gets /index/status and calls setIndexStatus', async () => {
    const mockStatus = { total_chunks: 10, indexed_files: 2, status: 'ready' as const }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatus,
    })
    const { result } = renderHook(() => useSemanticSearch())
    await act(async () => {
      await result.current.fetchStatus()
    })
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/index/status'))
    expect(useSemanticSearchStore.getState().indexStatus).toEqual(mockStatus)
  })
})
