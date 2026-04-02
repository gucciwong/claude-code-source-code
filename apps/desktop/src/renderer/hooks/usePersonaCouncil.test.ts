import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePersonaCouncil } from './usePersonaCouncil'
import { usePersonaCouncilStore } from '../store/personaCouncilStore'
import type { CouncilReport } from '../../shared/personaCouncil'

const mockReport: CouncilReport = {
  session_id: 'test-session',
  code_snippet: 'x = 1',
  language: 'python',
  reviews: [],
  risk_score: { overall: 0, breakdown: {} },
  consensus_summary: 'NO ISSUES DETECTED',
}

beforeEach(() => {
  vi.restoreAllMocks()
  usePersonaCouncilStore.setState({
    reports: [],
    activeReport: null,
    isReviewing: false,
    error: null,
  })
})

describe('usePersonaCouncil', () => {
  it('reviewCode returns report on 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockReport,
    }))

    const { result } = renderHook(() => usePersonaCouncil())
    let report: CouncilReport | null = null
    await act(async () => {
      report = await result.current.reviewCode({ code: 'x = 1', language: 'python', context: '' })
    })
    expect(report).toEqual(mockReport)
  })

  it('reviewCode returns null on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('Network failure')))

    const { result } = renderHook(() => usePersonaCouncil())
    let report: CouncilReport | null = mockReport
    await act(async () => {
      report = await result.current.reviewCode({ code: 'x = 1', language: 'python', context: '' })
    })
    expect(report).toBeNull()
  })

  it('reviewCode sets isReviewing true during fetch', async () => {
    let resolveResponse!: (v: unknown) => void
    const pending = new Promise(res => { resolveResponse = res })
    vi.stubGlobal('fetch', vi.fn().mockReturnValueOnce(pending))

    const { result } = renderHook(() => usePersonaCouncil())

    act(() => {
      result.current.reviewCode({ code: 'x = 1', language: 'python', context: '' })
    })

    expect(usePersonaCouncilStore.getState().isReviewing).toBe(true)

    await act(async () => {
      resolveResponse({ ok: true, json: async () => mockReport })
      await pending
    })
  })

  it('reviewCode sets isReviewing false after fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockReport,
    }))

    const { result } = renderHook(() => usePersonaCouncil())
    await act(async () => {
      await result.current.reviewCode({ code: 'x = 1', language: 'python', context: '' })
    })
    expect(usePersonaCouncilStore.getState().isReviewing).toBe(false)
  })

  it('reviewCode calls addReport on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockReport,
    }))

    const { result } = renderHook(() => usePersonaCouncil())
    await act(async () => {
      await result.current.reviewCode({ code: 'x = 1', language: 'python', context: '' })
    })
    expect(usePersonaCouncilStore.getState().reports).toHaveLength(1)
    expect(usePersonaCouncilStore.getState().reports[0].session_id).toBe('test-session')
  })

  it('reviewCode calls setActiveReport on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockReport,
    }))

    const { result } = renderHook(() => usePersonaCouncil())
    await act(async () => {
      await result.current.reviewCode({ code: 'x = 1', language: 'python', context: '' })
    })
    expect(usePersonaCouncilStore.getState().activeReport?.session_id).toBe('test-session')
  })

  it('checkHealth returns true on 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true }))

    const { result } = renderHook(() => usePersonaCouncil())
    let healthy = false
    await act(async () => {
      healthy = await result.current.checkHealth()
    })
    expect(healthy).toBe(true)
  })

  it('checkHealth returns false on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('offline')))

    const { result } = renderHook(() => usePersonaCouncil())
    let healthy = true
    await act(async () => {
      healthy = await result.current.checkHealth()
    })
    expect(healthy).toBe(false)
  })
})
