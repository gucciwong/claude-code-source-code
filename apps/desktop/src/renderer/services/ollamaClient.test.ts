import { ollamaClient } from './ollamaClient'
import { vi, describe, test, expect, beforeEach } from 'vitest'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('ollamaClient.getModels', () => {
  test('returns list of installed models on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [{ name: 'qwen2.5-coder:latest', size: 20_000_000_000, digest: 'abc', modified_at: '2026-01-01' }] }),
    }))
    const models = await ollamaClient.getModels()
    expect(models).toHaveLength(1)
    expect(models[0].name).toBe('qwen2.5-coder:latest')
  })

  test('returns empty array on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')))
    const models = await ollamaClient.getModels()
    expect(models).toEqual([])
  })

  test('returns empty array when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const models = await ollamaClient.getModels()
    expect(models).toEqual([])
  })
})

describe('ollamaClient.isOnline', () => {
  test('returns true when Ollama responds ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    expect(await ollamaClient.isOnline()).toBe(true)
  })

  test('returns false when connection refused', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')))
    expect(await ollamaClient.isOnline()).toBe(false)
  })
})
