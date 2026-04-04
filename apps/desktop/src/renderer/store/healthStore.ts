import { create } from 'zustand'

export interface ServiceHealth {
  name: string
  url: string
  status: 'healthy' | 'unhealthy' | 'unknown'
  latencyMs: number | null
  lastChecked: Date | null
  error: string | null
}

const SERVICES = [
  { name: 'Voice', url: 'http://localhost:8000/health' },
  { name: 'Training', url: 'http://localhost:8001/health' },
  { name: 'Model Manager', url: 'http://localhost:8002/health' },
  { name: 'Orchestration', url: 'http://localhost:8006/health' },
]

interface HealthState {
  services: ServiceHealth[]
  polling: boolean
  pollInterval: number | null
  checkAll: () => Promise<void>
  startPolling: (intervalMs?: number) => void
  stopPolling: () => void
}

export const useHealthStore = create<HealthState>((set, get) => ({
  services: SERVICES.map(s => ({
    ...s,
    status: 'unknown' as const,
    latencyMs: null,
    lastChecked: null,
    error: null,
  })),
  polling: false,
  pollInterval: null,

  checkAll: async () => {
    const results = await Promise.allSettled(
      SERVICES.map(async (svc) => {
        const start = performance.now()
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 5000)
          const res = await fetch(svc.url, { signal: controller.signal })
          clearTimeout(timeout)
          const latencyMs = Math.round(performance.now() - start)
          return {
            ...svc,
            status: res.ok ? 'healthy' as const : 'unhealthy' as const,
            latencyMs,
            lastChecked: new Date(),
            error: res.ok ? null : `HTTP ${res.status}`,
          }
        } catch (err) {
          return {
            ...svc,
            status: 'unhealthy' as const,
            latencyMs: null,
            lastChecked: new Date(),
            error: err instanceof Error ? err.message : 'Unknown error',
          }
        }
      })
    )

    const services = results.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { ...SERVICES[i], status: 'unhealthy' as const, latencyMs: null, lastChecked: new Date(), error: 'Check failed' }
    )

    set({ services })
  },

  startPolling: (intervalMs = 15000) => {
    const state = get()
    if (state.polling) return
    state.checkAll()
    const id = window.setInterval(() => get().checkAll(), intervalMs)
    set({ polling: true, pollInterval: id as unknown as number })
  },

  stopPolling: () => {
    const { pollInterval } = get()
    if (pollInterval) window.clearInterval(pollInterval)
    set({ polling: false, pollInterval: null })
  },
}))
