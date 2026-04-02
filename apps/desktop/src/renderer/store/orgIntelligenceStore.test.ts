import { describe, it, expect, beforeEach } from 'vitest'
import { useOrgIntelligenceStore } from './orgIntelligenceStore'
import type { SharedPattern, SkillGapReport, Bottleneck } from '../../../shared/orgIntelligence'

const makePattern = (id: string): SharedPattern => ({
  id,
  language: 'python',
  pattern_text: 'def foo(): pass',
  contributor_count: 1,
  usage_count: 0,
  created_at: 1000,
})

const makeReport = (): SkillGapReport => ({
  gaps: [{ topic: 'error_handling', adoption_rate: 0.2, recommended_patterns: [] }],
  generated_at: 1000,
})

const makeBottleneck = (area: string): Bottleneck => ({
  area,
  frequency: 3,
  description: `3 patterns reference ${area}`,
  severity: 'medium',
})

beforeEach(() => {
  useOrgIntelligenceStore.setState({
    sharedPatterns: [],
    skillGapReport: null,
    bottlenecks: [],
    searchResults: [],
    isLoading: false,
    error: null,
  })
})

it('initial state has empty sharedPatterns', () => {
  const { sharedPatterns } = useOrgIntelligenceStore.getState()
  expect(sharedPatterns).toEqual([])
})

it('initial state has null skillGapReport', () => {
  const { skillGapReport } = useOrgIntelligenceStore.getState()
  expect(skillGapReport).toBeNull()
})

it('setSharedPatterns replaces patterns', () => {
  const list = [makePattern('a'), makePattern('b')]
  useOrgIntelligenceStore.getState().setSharedPatterns(list)
  expect(useOrgIntelligenceStore.getState().sharedPatterns).toHaveLength(2)
  expect(useOrgIntelligenceStore.getState().sharedPatterns[0].id).toBe('a')
})

it('addPattern appends to sharedPatterns', () => {
  useOrgIntelligenceStore.getState().addPattern(makePattern('x'))
  useOrgIntelligenceStore.getState().addPattern(makePattern('y'))
  expect(useOrgIntelligenceStore.getState().sharedPatterns).toHaveLength(2)
  expect(useOrgIntelligenceStore.getState().sharedPatterns[1].id).toBe('y')
})

it('setSkillGapReport stores the report', () => {
  const report = makeReport()
  useOrgIntelligenceStore.getState().setSkillGapReport(report)
  expect(useOrgIntelligenceStore.getState().skillGapReport).toEqual(report)
})

it('setBottlenecks stores bottlenecks', () => {
  const list = [makeBottleneck('database_access'), makeBottleneck('network')]
  useOrgIntelligenceStore.getState().setBottlenecks(list)
  expect(useOrgIntelligenceStore.getState().bottlenecks).toHaveLength(2)
  expect(useOrgIntelligenceStore.getState().bottlenecks[0].area).toBe('database_access')
})

it('setSearchResults stores results', () => {
  const results = [makePattern('r1')]
  useOrgIntelligenceStore.getState().setSearchResults(results)
  expect(useOrgIntelligenceStore.getState().searchResults).toHaveLength(1)
})

it('setLoading updates isLoading', () => {
  useOrgIntelligenceStore.getState().setLoading(true)
  expect(useOrgIntelligenceStore.getState().isLoading).toBe(true)
  useOrgIntelligenceStore.getState().setLoading(false)
  expect(useOrgIntelligenceStore.getState().isLoading).toBe(false)
})

it('setError stores error message', () => {
  useOrgIntelligenceStore.getState().setError('Something went wrong')
  expect(useOrgIntelligenceStore.getState().error).toBe('Something went wrong')
  useOrgIntelligenceStore.getState().setError(null)
  expect(useOrgIntelligenceStore.getState().error).toBeNull()
})
