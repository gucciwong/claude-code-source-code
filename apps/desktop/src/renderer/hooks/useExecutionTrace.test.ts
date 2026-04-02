import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useExecutionTrace } from './useExecutionTrace'

const TRACE_URL = 'http://localhost:8005'

function makeFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  })
}

function makeFetchError(status: number) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
  })
}

function makeFetchThrow(message: string) {
  return vi.fn().mockRejectedValue(new Error(message))
}

beforeEach(() => {
  vi.restoreAllMocks()
})

const mockTraceResult = {
  lines: [{ line: 1, vars: { x: '42' } }],
  error: null,
  duration_ms: 5.2,
  language: 'python',
}

const mockJsResult = {
  lines: [],
  error: null,
  duration_ms: 12.0,
  language: 'javascript',
}

// ---------------------------------------------------------------------------
// tracePython
// ---------------------------------------------------------------------------

it('tracePython calls correct endpoint', async () => {
  const fetchMock = makeFetchOk(mockTraceResult)
  vi.stubGlobal('fetch', fetchMock)

  const { result } = renderHook(() => useExecutionTrace())
  await act(async () => {
    await result.current.tracePython('x = 42')
  })

  expect(fetchMock).toHaveBeenCalledWith(
    `${TRACE_URL}/trace/python`,
    expect.objectContaining({ method: 'POST' }),
  )
})

it('tracePython returns result on success', async () => {
  vi.stubGlobal('fetch', makeFetchOk(mockTraceResult))

  const { result } = renderHook(() => useExecutionTrace())
  let returned: unknown
  await act(async () => {
    returned = await result.current.tracePython('x = 42')
  })

  expect(returned).toEqual(mockTraceResult)
})

it('tracePython returns null on network error', async () => {
  vi.stubGlobal('fetch', makeFetchThrow('Network failure'))

  const { result } = renderHook(() => useExecutionTrace())
  let returned: unknown
  await act(async () => {
    returned = await result.current.tracePython('x = 42')
  })

  expect(returned).toBeNull()
})

it('tracePython sets error state on failure', async () => {
  vi.stubGlobal('fetch', makeFetchError(500))

  const { result } = renderHook(() => useExecutionTrace())
  await act(async () => {
    await result.current.tracePython('x = 42')
  })

  expect(result.current.error).toMatch(/HTTP 500/)
})

// ---------------------------------------------------------------------------
// traceJs
// ---------------------------------------------------------------------------

it('traceJs calls correct endpoint', async () => {
  const fetchMock = makeFetchOk(mockJsResult)
  vi.stubGlobal('fetch', fetchMock)

  const { result } = renderHook(() => useExecutionTrace())
  await act(async () => {
    await result.current.traceJs('let x = 1;')
  })

  expect(fetchMock).toHaveBeenCalledWith(
    `${TRACE_URL}/trace/js`,
    expect.objectContaining({ method: 'POST' }),
  )
})

it('traceJs returns result on success', async () => {
  vi.stubGlobal('fetch', makeFetchOk(mockJsResult))

  const { result } = renderHook(() => useExecutionTrace())
  let returned: unknown
  await act(async () => {
    returned = await result.current.traceJs('let x = 1;')
  })

  expect(returned).toEqual(mockJsResult)
})

// ---------------------------------------------------------------------------
// checkHealth
// ---------------------------------------------------------------------------

it('health check returns true on ok', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))

  const { result } = renderHook(() => useExecutionTrace())
  let healthy: boolean | undefined
  await act(async () => {
    healthy = await result.current.checkHealth()
  })

  expect(healthy).toBe(true)
})

it('health check returns false when service down', async () => {
  vi.stubGlobal('fetch', makeFetchThrow('ECONNREFUSED'))

  const { result } = renderHook(() => useExecutionTrace())
  let healthy: boolean | undefined
  await act(async () => {
    healthy = await result.current.checkHealth()
  })

  expect(healthy).toBe(false)
})
