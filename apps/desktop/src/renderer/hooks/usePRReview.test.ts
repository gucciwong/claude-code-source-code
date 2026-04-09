import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePRReview } from './usePRReview'
import { usePRReviewStore } from '../store/prReviewStore'
import type { ReviewResult, ReviewRule } from '../../shared/prReview'

const makeMockResult = (): ReviewResult => ({
  summary: { total_files: 1, total_changes: 3, errors: 0, warnings: 1, infos: 0, score: 95 },
  comments: [],
  approved: true,
})

const makeMockRules = (): ReviewRule[] => [
  { id: 'no_print_statements', severity: 'warning', message: 'No print' },
]

describe('usePRReview', () => {
  beforeEach(() => {
    usePRReviewStore.setState({
      result: null,
      rules: [],
      diff: '',
      isReviewing: false,
      error: null,
    })
    vi.restoreAllMocks()
  })

  it('reviewDiff with empty diff returns null without calling fetch', async () => {
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    const { result } = renderHook(() => usePRReview())
    const returnVal = await act(() => result.current.reviewDiff('  '))
    expect(returnVal).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('reviewDiff POSTs to /review with correct body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeMockResult(),
    })
    vi.stubGlobal('fetch', mockFetch)
    const { result } = renderHook(() => usePRReview())
    await act(() => result.current.reviewDiff('diff --git a/foo.py b/foo.py', 'python', []))
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8016/review',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diff: 'diff --git a/foo.py b/foo.py',
          language: 'python',
          rules: [],
        }),
      }),
    )
  })

  it('reviewDiff returns ReviewResult on 200', async () => {
    const mockResult = makeMockResult()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResult,
    }))
    const { result } = renderHook(() => usePRReview())
    let returnVal: ReviewResult | null = null
    await act(async () => {
      returnVal = await result.current.reviewDiff('diff text')
    })
    expect(returnVal).toEqual(mockResult)
    expect(usePRReviewStore.getState().result).toEqual(mockResult)
  })

  it('reviewDiff sets error on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const { result } = renderHook(() => usePRReview())
    await act(() => result.current.reviewDiff('diff text'))
    expect(usePRReviewStore.getState().error).toBe('Network error')
    expect(usePRReviewStore.getState().result).toBeNull()
  })

  it('reviewDiff sets error on non-200 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    }))
    const { result } = renderHook(() => usePRReview())
    await act(() => result.current.reviewDiff('diff text'))
    expect(usePRReviewStore.getState().error).toBe('Review failed')
  })

  it('fetchRules calls GET /rules and calls setRules', async () => {
    const mockRules = makeMockRules()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rules: mockRules }),
    }))
    const { result } = renderHook(() => usePRReview())
    await act(() => result.current.fetchRules())
    expect(usePRReviewStore.getState().rules).toEqual(mockRules)
  })

  it('fetchRules returns empty array when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')))
    const { result } = renderHook(() => usePRReview())
    let returnVal: ReviewRule[] = []
    await act(async () => {
      returnVal = await result.current.fetchRules()
    })
    expect(returnVal).toEqual([])
  })

  it('reviewDiff sets isReviewing true during request then false after', async () => {
    let resolveFetch!: (v: unknown) => void
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(
        new Promise(resolve => {
          resolveFetch = resolve
        }),
      ),
    )
    const { result } = renderHook(() => usePRReview())

    let reviewPromise: Promise<ReviewResult | null>
    act(() => {
      reviewPromise = result.current.reviewDiff('diff text')
    })
    // After starting, isReviewing should be true
    expect(usePRReviewStore.getState().isReviewing).toBe(true)

    // Resolve the fetch
    await act(async () => {
      resolveFetch({ ok: true, json: async () => makeMockResult() })
      await reviewPromise!
    })
    expect(usePRReviewStore.getState().isReviewing).toBe(false)
  })
})
