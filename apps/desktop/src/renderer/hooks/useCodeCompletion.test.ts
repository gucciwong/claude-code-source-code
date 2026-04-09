import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCodeCompletion } from './useCodeCompletion'
import { useCodeCompletionStore } from '../store/codeCompletionStore'

const mockFetch = vi.fn()

describe('useCodeCompletion', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    vi.clearAllMocks()
    useCodeCompletionStore.setState({
      completions: [],
      activeIndex: 0,
      isLoading: false,
      prefix: '',
      error: null,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('getCompletions calls POST /complete with prefix', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ completions: [] }),
    })

    const { result } = renderHook(() => useCodeCompletion())
    await act(async () => {
      await result.current.getCompletions({ prefix: 'def' })
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8007/complete',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"prefix":"def"'),
      })
    )
  })

  it('getCompletions calls setCompletions with result', async () => {
    const items = [{ text: 'function', confidence: 0.9, source: 'ngram' }]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ completions: items }),
    })

    const { result } = renderHook(() => useCodeCompletion())
    await act(async () => {
      await result.current.getCompletions({ prefix: 'def' })
    })

    expect(useCodeCompletionStore.getState().completions).toEqual(items)
  })

  it('getCompletions returns empty array on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useCodeCompletion())
    let completions: unknown[] = []
    await act(async () => {
      completions = await result.current.getCompletions({ prefix: 'def' })
    })

    expect(completions).toEqual([])
  })

  it('getCompletions sets loading during request', async () => {
    let resolvePromise: () => void
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })

    mockFetch.mockImplementationOnce(async () => {
      await promise
      return { ok: true, json: async () => ({ completions: [] }) }
    })

    const { result } = renderHook(() => useCodeCompletion())
    const callPromise = act(async () => {
      await result.current.getCompletions({ prefix: 'def' })
    })

    // isLoading should be true during the fetch
    expect(useCodeCompletionStore.getState().isLoading).toBe(true)
    resolvePromise!()
    await callPromise
    expect(useCodeCompletionStore.getState().isLoading).toBe(false)
  })

  it('getCompletions returns empty array for non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })

    const { result } = renderHook(() => useCodeCompletion())
    let completions: unknown[] = []
    await act(async () => {
      completions = await result.current.getCompletions({ prefix: 'def' })
    })

    expect(completions).toEqual([])
  })

  it('submitFeedback calls POST /feedback with accepted=true', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })

    const { result } = renderHook(() => useCodeCompletion())
    await act(async () => {
      await result.current.submitFeedback({ completion: 'function', accepted: true })
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8007/feedback',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"accepted":true'),
      })
    )
  })

  it('submitFeedback calls POST /feedback with accepted=false', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })

    const { result } = renderHook(() => useCodeCompletion())
    await act(async () => {
      await result.current.submitFeedback({ completion: 'function', accepted: false })
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8007/feedback',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"accepted":false'),
      })
    )
  })

  it('submitFeedback returns false on error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useCodeCompletion())
    let success: boolean = true
    await act(async () => {
      success = await result.current.submitFeedback({ completion: 'function', accepted: true })
    })

    expect(success).toBe(false)
  })
})
