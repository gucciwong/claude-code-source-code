import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEnterpriseData } from './useEnterpriseData'

// ---------------------------------------------------------------------------
// Fetch mock helpers
// ---------------------------------------------------------------------------

function makeFetchOk(body: unknown): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  })
}

function makeFetchError(status: number): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: 'Error',
    json: async () => ({ detail: 'error' }),
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

it('registers a connector successfully', async () => {
  const connector = { id: 'abc', name: 'SAP', type: 'sap', enabled: true, createdAt: 1000 }
  vi.stubGlobal('fetch', makeFetchOk(connector))

  const { result } = renderHook(() => useEnterpriseData())
  let returned: unknown
  await act(async () => {
    returned = await result.current.registerConnector({
      name: 'SAP',
      type: 'sap',
      enabled: true,
    })
  })

  expect(returned).toEqual(connector)
  expect(result.current.error).toBeNull()
})

it('handles register connector network error', async () => {
  vi.stubGlobal('fetch', makeFetchThrow('Network failure'))

  const { result } = renderHook(() => useEnterpriseData())
  let returned: unknown
  await act(async () => {
    returned = await result.current.registerConnector({ name: 'X', type: 'rest', enabled: true })
  })

  expect(returned).toBeNull()
  expect(result.current.error).toBe('Network failure')
})

it('lists connectors', async () => {
  const list = [
    { id: '1', name: 'SAP', type: 'sap', enabled: true, createdAt: 1 },
    { id: '2', name: 'PG', type: 'postgres', enabled: true, createdAt: 2 },
  ]
  vi.stubGlobal('fetch', makeFetchOk(list))

  const { result } = renderHook(() => useEnterpriseData())
  let connectors: unknown
  await act(async () => {
    connectors = await result.current.listConnectors()
  })

  expect(connectors).toEqual(list)
})

it('returns empty array on list error', async () => {
  vi.stubGlobal('fetch', makeFetchThrow('timeout'))

  const { result } = renderHook(() => useEnterpriseData())
  let connectors: unknown
  await act(async () => {
    connectors = await result.current.listConnectors()
  })

  expect(connectors).toEqual([])
  expect(result.current.error).toBe('timeout')
})

it('removes connector returns true on 200', async () => {
  vi.stubGlobal('fetch', makeFetchOk(null))

  const { result } = renderHook(() => useEnterpriseData())
  let ok: boolean = false
  await act(async () => {
    ok = await result.current.removeConnector('abc')
  })

  expect(ok).toBe(true)
})

it('removes connector returns false on error', async () => {
  vi.stubGlobal('fetch', makeFetchThrow('delete failed'))

  const { result } = renderHook(() => useEnterpriseData())
  let ok: boolean = true
  await act(async () => {
    ok = await result.current.removeConnector('abc')
  })

  expect(ok).toBe(false)
})

it('queries connector returns result', async () => {
  const queryResult = { rows: [{ col: 'val' }], masked_count: 0, duration_ms: 12 }
  vi.stubGlobal('fetch', makeFetchOk(queryResult))

  const { result } = renderHook(() => useEnterpriseData())
  let qr: unknown
  await act(async () => {
    qr = await result.current.queryConnector('abc', { sql: 'SELECT 1' })
  })

  expect(qr).toEqual(queryResult)
})

it('gets schema returns tables', async () => {
  const schemaResp = {
    tables: [{ name: 'orders', columns: ['id', 'amount'] }],
  }
  vi.stubGlobal('fetch', makeFetchOk(schemaResp))

  const { result } = renderHook(() => useEnterpriseData())
  let tables: unknown
  await act(async () => {
    tables = await result.current.getSchema('abc')
  })

  expect(tables).toEqual(schemaResp.tables)
})

it('builds context returns enterprise_context string', async () => {
  const ctxResp = { enterprise_context: '<enterprise_context><connector /></enterprise_context>' }
  vi.stubGlobal('fetch', makeFetchOk(ctxResp))

  const { result } = renderHook(() => useEnterpriseData())
  let ctx: string = ''
  await act(async () => {
    ctx = await result.current.buildContext('list orders', ['id-1'])
  })

  expect(ctx).toBe(ctxResp.enterprise_context)
  expect(ctx).toContain('<enterprise_context>')
})

it('health check returns true on ok', async () => {
  vi.stubGlobal('fetch', makeFetchOk({ status: 'ok', connectors_loaded: 0 }))

  const { result } = renderHook(() => useEnterpriseData())
  let healthy: boolean = false
  await act(async () => {
    healthy = await result.current.checkHealth()
  })

  expect(healthy).toBe(true)
})
