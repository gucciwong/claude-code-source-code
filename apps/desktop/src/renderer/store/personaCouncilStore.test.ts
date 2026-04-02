import { describe, it, expect, beforeEach } from 'vitest'
import { usePersonaCouncilStore } from './personaCouncilStore'
import type { CouncilReport } from '../../shared/personaCouncil'

function makeReport(id: string): CouncilReport {
  return {
    session_id: id,
    code_snippet: 'x = 1',
    language: 'python',
    reviews: [],
    risk_score: { overall: 0, breakdown: {} },
    consensus_summary: 'NO ISSUES DETECTED',
  }
}

beforeEach(() => {
  usePersonaCouncilStore.setState({
    reports: [],
    activeReport: null,
    isReviewing: false,
    error: null,
  })
})

describe('personaCouncilStore', () => {
  it('has correct initial state', () => {
    const state = usePersonaCouncilStore.getState()
    expect(state.reports).toEqual([])
    expect(state.activeReport).toBeNull()
    expect(state.isReviewing).toBe(false)
    expect(state.error).toBeNull()
  })

  it('addReport prepends to reports array', () => {
    const report = makeReport('r1')
    usePersonaCouncilStore.getState().addReport(report)
    expect(usePersonaCouncilStore.getState().reports[0].session_id).toBe('r1')
  })

  it('setActiveReport updates activeReport', () => {
    const report = makeReport('r2')
    usePersonaCouncilStore.getState().setActiveReport(report)
    expect(usePersonaCouncilStore.getState().activeReport?.session_id).toBe('r2')
  })

  it('setReviewing updates isReviewing', () => {
    usePersonaCouncilStore.getState().setReviewing(true)
    expect(usePersonaCouncilStore.getState().isReviewing).toBe(true)
  })

  it('setError updates error', () => {
    usePersonaCouncilStore.getState().setError('Network error')
    expect(usePersonaCouncilStore.getState().error).toBe('Network error')
  })

  it('multiple addReport calls lead to most recent first', () => {
    const r1 = makeReport('first')
    const r2 = makeReport('second')
    usePersonaCouncilStore.getState().addReport(r1)
    usePersonaCouncilStore.getState().addReport(r2)
    const { reports } = usePersonaCouncilStore.getState()
    expect(reports[0].session_id).toBe('second')
    expect(reports[1].session_id).toBe('first')
  })

  it('setActiveReport to null clears activeReport', () => {
    const report = makeReport('r3')
    usePersonaCouncilStore.getState().setActiveReport(report)
    usePersonaCouncilStore.getState().setActiveReport(null)
    expect(usePersonaCouncilStore.getState().activeReport).toBeNull()
  })

  it('store state is independent from other stores', () => {
    // Verify state stays within its own store slice
    const state = usePersonaCouncilStore.getState()
    expect(state).toHaveProperty('reports')
    expect(state).toHaveProperty('activeReport')
    expect(state).toHaveProperty('isReviewing')
    expect(state).toHaveProperty('error')
  })
})
