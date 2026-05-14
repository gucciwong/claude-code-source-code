interface Navigator {
  deviceMemory?: number
}

/**
 * Renderer-side declaration of the bridge exposed by the preload script.
 * The implementation lives in `src/preload/index.ts` (W3-T8c, W4-T12).
 */
type UpdateStatusBridge =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

interface UpdateStateBridge {
  status: UpdateStatusBridge
  version: string | null
  progress: number
  error: string | null
  initialized: boolean
}

interface SovereignUpdaterBridge {
  /** Returns the latest UpdateState from the main process. */
  getState(): Promise<unknown>
  /** Triggers a check; resolves once the main process replies. */
  check(): Promise<unknown>
  /** Starts a download (no-op if no update available). */
  download(): Promise<unknown>
  /** Quits and installs the downloaded update. */
  installAndQuit(): Promise<unknown>
  /** Subscribes to live state pushes; returns an unsubscribe function. */
  onStateChange(listener: (state: unknown) => void): () => void
}

interface SovereignBridge {
  /** Fetches the local-token secret from the main process. Cached after first call. */
  getLocalToken(): Promise<string>
  /** Auto-updater controls (W4-T12). */
  updater: SovereignUpdaterBridge
}

interface Window {
  sovereign?: SovereignBridge
}

// Some test/setup paths set this on globalThis instead of `window`.
// eslint-disable-next-line no-var
declare var sovereign: SovereignBridge | undefined
