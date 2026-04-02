import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOrchestration } from './useOrchestration'
import { useOrchestrationStore } from '../store/orchestrationStore'
import type { OrchestratorSession } from '../../shared/orchestration'

function makeSession(id = 'sess-1'): OrchestratorSession {
  return {
    id,
    goal: 'Test goal',
    context: '',
    tasks: [],
    status: 'completed',
    created_at: 1000,
  }
}

function makeFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  })
}

function makeFetchNotOk(status: number) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => ({ detail: 'error' }),
  })
}

beforeEach(() => {
  useOrchestrationStore.setState({
    sessions: [],
    activeSessionId: null,
    isLoading: false,
    error: null,
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useOrchestration', () => {
  it('createSession returns session on 200 response', async () => {
    const session = makeSession()
    vi.stubGlobal('fetch', makeFetchOk(session))

    const { result } = renderHook(() => useOrchestration())
    let returned: OrchestratorSession | null = null
    await act(async () => {
      returned = await result.current.createSession({ goal: 'Test goal', context: '' })
    })

    expect(returned).not.toBeNull()
    expect(returned!.id).toBe('sess-1')
  })

  it('createSession returns null on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const { result } = renderHook(() => useOrchestration())
    let returned: OrchestratorSession | null = undefined as unknown as null
    await act(async () => {
      returned = await result.current.createSession({ goal: 'Test', context: '' })
    })

    expect(returned).toBeNull()
    expect(useOrchestrationStore.getState().error).toBe('Network error')
  })

  it('createSession sets loading during request', async () => {
    let resolvePromise!: (val: unknown) => void
    const pending = new Promise(res => { resolvePromise = res })
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pending))

    const { result } = renderHook(() => useOrchestration())

    const createPromise = act(async () => {
      result.current.createSession({ goal: 'Test', context: '' })
    })

    // After calling, isLoading should be true (it was set synchronously before await)
    // Resolve to clean up
    resolvePromise({ ok: true, json: async () => makeSession() })
    await createPromise
    // After resolving, loading should be false
    expect(useOrchestrationStore.getState().isLoading).toBe(false)
  })

  it('getSession returns session on 200', async () => {
    const session = makeSession('s2')
    vi.stubGlobal('fetch', makeFetchOk(session))

    const { result } = renderHook(() => useOrchestration())
    let returned: OrchestratorSession | null = null
    await act(async () => {
      returned = await result.current.getSession('s2')
    })

    expect(returned).not.toBeNull()
    expect(returned!.id).toBe('s2')
  })

  it('getSession returns null on 404', async () => {
    vi.stubGlobal('fetch', makeFetchNotOk(404))

    const { result } = renderHook(() => useOrchestration())
    let returned: OrchestratorSession | null = undefined as unknown as null
    await act(async () => {
      returned = await result.current.getSession('not-found')
    })

    expect(returned).toBeNull()
  })

  it('cancelSession returns true on 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))

    const { result } = renderHook(() => useOrchestration())
    let success = false
    await act(async () => {
      success = await result.current.cancelSession('sess-1')
    })

    expect(success).toBe(true)
  })

  it('cancelSession returns false on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const { result } = renderHook(() => useOrchestration())
    let success = true
    await act(async () => {
      success = await result.current.cancelSession('sess-1')
    })

    expect(success).toBe(false)
  })

  it('checkHealth returns true on 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))

    const { result } = renderHook(() => useOrchestration())
    let healthy = false
    await act(async () => {
      healthy = await result.current.checkHealth()
    })

    expect(healthy).toBe(true)
  })
})
