import { describe, test, expect, vi, afterEach } from 'vitest'
import { getEmbedding } from '../../rag/embedder'

const MOCK_EMBEDDING = Array.from({ length: 768 }, (_, i) => i / 768)

afterEach(() => vi.restoreAllMocks())

describe('getEmbedding', () => {
  test('returns embedding array on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ embedding: MOCK_EMBEDDING }),
    } as unknown as Response)

    const result = await getEmbedding('http://localhost:11434', 'nomic-embed-text', 'hello world')
    expect(result).toEqual(MOCK_EMBEDDING)
  })

  test('returns null on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
    } as unknown as Response)

    const result = await getEmbedding('http://localhost:11434', 'nomic-embed-text', 'hello')
    expect(result).toBeNull()
  })

  test('returns null on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network failure'))

    const result = await getEmbedding('http://localhost:11434', 'nomic-embed-text', 'hello')
    expect(result).toBeNull()
  })

  test('posts to correct endpoint with correct body', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ embedding: MOCK_EMBEDDING }),
    } as unknown as Response)

    await getEmbedding('http://host:11434', 'nomic-embed-text', 'some code')

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://host:11434/api/embeddings',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ model: 'nomic-embed-text', prompt: 'some code' }),
      }),
    )
  })

  test('passes abort signal when provided', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ embedding: MOCK_EMBEDDING }),
    } as unknown as Response)

    const signal = AbortSignal.timeout(5000)
    await getEmbedding('http://localhost:11434', 'nomic-embed-text', 'code', signal)

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal }),
    )
  })

  test('returns null when response has no embedding field', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'model not found' }),
    } as unknown as Response)

    const result = await getEmbedding('http://localhost:11434', 'nomic-embed-text', 'hello')
    expect(result).toBeNull()
  })
})
