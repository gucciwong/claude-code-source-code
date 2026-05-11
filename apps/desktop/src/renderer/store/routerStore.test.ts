/**
 * Tests for the W5-T15 router store + Auto mode flow.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../services/routerClient', () => ({
  route: vi.fn(),
  feedback: vi.fn(),
  getStats: vi.fn(),
}))

import { route } from '../services/routerClient'
import { useRouterStore, _resetRouterStoreForTests } from './routerStore'

beforeEach(() => {
  _resetRouterStoreForTests()
  vi.clearAllMocks()
})

afterEach(() => {
  _resetRouterStoreForTests()
})

describe('routerStore', () => {
  it('defaults to manual mode with no last choice', () => {
    const s = useRouterStore.getState()
    expect(s.mode).toBe('manual')
    expect(s.lastChoice).toBeNull()
    expect(s.pendingDecide).toBe(false)
  })

  it('setMode flips between manual and auto', () => {
    useRouterStore.getState().setMode('auto')
    expect(useRouterStore.getState().mode).toBe('auto')
    useRouterStore.getState().setMode('manual')
    expect(useRouterStore.getState().mode).toBe('manual')
  })

  it('decide() returns the routed model id and records lastChoice', async () => {
    const fake = {
      model_id: 'qwen2.5-coder-32b',
      task_type: 'debugging',
      complexity: 'complex',
      reason: 'chosen for debugging at complex',
    }
    vi.mocked(route).mockResolvedValueOnce(fake)

    const chosen = await useRouterStore.getState().decide({ prompt: 'fix the bug' })

    expect(chosen).toBe('qwen2.5-coder-32b')
    expect(useRouterStore.getState().lastChoice).toEqual(fake)
    expect(useRouterStore.getState().pendingDecide).toBe(false)
  })

  it('decide() flips pendingDecide true during the in-flight call', async () => {
    let resolveRoute!: (v: typeof fake | null) => void
    const fake = {
      model_id: 'm',
      task_type: 'completion',
      complexity: 'simple',
      reason: '',
    }
    vi.mocked(route).mockReturnValueOnce(
      new Promise((r) => {
        resolveRoute = r as (v: typeof fake | null) => void
      }),
    )

    const promise = useRouterStore.getState().decide({ prompt: 'x' })
    // Synchronously after invoking, pendingDecide should be true
    expect(useRouterStore.getState().pendingDecide).toBe(true)

    resolveRoute(fake)
    await promise

    expect(useRouterStore.getState().pendingDecide).toBe(false)
  })

  it('decide() returns null and clears pendingDecide when route() returns null', async () => {
    vi.mocked(route).mockResolvedValueOnce(null)

    const chosen = await useRouterStore.getState().decide({ prompt: 'x' })

    expect(chosen).toBeNull()
    expect(useRouterStore.getState().pendingDecide).toBe(false)
    // lastChoice is NOT updated on failure
    expect(useRouterStore.getState().lastChoice).toBeNull()
  })

  it('decide() never throws even if route() rejects', async () => {
    vi.mocked(route).mockRejectedValueOnce(new Error('boom'))

    const chosen = await useRouterStore.getState().decide({ prompt: 'x' })

    expect(chosen).toBeNull()
    expect(useRouterStore.getState().pendingDecide).toBe(false)
  })

  it('clearLastChoice empties lastChoice without disturbing mode', () => {
    useRouterStore.setState({
      mode: 'auto',
      lastChoice: {
        model_id: 'x',
        task_type: 'y',
        complexity: 'z',
        reason: 'w',
      },
      pendingDecide: false,
    })
    useRouterStore.getState().clearLastChoice()
    expect(useRouterStore.getState().mode).toBe('auto')
    expect(useRouterStore.getState().lastChoice).toBeNull()
  })

  it('forwards full request body to route() including available_models + vram', async () => {
    vi.mocked(route).mockResolvedValueOnce({
      model_id: 'qwen2.5-coder-7b',
      task_type: 'completion',
      complexity: 'simple',
      reason: '',
    })

    await useRouterStore.getState().decide({
      prompt: 'complete',
      context: 'x = ',
      available_models: ['qwen2.5-coder-7b', 'qwen2.5-coder-32b'],
      available_vram_gb: 24,
      language: 'python',
    })

    expect(route).toHaveBeenCalledWith({
      prompt: 'complete',
      context: 'x = ',
      available_models: ['qwen2.5-coder-7b', 'qwen2.5-coder-32b'],
      available_vram_gb: 24,
      language: 'python',
    })
  })
})
