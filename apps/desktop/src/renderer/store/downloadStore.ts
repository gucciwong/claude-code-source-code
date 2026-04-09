import { create } from 'zustand'
import { DownloadQueueEntry } from '../hooks/useModelManager'

// Track models already scheduled for auto-clear to avoid duplicate timeouts
const pendingClears = new Map<string, ReturnType<typeof setTimeout>>()

export type DownloadStatus = 'idle' | 'pending' | 'downloading' | 'done' | 'error'

interface DownloadStoreState {
  /** Per-model download status (idle, pending, downloading, done, error) */
  downloadStatuses: Map<string, DownloadStatus>
  /** Per-model detailed download info from the backend */
  downloadDetails: Record<string, DownloadQueueEntry>

  setDownloadStatus: (modelId: string, status: DownloadStatus) => void
  bulkMergeDone: (cachedModelIds: string[]) => void
  setDownloadDetails: (details: Record<string, DownloadQueueEntry>) => void
  syncFromBackendStatus: (details: Record<string, DownloadQueueEntry>) => void
  clearDownload: (modelId: string) => void
}

export const useDownloadStore = create<DownloadStoreState>((set) => ({
  downloadStatuses: new Map(),
  downloadDetails: {},

  setDownloadStatus: (modelId, status) =>
    set((state) => {
      const next = new Map(state.downloadStatuses)
      next.set(modelId, status)
      return { downloadStatuses: next }
    }),

  /** Mark cached models as 'done' if not already */
  bulkMergeDone: (cachedModelIds) =>
    set((state) => {
      const next = new Map(state.downloadStatuses)
      const nextDetails = { ...state.downloadDetails }
      let changed = false
      for (const id of cachedModelIds) {
        if (next.get(id) !== 'done') {
          next.set(id, 'done')
          changed = true
        }
        if (nextDetails[id]) {
          delete nextDetails[id]
          changed = true
        }
        // Clean up any pending auto-clear timeout for this model since it's now marked done
        const timeoutId = pendingClears.get(id)
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId)
          pendingClears.delete(id)
        }
      }
      return changed ? { downloadStatuses: next, downloadDetails: nextDetails } : state
    }),

  setDownloadDetails: (details) =>
    set({ downloadDetails: details }),

  /** Sync done/error statuses from backend poll into downloadStatuses */
  syncFromBackendStatus: (details) =>
    set((state) => {
      const next = new Map(state.downloadStatuses)
      const nextDetails = { ...state.downloadDetails }
      let changed = false

      for (const [id, entry] of Object.entries(details)) {
        if (entry.status === 'error' && next.get(id) !== 'error') {
          next.set(id, 'error')
          changed = true
        }

        if ((entry.status === 'pending' || entry.status === 'downloading') && next.get(id) !== entry.status) {
          next.set(id, entry.status)
          changed = true
        }

        if (entry.status === 'done') {
          const prior = nextDetails[id]
          next.set(id, 'downloading')
          nextDetails[id] = {
            ...entry,
            status: 'downloading',
            progress: 100,
            downloaded_gb: entry.total_size_gb ?? entry.downloaded_gb,
            error: undefined,
            model_name: entry.model_name ?? prior?.model_name ?? id,
            started_at: entry.started_at ?? prior?.started_at ?? Math.floor(Date.now() / 1000),
          }
          changed = true
          if (!pendingClears.has(id)) {
            const timeoutId = setTimeout(() => {
              pendingClears.delete(id)
              useDownloadStore.getState().clearDownload(id)
            }, 3000)
            pendingClears.set(id, timeoutId)
          }
          continue
        }

        nextDetails[id] = entry
        changed = true
      }

      for (const [id, status] of next.entries()) {
        if ((status === 'downloading' || status === 'pending') && !details[id] && !nextDetails[id]) {
          const prior = state.downloadDetails[id]
          if (prior) {
            nextDetails[id] = prior
            changed = true
          }
        }
      }

      return changed ? { downloadStatuses: next, downloadDetails: nextDetails } : state
    }),

  clearDownload: (modelId) =>
    set((state) => {
      const next = new Map(state.downloadStatuses)
      next.set(modelId, 'idle')
      const nextDetails = { ...state.downloadDetails }
      delete nextDetails[modelId]
      return { downloadStatuses: next, downloadDetails: nextDetails }
    }),
}))
