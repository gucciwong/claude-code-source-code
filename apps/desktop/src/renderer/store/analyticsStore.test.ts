import { describe, it, expect, beforeEach } from 'vitest'
import { useAnalyticsStore } from './analyticsStore'
import type { AnalyticsReport } from '../../shared/analytics'

const makeReport = (): AnalyticsReport => ({
  generated_at: 1000000,
  total_events: 5,
  productivity: {
    total_sessions: 3,
    total_tokens: 1500,
    avg_tokens_per_session: 500,
    total_code_reviews: 2,
    total_training_runs: 1,
    acceptance_rate: 0.75,
  },
  quality_trends: [],
  training_roi: {
    total_training_runs: 1,
    avg_improvement_pct: 12.5,
    time_saved_hours: 0.5,
    estimated_roi_multiplier: 1.6,
  },
})

describe('analyticsStore', () => {
  beforeEach(() => {
    useAnalyticsStore.setState({
      report: null,
      isLoading: false,
      error: null,
    })
  })

  it('initial state: null report, false isLoading, null error', () => {
    const state = useAnalyticsStore.getState()
    expect(state.report).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('setReport updates report', () => {
    const report = makeReport()
    useAnalyticsStore.getState().setReport(report)
    expect(useAnalyticsStore.getState().report).toEqual(report)
  })

  it('setLoading updates isLoading', () => {
    useAnalyticsStore.getState().setLoading(true)
    expect(useAnalyticsStore.getState().isLoading).toBe(true)
    useAnalyticsStore.getState().setLoading(false)
    expect(useAnalyticsStore.getState().isLoading).toBe(false)
  })

  it('setError updates error', () => {
    useAnalyticsStore.getState().setError('Something went wrong')
    expect(useAnalyticsStore.getState().error).toBe('Something went wrong')
  })

  it('setReport replaces previous report', () => {
    const report1 = makeReport()
    const report2 = { ...makeReport(), total_events: 99 }
    useAnalyticsStore.getState().setReport(report1)
    useAnalyticsStore.getState().setReport(report2)
    expect(useAnalyticsStore.getState().report?.total_events).toBe(99)
  })

  it('setError to null clears error', () => {
    useAnalyticsStore.getState().setError('initial error')
    useAnalyticsStore.getState().setError(null)
    expect(useAnalyticsStore.getState().error).toBeNull()
  })
})
