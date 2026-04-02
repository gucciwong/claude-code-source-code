import { describe, it, expect, beforeEach } from 'vitest'
import { useOrchestrationStore } from './orchestrationStore'
import type { OrchestratorSession } from '../../shared/orchestration'

function makeSession(id: string, goal = 'Test goal'): OrchestratorSession {
  return {
    id,
    goal,
    context: '',
    tasks: [],
    status: 'pending',
    created_at: Date.now(),
  }
}

describe('orchestrationStore', () => {
  beforeEach(() => {
    useOrchestrationStore.setState({
      sessions: [],
      activeSessionId: null,
      isLoading: false,
      error: null,
    })
  })

  it('has correct initial state', () => {
    const state = useOrchestrationStore.getState()
    expect(state.sessions).toEqual([])
    expect(state.activeSessionId).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('setSessions replaces sessions array', () => {
    const s1 = makeSession('s1')
    const s2 = makeSession('s2')
    useOrchestrationStore.getState().setSessions([s1, s2])
    expect(useOrchestrationStore.getState().sessions).toHaveLength(2)
    expect(useOrchestrationStore.getState().sessions[0].id).toBe('s1')
  })

  it('addSession appends to sessions', () => {
    const s1 = makeSession('s1')
    const s2 = makeSession('s2')
    useOrchestrationStore.getState().addSession(s1)
    useOrchestrationStore.getState().addSession(s2)
    expect(useOrchestrationStore.getState().sessions).toHaveLength(2)
    expect(useOrchestrationStore.getState().sessions[1].id).toBe('s2')
  })

  it('updateSession updates matching session', () => {
    const s1 = makeSession('s1', 'Original')
    useOrchestrationStore.getState().addSession(s1)
    const updated = { ...s1, goal: 'Updated', status: 'completed' as const }
    useOrchestrationStore.getState().updateSession(updated)
    expect(useOrchestrationStore.getState().sessions[0].goal).toBe('Updated')
    expect(useOrchestrationStore.getState().sessions[0].status).toBe('completed')
  })

  it('setActiveSession updates activeSessionId', () => {
    useOrchestrationStore.getState().setActiveSession('abc-123')
    expect(useOrchestrationStore.getState().activeSessionId).toBe('abc-123')
    useOrchestrationStore.getState().setActiveSession(null)
    expect(useOrchestrationStore.getState().activeSessionId).toBeNull()
  })

  it('setLoading sets isLoading', () => {
    useOrchestrationStore.getState().setLoading(true)
    expect(useOrchestrationStore.getState().isLoading).toBe(true)
    useOrchestrationStore.getState().setLoading(false)
    expect(useOrchestrationStore.getState().isLoading).toBe(false)
  })

  it('setError sets error', () => {
    useOrchestrationStore.getState().setError('Something went wrong')
    expect(useOrchestrationStore.getState().error).toBe('Something went wrong')
    useOrchestrationStore.getState().setError(null)
    expect(useOrchestrationStore.getState().error).toBeNull()
  })

  it('multiple sessions can be added', () => {
    for (let i = 0; i < 5; i++) {
      useOrchestrationStore.getState().addSession(makeSession(`s${i}`))
    }
    expect(useOrchestrationStore.getState().sessions).toHaveLength(5)
  })
})
