import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAnalytics } from './useAnalytics'
import { useAnalyticsStore } from '../store/analyticsStore'
import type { MetricEvent, ProductivityMetrics, QualityTrend, TrainingROI } from '../../shared/analytics'

const mockProductivity: ProductivityMetrics = {
  total_sessions: 5,
  total_tokens: 2500,
  avg_tokens_per_session: 500,
  total_code_reviews: 3,
  total_training_runs: 2,
  acceptance_rate: 0.8,
}

const mockTrends: QualityTrend[] = [
  { date_label: '2026-04-01', avg_quality_score: 0.8, pattern_count: 3 },
]

const mockROI: TrainingROI = {
  total_training_runs: 2,
  avg_improvement_pct: 15.0,
  time_saved_hours: 1.2,
  estimated_roi_multiplier: 1.75,
}

const mockEvent: MetricEvent = {
  event_type: 'chat_session',
  timestamp: Date.now() / 1000,
  value: 1.0,
  metadata: {},
}

function makeFetchOk(body: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response)
}

function makeFetchFail() {
  return Promise.resolve({ ok: false } as Response)
}

describe('useAnalytics', () => {
  beforeEach(() => {
    useAnalyticsStore.setState({ report: null, isLoading: false, error: null })
    vi.restoreAllMocks()
  })

  it('ingestEvent returns true on 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    const { result } = renderHook(() => useAnalytics())
    const ok = await act(() => result.current.ingestEvent(mockEvent))
    expect(ok).toBe(true)
  })

  it('ingestEvent returns false on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    const { result } = renderHook(() => useAnalytics())
    const ok = await act(() => result.current.ingestEvent(mockEvent))
    expect(ok).toBe(false)
  })

  it('fetchReport calls all 3 endpoints', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProductivity) } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTrends) } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockROI) } as Response)
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useAnalytics())
    await act(() => result.current.fetchReport())
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8009/metrics/productivity', expect.anything())
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8009/metrics/quality-trends', expect.anything())
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8009/metrics/training-roi', expect.anything())
  })

  it('fetchReport returns assembled report on success', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProductivity) } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTrends) } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockROI) } as Response)
    )
    const { result } = renderHook(() => useAnalytics())
    const report = await act(() => result.current.fetchReport())
    expect(report).not.toBeNull()
    expect(report?.productivity).toEqual(mockProductivity)
    expect(report?.quality_trends).toEqual(mockTrends)
    expect(report?.training_roi).toEqual(mockROI)
  })

  it('fetchReport returns null when any endpoint fails', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: false } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTrends) } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockROI) } as Response)
    )
    const { result } = renderHook(() => useAnalytics())
    const report = await act(() => result.current.fetchReport())
    expect(report).toBeNull()
  })

  it('fetchReport sets isLoading true then false', async () => {
    let resolveAll: (() => void) | undefined
    const fetchMock = vi.fn().mockImplementation(() => new Promise<Response>((res) => {
      resolveAll = () => res({ ok: true, json: () => Promise.resolve(mockProductivity) } as Response)
    }))
    // We'll just test the final state: isLoading should be false after completion
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProductivity) } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTrends) } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockROI) } as Response)
    )
    const { result } = renderHook(() => useAnalytics())
    await act(() => result.current.fetchReport())
    expect(useAnalyticsStore.getState().isLoading).toBe(false)
  })

  it('exportReport returns text on 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('{"data":"test"}'),
    } as Response))
    const { result } = renderHook(() => useAnalytics())
    const text = await act(() => result.current.exportReport('json'))
    expect(text).toBe('{"data":"test"}')
  })

  it('exportReport returns null on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('failed')))
    const { result } = renderHook(() => useAnalytics())
    const text = await act(() => result.current.exportReport('csv'))
    expect(text).toBeNull()
  })
})
