/**
 * Tests for the W5-T15 router client.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { route, feedback, getStats } from './routerClient'

let fetchSpy: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchSpy = vi.fn()
  vi.stubGlobal('fetch', fetchSpy)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const OK_BODY = {
  model_id: 'qwen2.5-coder-7b',
  task_type: 'completion',
  complexity: 'simple',
  reason: 'chosen for completion task at simple complexity',
}

describe('route()', () => {
  it('returns parsed payload on success', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify(OK_BODY), { status: 200 }))

    const r = await route({ prompt: 'complete this line' })

    expect(r).toEqual(OK_BODY)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toMatch(/\/api\/v1\/route$/)
    expect((init as RequestInit).method).toBe('POST')
  })

  it('forwards available_models + vram in the body', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify(OK_BODY), { status: 200 }))

    await route({
      prompt: 'refactor',
      available_models: ['qwen2.5-coder-7b', 'qwen2.5-coder-32b'],
      available_vram_gb: 24,
    })

    const [, init] = fetchSpy.mock.calls[0]
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body.available_models).toEqual(['qwen2.5-coder-7b', 'qwen2.5-coder-32b'])
    expect(body.available_vram_gb).toBe(24)
  })

  it('returns null when the server replies 500', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('boom', { status: 500 }))
    const r = await route({ prompt: 'x' })
    expect(r).toBeNull()
  })

  it('returns null when fetch throws', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('network down'))
    const r = await route({ prompt: 'x' })
    expect(r).toBeNull()
  })

  it('returns null on malformed JSON payload', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ junk: true }), { status: 200 }))
    const r = await route({ prompt: 'x' })
    expect(r).toBeNull()
  })

  it('treats missing reason as empty string (not failure)', async () => {
    const partial = { model_id: 'm', task_type: 't', complexity: 'c' }
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify(partial), { status: 200 }))
    const r = await route({ prompt: 'x' })
    expect(r).toEqual({ ...partial, reason: '' })
  })
})

describe('feedback()', () => {
  it('POSTs the payload to /router/feedback', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 200 }))

    await feedback({
      model_id: 'qwen2.5-coder-7b',
      task_type: 'completion',
      accepted: true,
      latency_ms: 320,
    })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toMatch(/\/api\/v1\/router\/feedback$/)
    expect((init as RequestInit).method).toBe('POST')
  })

  it('never throws on network failure', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('offline'))
    await expect(
      feedback({
        model_id: 'm',
        task_type: 'chat',
        accepted: false,
        latency_ms: 0,
      }),
    ).resolves.toBeUndefined()
  })
})

describe('getStats()', () => {
  it('returns parsed stats', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ledger_rows: 3,
          total_requests: 17,
          total_acceptances: 12,
          loaded_at_startup: 3,
        }),
        { status: 200 },
      ),
    )
    const s = await getStats()
    expect(s?.ledger_rows).toBe(3)
    expect(s?.total_acceptances).toBe(12)
  })

  it('returns null on error', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('x'))
    expect(await getStats()).toBeNull()
  })
})
