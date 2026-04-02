import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKnowledgeLibrary } from './useKnowledgeLibrary'

// ---------------------------------------------------------------------------
// Fetch mock helpers
// ---------------------------------------------------------------------------

function makeFetchOk(body: unknown): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => body,
  })
}

function makeFetchError(status: number, body: unknown): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: 'Error',
    json: async () => body,
  })
}

function makeFetchThrow(message: string): ReturnType<typeof vi.fn> {
  return vi.fn().mockRejectedValue(new Error(message))
}

beforeEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// 1. embed() calls /embed endpoint
it('embed() calls the /embed endpoint', async () => {
  const mockFetch = makeFetchOk({ embedding: [0.1, 0.2, 0.3], dim: 3 })
  vi.stubGlobal('fetch', mockFetch)

  const { result } = renderHook(() => useKnowledgeLibrary())
  await act(async () => {
    await result.current.embed('hello')
  })

  expect(mockFetch).toHaveBeenCalledWith(
    'http://localhost:8003/embed',
    expect.objectContaining({ method: 'POST' }),
  )
})

// 2. embed() returns array of numbers
it('embed() returns an array of numbers', async () => {
  vi.stubGlobal('fetch', makeFetchOk({ embedding: [0.1, 0.2, 0.3], dim: 3 }))

  const { result } = renderHook(() => useKnowledgeLibrary())
  let embedding: number[] = []
  await act(async () => {
    embedding = await result.current.embed('test')
  })

  expect(Array.isArray(embedding)).toBe(true)
  expect(embedding).toEqual([0.1, 0.2, 0.3])
})

// 3. search() calls /search endpoint
it('search() calls the /search endpoint', async () => {
  const mockFetch = makeFetchOk({ results: [] })
  vi.stubGlobal('fetch', mockFetch)

  const { result } = renderHook(() => useKnowledgeLibrary())
  await act(async () => {
    await result.current.search([0.1, 0.2], [])
  })

  expect(mockFetch).toHaveBeenCalledWith(
    'http://localhost:8003/search',
    expect.objectContaining({ method: 'POST' }),
  )
})

// 4. search() sends top_k parameter in body
it('search() sends top_k in the request body', async () => {
  const mockFetch = makeFetchOk({ results: [] })
  vi.stubGlobal('fetch', mockFetch)

  const { result } = renderHook(() => useKnowledgeLibrary())
  await act(async () => {
    await result.current.search([0.1], [], 3)
  })

  const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
  expect(body.top_k).toBe(3)
})

// 5. search() sends threshold parameter in body
it('search() sends threshold in the request body', async () => {
  const mockFetch = makeFetchOk({ results: [] })
  vi.stubGlobal('fetch', mockFetch)

  const { result } = renderHook(() => useKnowledgeLibrary())
  await act(async () => {
    await result.current.search([0.1], [], 5, 0.75)
  })

  const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
  expect(body.threshold).toBe(0.75)
})

// 6. health() calls /health endpoint
it('health() calls the /health endpoint with GET', async () => {
  const mockFetch = makeFetchOk({ status: 'ok', version: '0.1.0', model_loaded: false })
  vi.stubGlobal('fetch', mockFetch)

  const { result } = renderHook(() => useKnowledgeLibrary())
  await act(async () => {
    await result.current.health()
  })

  expect(mockFetch).toHaveBeenCalledWith('http://localhost:8003/health')
})

// 7. embed() sets error state on fetch failure
it('embed() sets error when fetch throws', async () => {
  vi.stubGlobal('fetch', makeFetchThrow('network down'))

  const { result } = renderHook(() => useKnowledgeLibrary())
  await act(async () => {
    await result.current.embed('fail')
  })

  expect(result.current.error).toContain('network down')
})

// 8. isLoading is false initially
it('isLoading is false initially', () => {
  vi.stubGlobal('fetch', makeFetchOk({}))
  const { result } = renderHook(() => useKnowledgeLibrary())
  expect(result.current.isLoading).toBe(false)
})

// 9. embed() returns empty array on 503
it('embed() returns empty array on 503 response', async () => {
  vi.stubGlobal('fetch', makeFetchError(503, { detail: 'Model not available' }))

  const { result } = renderHook(() => useKnowledgeLibrary())
  let embedding: number[] = [1, 2, 3]
  await act(async () => {
    embedding = await result.current.embed('test')
  })

  expect(embedding).toEqual([])
})

// 10. search() returns empty array on error
it('search() returns empty array when fetch throws', async () => {
  vi.stubGlobal('fetch', makeFetchThrow('timeout'))

  const { result } = renderHook(() => useKnowledgeLibrary())
  let results: Array<{ id: string; score: number }> = [{ id: 'x', score: 1 }]
  await act(async () => {
    results = await result.current.search([0.1], [{ id: 'x', embedding: [0.1] }])
  })

  expect(results).toEqual([])
})
