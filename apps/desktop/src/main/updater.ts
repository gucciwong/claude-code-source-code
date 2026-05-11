/**
 * W4-T12 — electron-updater integration.
 *
 * Wraps `electron-updater` with a small IPC surface so the renderer can
 * drive update flows from a Settings screen without owning the full
 * autoUpdater API. Exposes four IPC channels:
 *
 *   updater:check        → triggers a check; resolves to UpdateState
 *   updater:download     → downloads the pending update (if any)
 *   updater:install-quit → quits and installs (Windows/macOS)
 *   updater:state        → returns the current UpdateState
 *
 * And emits one push channel to the focused window:
 *
 *   updater:state-changed → UpdateState (whenever the state mutates)
 *
 * Lifecycle:
 *   - Disabled entirely in dev (`is.dev`) — `electron-updater` will throw
 *     if it can't find dev-app-update.yml, and we don't want to ship one.
 *   - On `app.whenReady` (production builds), we silently check once 30s
 *     after launch so users don't see network spinners during cold start.
 *   - All errors are caught and surfaced through state.error rather than
 *     bubbling — an update failure must never crash the desktop app.
 */

import { app, BrowserWindow, ipcMain } from 'electron'
import { is } from '@electron-toolkit/utils'
import { autoUpdater, type UpdateInfo } from 'electron-updater'

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
  /** Version string when `status` is `available`/`downloading`/`downloaded`. */
  version: string | null
  /** Download progress 0–100 (rounded); only meaningful in `downloading`. */
  progress: number
  /** Human-readable error message; only set when `status === 'error'`. */
  error: string | null
  /** True once the app has been initialized for auto-update. */
  initialized: boolean
}

let state: UpdateState = {
  status: 'idle',
  version: null,
  progress: 0,
  error: null,
  initialized: false,
}

function emitStateChange(): void {
  // Broadcast to every open BrowserWindow — preload listens via `electron`.
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send('updater:state-changed', { ...state })
    }
  }
}

function setState(partial: Partial<UpdateState>): void {
  state = { ...state, ...partial }
  emitStateChange()
}

/**
 * Initialize auto-updater + IPC handlers.
 *
 * Idempotent: safe to call multiple times (subsequent calls are no-ops).
 * Returns `false` in dev mode (no-op); callers can branch off that if they
 * want to log a startup message.
 */
export function initAutoUpdater(): boolean {
  if (state.initialized) return true

  if (is.dev) {
    // electron-updater raises when no dev-app-update.yml is present.
    setState({ initialized: true, status: 'idle' })
    registerIpcStubsForDev()
    return false
  }

  // Don't auto-download — user explicitly opts in via the UI.
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    setState({ status: 'checking', error: null })
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    setState({ status: 'available', version: info.version, error: null })
  })

  autoUpdater.on('update-not-available', () => {
    setState({ status: 'not-available', version: null, error: null })
  })

  autoUpdater.on('download-progress', (p) => {
    setState({
      status: 'downloading',
      progress: Math.round(p.percent ?? 0),
    })
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    setState({
      status: 'downloaded',
      version: info.version,
      progress: 100,
      error: null,
    })
  })

  autoUpdater.on('error', (err) => {
    setState({
      status: 'error',
      error: err && err.message ? err.message : String(err),
    })
  })

  registerIpcHandlers()
  setState({ initialized: true })

  // Background check 30s after init so we don't compete with service spawn.
  setTimeout(() => {
    void safeCheck()
  }, 30_000)

  return true
}

async function safeCheck(): Promise<UpdateState> {
  try {
    await autoUpdater.checkForUpdates()
  } catch (err) {
    setState({
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
    })
  }
  return { ...state }
}

function registerIpcHandlers(): void {
  ipcMain.handle('updater:check', () => safeCheck())
  ipcMain.handle('updater:download', async () => {
    if (state.status !== 'available') {
      return { ...state }
    }
    try {
      await autoUpdater.downloadUpdate()
    } catch (err) {
      setState({
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      })
    }
    return { ...state }
  })
  ipcMain.handle('updater:install-quit', () => {
    if (state.status !== 'downloaded') {
      return { ...state, error: 'no update downloaded' }
    }
    // `quitAndInstall(silent, runAfterFinish)` — non-silent so the user
    // sees the installer UI on Windows; runAfterFinish=true so the new
    // version launches automatically.
    setImmediate(() => autoUpdater.quitAndInstall(false, true))
    return { ...state }
  })
  ipcMain.handle('updater:state', () => ({ ...state }))
}

function registerIpcStubsForDev(): void {
  ipcMain.handle('updater:check', () => ({ ...state }))
  ipcMain.handle('updater:download', () => ({ ...state }))
  ipcMain.handle('updater:install-quit', () => ({
    ...state,
    error: 'updater disabled in dev',
  }))
  ipcMain.handle('updater:state', () => ({ ...state }))
}

/** Test-only state accessor. */
export function _getStateForTests(): UpdateState {
  return { ...state }
}

/** Test-only state mutator. */
export function _setStateForTests(partial: Partial<UpdateState>): void {
  state = { ...state, ...partial }
}

/** Test-only reset. */
export function _resetForTests(): void {
  state = {
    status: 'idle',
    version: null,
    progress: 0,
    error: null,
    initialized: false,
  }
}

// Re-export for renderer types/consumers
export { app }
