/**
 * W4-T12 — renderer store for the auto-updater UI.
 *
 * Mirrors the `UpdateState` shape from `src/main/updater.ts`. The store
 * subscribes to the `updater:state-changed` IPC channel via the preload
 * bridge so the UI updates live without polling.
 *
 * Falls back to a stable "no bridge" state when running outside Electron
 * (vitest jsdom, hot-reload SSR, etc.) so tests of *other* screens that
 * import this module don't blow up.
 */
import { create } from 'zustand'

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export interface UpdateState {
  status: UpdateStatus
  version: string | null
  progress: number
  error: string | null
  initialized: boolean
}

interface UpdateActions {
  /** Pulls the current state from the main process. */
  refresh: () => Promise<void>
  /** Triggers a check; resolves once the main process responds. */
  check: () => Promise<void>
  /** Downloads the pending update (no-op if status !== 'available'). */
  download: () => Promise<void>
  /** Quits and installs the downloaded update. */
  installAndQuit: () => Promise<void>
  /** Hook into the live push channel; returns unsubscribe. */
  subscribeToMain: () => () => void
  /** @internal test helper to set state directly */
  _setStateForTests: (s: Partial<UpdateState>) => void
}

const INITIAL: UpdateState = {
  status: 'idle',
  version: null,
  progress: 0,
  error: null,
  initialized: false,
}

function isValidState(value: unknown): value is UpdateState {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.status === 'string' &&
    (v.version === null || typeof v.version === 'string') &&
    typeof v.progress === 'number' &&
    (v.error === null || typeof v.error === 'string') &&
    typeof v.initialized === 'boolean'
  )
}

function getBridge():
  | {
      getState: () => Promise<unknown>
      check: () => Promise<unknown>
      download: () => Promise<unknown>
      installAndQuit: () => Promise<unknown>
      onStateChange: (cb: (s: unknown) => void) => () => void
    }
  | undefined {
  if (typeof window === 'undefined') return undefined
  return window.sovereign?.updater
}

export const useUpdateStore = create<UpdateState & UpdateActions>((set, get) => ({
  ...INITIAL,

  async refresh() {
    const bridge = getBridge()
    if (!bridge) return
    const next = await bridge.getState()
    if (isValidState(next)) set(next)
  },

  async check() {
    const bridge = getBridge()
    if (!bridge) {
      set({ status: 'error', error: 'updater bridge unavailable' })
      return
    }
    set({ status: 'checking', error: null })
    const next = await bridge.check()
    if (isValidState(next)) set(next)
  },

  async download() {
    const bridge = getBridge()
    if (!bridge) return
    if (get().status !== 'available') return
    set({ status: 'downloading', progress: 0 })
    const next = await bridge.download()
    if (isValidState(next)) set(next)
  },

  async installAndQuit() {
    const bridge = getBridge()
    if (!bridge) return
    await bridge.installAndQuit()
  },

  subscribeToMain() {
    const bridge = getBridge()
    if (!bridge) return () => undefined
    return bridge.onStateChange((s) => {
      if (isValidState(s)) set(s)
    })
  },

  _setStateForTests(s) {
    set(s)
  },
}))

/** Reset the store to its initial state. Test-only. */
export function _resetUpdateStoreForTests(): void {
  useUpdateStore.setState({ ...INITIAL })
}
