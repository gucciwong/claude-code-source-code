/**
 * Tests for the renderer-side update store (W4-T12).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useUpdateStore, _resetUpdateStoreForTests } from './updateStore'

interface BridgeState {
  status: string
  version: string | null
  progress: number
  error: string | null
  initialized: boolean
}

function makeBridge(initial: Partial<BridgeState> = {}) {
  const base: BridgeState = {
    status: 'idle',
    version: null,
    progress: 0,
    error: null,
    initialized: true,
    ...initial,
  }
  return {
    state: base,
    listeners: [] as ((s: BridgeState) => void)[],
    getState: vi.fn().mockImplementation(async function (this: { state: BridgeState }) {
      return { ...base }
    }),
    check: vi.fn().mockImplementation(async () => {
      base.status = 'available'
      base.version = '1.0.0'
      return { ...base }
    }),
    download: vi.fn().mockImplementation(async () => {
      base.status = 'downloaded'
      base.progress = 100
      return { ...base }
    }),
    installAndQuit: vi.fn().mockImplementation(async () => ({ ...base })),
    onStateChange: vi.fn().mockImplementation(function (
      this: { listeners: ((s: BridgeState) => void)[] },
      cb: (s: BridgeState) => void,
    ) {
      this.listeners.push(cb)
      return () => {
        this.listeners = this.listeners.filter((l) => l !== cb)
      }
    }),
  }
}

beforeEach(() => {
  _resetUpdateStoreForTests()
})

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).sovereign
  _resetUpdateStoreForTests()
})

describe('updateStore', () => {
  it('starts in idle state', () => {
    const s = useUpdateStore.getState()
    expect(s.status).toBe('idle')
    expect(s.version).toBeNull()
    expect(s.initialized).toBe(false)
  })

  it('refresh() pulls state from the bridge', async () => {
    const bridge = makeBridge({ status: 'idle', initialized: true })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).sovereign = { updater: bridge }

    await useUpdateStore.getState().refresh()

    expect(bridge.getState).toHaveBeenCalledTimes(1)
    expect(useUpdateStore.getState().initialized).toBe(true)
  })

  it('check() flips status to checking then to bridge response', async () => {
    const bridge = makeBridge()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).sovereign = { updater: bridge }

    const checkPromise = useUpdateStore.getState().check()
    // synchronously the store should show "checking"
    expect(useUpdateStore.getState().status).toBe('checking')

    await checkPromise
    expect(useUpdateStore.getState().status).toBe('available')
    expect(useUpdateStore.getState().version).toBe('1.0.0')
  })

  it('check() records bridge-unavailable error when no bridge', async () => {
    await useUpdateStore.getState().check()
    expect(useUpdateStore.getState().status).toBe('error')
    expect(useUpdateStore.getState().error).toMatch(/bridge/)
  })

  it('download() is a no-op when status is not "available"', async () => {
    const bridge = makeBridge()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).sovereign = { updater: bridge }
    // status is 'idle' by default
    await useUpdateStore.getState().download()
    expect(bridge.download).not.toHaveBeenCalled()
  })

  it('download() transitions through downloading → downloaded', async () => {
    const bridge = makeBridge()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).sovereign = { updater: bridge }
    useUpdateStore.setState({ status: 'available', version: '1.0.0' })

    const dl = useUpdateStore.getState().download()
    expect(useUpdateStore.getState().status).toBe('downloading')
    await dl
    expect(useUpdateStore.getState().status).toBe('downloaded')
    expect(useUpdateStore.getState().progress).toBe(100)
  })

  it('subscribeToMain() forwards live push events to the store', () => {
    const bridge = makeBridge()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).sovereign = { updater: bridge }

    const unsub = useUpdateStore.getState().subscribeToMain()
    expect(bridge.onStateChange).toHaveBeenCalledTimes(1)

    // Simulate the main process pushing a state change
    bridge.listeners.forEach((l) =>
      l({
        status: 'downloading',
        version: '1.0.0',
        progress: 42,
        error: null,
        initialized: true,
      }),
    )
    expect(useUpdateStore.getState().status).toBe('downloading')
    expect(useUpdateStore.getState().progress).toBe(42)

    unsub()
    bridge.listeners.forEach((l) =>
      l({
        status: 'idle',
        version: null,
        progress: 0,
        error: null,
        initialized: true,
      }),
    )
    // Unsubscribed before this push — status should remain downloading
    expect(useUpdateStore.getState().status).toBe('downloading')
  })

  it('ignores malformed bridge payloads', async () => {
    const bridge = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getState: vi.fn().mockResolvedValue({ junk: true } as any),
      check: vi.fn().mockResolvedValue(null),
      download: vi.fn().mockResolvedValue(undefined),
      installAndQuit: vi.fn().mockResolvedValue(undefined),
      onStateChange: vi.fn().mockReturnValue(() => undefined),
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).sovereign = { updater: bridge }

    await useUpdateStore.getState().refresh()
    // Initial state preserved — malformed payload ignored
    expect(useUpdateStore.getState().status).toBe('idle')
  })
})
