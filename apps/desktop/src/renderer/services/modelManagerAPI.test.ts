/**
 * Tests for modelManagerAPI's auth wiring (Codex review, PR #1).
 *
 * The model-manager service guards routes like `/api/v1/models/:id/download`
 * with `verify_local_token`. These tests confirm the client attaches the
 * local-token Bearer header (via authFetch) so the packaged desktop app
 * doesn't get a 401 on HuggingFace downloads.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { modelManagerAPI } from './modelManagerAPI'
import { _resetTokenCacheForTests } from './authFetch'

const FAKE_TOKEN = 'a'.repeat(64)

beforeEach(() => {
  _resetTokenCacheForTests()
  // Stand in for the Electron preload bridge that hands the renderer
  // its local token.
  ;(globalThis as { sovereign?: unknown }).sovereign = {
    getLocalToken: vi.fn().mockResolvedValue(FAKE_TOKEN),
  }
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ queued: true }),
    } as unknown as Response),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete (globalThis as { sovereign?: unknown }).sovereign
  _resetTokenCacheForTests()
})

describe('modelManagerAPI auth', () => {
  it('downloadFromHuggingFace attaches the local-token Bearer header', async () => {
    await modelManagerAPI.downloadFromHuggingFace('Qwen/Qwen2.5-Coder-7B-Instruct-GGUF')

    expect(fetch).toHaveBeenCalledTimes(1)
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const headers = new Headers(init.headers)
    expect(headers.get('Authorization')).toBe(`Bearer ${FAKE_TOKEN}`)
  })

  it('listModels attaches the Bearer header too', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ cached_models: [], active_model: null }),
    } as unknown as Response)

    await modelManagerAPI.listModels()

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const headers = new Headers(init?.headers)
    expect(headers.get('Authorization')).toBe(`Bearer ${FAKE_TOKEN}`)
  })

  it('setActiveModel attaches the Bearer header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ active_model: 'x' }),
    } as unknown as Response)

    await modelManagerAPI.setActiveModel('some-model')

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const headers = new Headers(init?.headers)
    expect(headers.get('Authorization')).toBe(`Bearer ${FAKE_TOKEN}`)
  })

  it('falls through without a header when no token bridge is present', async () => {
    delete (globalThis as { sovereign?: unknown }).sovereign
    _resetTokenCacheForTests()

    await modelManagerAPI.downloadFromHuggingFace('some/model')

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const headers = new Headers(init.headers)
    // No bridge → no token → no header. The request still goes out;
    // a server with auth disabled (CI / dev) accepts it.
    expect(headers.get('Authorization')).toBeNull()
  })
})
