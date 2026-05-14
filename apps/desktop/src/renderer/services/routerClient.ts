/**
 * W5-T15 — Renderer client for the Context-Aware Model Router (CAMR).
 *
 * Wraps two endpoints on `services/model-manager` (port 8002):
 *   POST /api/v1/route            → pick a model + return the reason
 *   POST /api/v1/router/feedback  → record acceptance/latency for learning
 *
 * Both endpoints are unprotected on the server side (they're not destructive
 * and they need to fire on every Chat message), so we use plain `fetch`
 * rather than `authFetch`.
 *
 * Safe-to-call from any UI surface:
 *   - `route()` falls back to `null` on network/server failure — callers
 *     should treat that as "stay on whatever model the user already had".
 *   - `feedback()` is always fire-and-forget; it never throws.
 */

const BASE = import.meta.env.VITE_MODEL_MANAGER_URL ?? 'http://localhost:8002'

export interface RouteRequest {
  prompt: string
  context?: string
  available_models?: string[]
  available_vram_gb?: number
  language?: string
}

export interface RouteResponse {
  model_id: string
  task_type: string
  complexity: string
  reason: string
}

export interface RouterFeedback {
  model_id: string
  task_type: string
  accepted: boolean
  latency_ms: number
}

export async function route(req: RouteRequest): Promise<RouteResponse | null> {
  try {
    const res = await fetch(`${BASE}/api/v1/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) {
      console.warn('[router] /api/v1/route returned', res.status)
      return null
    }
    const data = (await res.json()) as Partial<RouteResponse>
    if (
      !data ||
      typeof data.model_id !== 'string' ||
      typeof data.task_type !== 'string' ||
      typeof data.complexity !== 'string'
    ) {
      console.warn('[router] /api/v1/route returned malformed payload', data)
      return null
    }
    return {
      model_id: data.model_id,
      task_type: data.task_type,
      complexity: data.complexity,
      reason: typeof data.reason === 'string' ? data.reason : '',
    }
  } catch (err) {
    console.warn('[router] /api/v1/route failed:', err)
    return null
  }
}

export async function feedback(payload: RouterFeedback): Promise<void> {
  try {
    await fetch(`${BASE}/api/v1/router/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    })
  } catch {
    // Fire-and-forget — never block UX on feedback delivery.
  }
}

export interface RouterStats {
  ledger_rows: number
  total_requests: number
  total_acceptances: number
  loaded_at_startup: number
}

export async function getStats(): Promise<RouterStats | null> {
  try {
    const res = await fetch(`${BASE}/api/v1/router/stats`, {
      signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) return null
    return (await res.json()) as RouterStats
  } catch {
    return null
  }
}
