/**
 * Tests for authFetch.ts (W3-T8c).
 *
 * We stub global `fetch` and `window.sovereign` rather than mocking the
 * module so the test mirrors how a renderer actually wires this up.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { authFetch, _resetTokenCacheForTests } from './authFetch'

const FAKE_TOKEN = 'cafef00d-' + 'a'.repeat(55)
const ENDPOINT = 'http://localhost:8002/api/v1/models/foo/download'

let fetchSpy: ReturnType<typeof vi.fn>

beforeEach(() => {
  _resetTokenCacheForTests()
  fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', fetchSpy)
})

afterEach(() => {
  vi.unstubAllGlobals()
  // Always tear down the bridge so one test's window.sovereign doesn't leak.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).sovereign
  _resetTokenCacheForTests()
})

function installBridge(getLocalToken: () => Promise<string> | string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).sovereign = {
    getLocalToken: vi.fn().mockImplementation(async () => getLocalToken()),
  }
}

describe('authFetch', () => {
  it('attaches Authorization: Bearer <token> from window.sovereign', async () => {
    installBridge(() => FAKE_TOKEN)

    await authFetch(ENDPOINT, { method: 'POST' })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe(ENDPOINT)
    const headers = new Headers((init as RequestInit).headers)
    expect(headers.get('Authorization')).toBe(`Bearer ${FAKE_TOKEN}`)
    expect((init as RequestInit).method).toBe('POST')
  })

  it('does not overwrite a caller-provided Authorization header', async () => {
    installBridge(() => FAKE_TOKEN)

    await authFetch(ENDPOINT, {
      headers: { Authorization: 'Bearer caller-override' },
    })

    const [, init] = fetchSpy.mock.calls[0]
    const headers = new Headers((init as RequestInit).headers)
    expect(headers.get('Authorization')).toBe('Bearer caller-override')
  })

  it('falls back to no header when the sovereign bridge is missing', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).sovereign

    await authFetch(ENDPOINT)

    const [, init] = fetchSpy.mock.calls[0]
    const headers = new Headers((init as RequestInit).headers)
    expect(headers.has('Authorization')).toBe(false)
  })

  it('skips the header when token is empty string', async () => {
    installBridge(() => '')

    await authFetch(ENDPOINT)

    const [, init] = fetchSpy.mock.calls[0]
    const headers = new Headers((init as RequestInit).headers)
    expect(headers.has('Authorization')).toBe(false)
  })

  it('caches the token across calls (only fetches once from bridge)', async () => {
    let calls = 0
    installBridge(async () => {
      calls += 1
      return FAKE_TOKEN
    })

    await authFetch(ENDPOINT)
    await authFetch(ENDPOINT)
    await authFetch(ENDPOINT)

    expect(calls).toBe(1)
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })

  it('trims whitespace from the token value', async () => {
    installBridge(() => `  ${FAKE_TOKEN}\n`)

    await authFetch(ENDPOINT)

    const [, init] = fetchSpy.mock.calls[0]
    const headers = new Headers((init as RequestInit).headers)
    expect(headers.get('Authorization')).toBe(`Bearer ${FAKE_TOKEN}`)
  })

  it('treats a bridge that throws as a missing-token scenario', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).sovereign = {
      getLocalToken: vi.fn().mockRejectedValue(new Error('IPC down')),
    }

    await authFetch(ENDPOINT)

    const [, init] = fetchSpy.mock.calls[0]
    const headers = new Headers((init as RequestInit).headers)
    expect(headers.has('Authorization')).toBe(false)
  })
})
