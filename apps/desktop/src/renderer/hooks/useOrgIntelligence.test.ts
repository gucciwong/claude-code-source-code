import { beforeEach, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOrgIntelligence } from './useOrgIntelligence'
import { useOrgIntelligenceStore } from '../store/orgIntelligenceStore'

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
    json: async () => ({ detail: 'error' }),
  })
}

function makeFetchThrow(message: string) {
  return vi.fn().mockRejectedValue(new Error(message))
}

const mockPattern = {
  id: 'p1',
  language: 'python',
  pattern_text: 'def foo(): pass',
  contributor_count: 1,
  usage_count: 0,
  created_at: 1000,
}

const mockReport = {
  gaps: [{ topic: 'error_handling', adoption_rate: 0.1, recommended_patterns: [] }],
  generated_at: 1000,
}

const mockBottlenecks = [
  { area: 'database_access', frequency: 3, description: '3 patterns found', severity: 'medium' as const },
]

beforeEach(() => {
  vi.restoreAllMocks()
  useOrgIntelligenceStore.setState({
    sharedPatterns: [],
    skillGapReport: null,
    bottlenecks: [],
    searchResults: [],
    isLoading: false,
    error: null,
  })
})

it('contributePattern returns pattern on 200', async () => {
  vi.stubGlobal('fetch', makeFetchOk(mockPattern))
  const { result } = renderHook(() => useOrgIntelligence())
  let returned: unknown
  await act(async () => {
    returned = await result.current.contributePattern({
      pattern_text: 'def foo(): pass',
      language: 'python',
      contributor_id: 'user1',
    })
  })
  expect(returned).toEqual(mockPattern)
})

it('contributePattern returns null on error', async () => {
  vi.stubGlobal('fetch', makeFetchError(500))
  const { result } = renderHook(() => useOrgIntelligence())
  let returned: unknown
  await act(async () => {
    returned = await result.current.contributePattern({
      pattern_text: 'def foo(): pass',
      language: 'python',
      contributor_id: 'user1',
    })
  })
  expect(returned).toBeNull()
})

it('listPatterns returns patterns on 200', async () => {
  vi.stubGlobal('fetch', makeFetchOk([mockPattern]))
  const { result } = renderHook(() => useOrgIntelligence())
  let returned: unknown
  await act(async () => {
    returned = await result.current.listPatterns()
  })
  expect(returned).toEqual([mockPattern])
})

it('listPatterns returns empty array on error', async () => {
  vi.stubGlobal('fetch', makeFetchThrow('network error'))
  const { result } = renderHook(() => useOrgIntelligence())
  let returned: unknown
  await act(async () => {
    returned = await result.current.listPatterns()
  })
  expect(returned).toEqual([])
})

it('searchPatterns returns results on 200', async () => {
  vi.stubGlobal('fetch', makeFetchOk([mockPattern]))
  const { result } = renderHook(() => useOrgIntelligence())
  let returned: unknown
  await act(async () => {
    returned = await result.current.searchPatterns('foo')
  })
  expect(returned).toEqual([mockPattern])
})

it('getSkillGaps returns report on 200', async () => {
  vi.stubGlobal('fetch', makeFetchOk(mockReport))
  const { result } = renderHook(() => useOrgIntelligence())
  let returned: unknown
  await act(async () => {
    returned = await result.current.getSkillGaps()
  })
  expect(returned).toEqual(mockReport)
})

it('getBottlenecks returns bottlenecks on 200', async () => {
  vi.stubGlobal('fetch', makeFetchOk(mockBottlenecks))
  const { result } = renderHook(() => useOrgIntelligence())
  let returned: unknown
  await act(async () => {
    returned = await result.current.getBottlenecks()
  })
  expect(returned).toEqual(mockBottlenecks)
})

it('getSkillGaps returns null on network error', async () => {
  vi.stubGlobal('fetch', makeFetchThrow('network failure'))
  const { result } = renderHook(() => useOrgIntelligence())
  let returned: unknown
  await act(async () => {
    returned = await result.current.getSkillGaps()
  })
  expect(returned).toBeNull()
})
