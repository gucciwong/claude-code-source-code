/**
 * authFetch — drop-in replacement for `fetch` that attaches the local-token
 * Bearer header negotiated with the main process (W3-T8c).
 *
 * Usage:
 *   import { authFetch } from '../services/authFetch'
 *   const r = await authFetch(`${BASE}/api/v1/models/foo/download`, { method: 'POST' })
 *
 * Design notes:
 * - The token is fetched once via `window.sovereign.getLocalToken()` and
 *   cached for the lifetime of the renderer. Subsequent calls reuse it.
 * - When the bridge is unavailable (vitest jsdom, browser-tab, or build
 *   misconfig) the call still succeeds — we just skip the header. Servers
 *   that require the header will return 401, which is the correct UX:
 *   the user sees the auth failure rather than a silent dev-mode bypass.
 * - The header is only added when there is a non-empty token AND the
 *   caller hasn't explicitly set `Authorization` themselves (allows
 *   tests / edge cases to override).
 *
 * @internal `_resetTokenCacheForTests` is exported only so unit tests can
 * exercise both first-fetch and cache-hit paths.
 */

let cachedTokenPromise: Promise<string> | null = null

async function fetchTokenOnce(): Promise<string> {
  // `window` is undefined in some test environments — guard.
  const bridge =
    typeof window !== 'undefined'
      ? window.sovereign
      : (typeof globalThis !== 'undefined' ? (globalThis as { sovereign?: { getLocalToken(): Promise<string> } }).sovereign : undefined)

  if (!bridge || typeof bridge.getLocalToken !== 'function') {
    return ''
  }

  try {
    const token = await bridge.getLocalToken()
    return typeof token === 'string' ? token.trim() : ''
  } catch {
    return ''
  }
}

function getToken(): Promise<string> {
  if (!cachedTokenPromise) {
    cachedTokenPromise = fetchTokenOnce()
  }
  return cachedTokenPromise
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getToken()

  // Build a new Headers object so we don't mutate caller-owned state.
  const headers = new Headers(init.headers ?? undefined)
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(input, { ...init, headers })
}

/**
 * Force the next `authFetch` call to refetch the token from the main
 * process. Useful only for tests; production code should never need this
 * because the token doesn't rotate without a desktop restart.
 */
export function _resetTokenCacheForTests(): void {
  cachedTokenPromise = null
}
