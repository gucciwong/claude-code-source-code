import { getCompletion, checkOllamaOnline } from '../ollamaClient'

// Vitest global mocks for fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  mockFetch.mockReset()
})

test('getCompletion calls /api/generate with model and prompt', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ response: 'const x = 1;' }),
  })

  const result = await getCompletion('http://localhost:11434', 'qwen2.5-coder:7b', 'function hello', 64)
  expect(result).toBe('const x = 1;')
  expect(mockFetch).toHaveBeenCalledWith(
    'http://localhost:11434/api/generate',
    expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('"model":"qwen2.5-coder:7b"'),
    }),
  )
})

test('getCompletion returns empty string on non-ok response', async () => {
  mockFetch.mockResolvedValueOnce({ ok: false, status: 503 })
  const result = await getCompletion('http://localhost:11434', 'codellama', 'fn ', 64)
  expect(result).toBe('')
})

test('getCompletion returns empty string on network error', async () => {
  mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))
  const result = await getCompletion('http://localhost:11434', 'codellama', 'fn ', 64)
  expect(result).toBe('')
})

test('checkOllamaOnline returns true when /api/tags responds ok', async () => {
  mockFetch.mockResolvedValueOnce({ ok: true })
  const online = await checkOllamaOnline('http://localhost:11434')
  expect(online).toBe(true)
})

test('checkOllamaOnline returns false on error', async () => {
  mockFetch.mockRejectedValueOnce(new Error('offline'))
  const online = await checkOllamaOnline('http://localhost:11434')
  expect(online).toBe(false)
})
