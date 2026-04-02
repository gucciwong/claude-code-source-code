import { useCallback } from 'react'
import { useOrgIntelligenceStore } from '../store/orgIntelligenceStore'
import type { ContributeRequest, SharedPattern, SkillGapReport, Bottleneck } from '../../../shared/orgIntelligence'

const BASE_URL = 'http://localhost:8007'

export function useOrgIntelligence() {
  const { addPattern, setSharedPatterns, setSkillGapReport, setBottlenecks, setSearchResults, setLoading, setError } = useOrgIntelligenceStore()

  const contributePattern = useCallback(async (req: ContributeRequest): Promise<SharedPattern | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/patterns/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const pattern: SharedPattern = await res.json()
      addPattern(pattern)
      return pattern
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [addPattern, setLoading, setError])

  const listPatterns = useCallback(async (): Promise<SharedPattern[]> => {
    try {
      const res = await fetch(`${BASE_URL}/patterns/shared`)
      if (!res.ok) return []
      const patterns: SharedPattern[] = await res.json()
      setSharedPatterns(patterns)
      return patterns
    } catch {
      return []
    }
  }, [setSharedPatterns])

  const searchPatterns = useCallback(async (query: string): Promise<SharedPattern[]> => {
    try {
      const res = await fetch(`${BASE_URL}/patterns/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      if (!res.ok) return []
      const results: SharedPattern[] = await res.json()
      setSearchResults(results)
      return results
    } catch {
      return []
    }
  }, [setSearchResults])

  const getSkillGaps = useCallback(async (): Promise<SkillGapReport | null> => {
    try {
      const res = await fetch(`${BASE_URL}/analytics/skill-gaps`)
      if (!res.ok) return null
      const report: SkillGapReport = await res.json()
      setSkillGapReport(report)
      return report
    } catch {
      return null
    }
  }, [setSkillGapReport])

  const getBottlenecks = useCallback(async (): Promise<Bottleneck[]> => {
    try {
      const res = await fetch(`${BASE_URL}/analytics/bottlenecks`)
      if (!res.ok) return []
      const bottlenecks: Bottleneck[] = await res.json()
      setBottlenecks(bottlenecks)
      return bottlenecks
    } catch {
      return []
    }
  }, [setBottlenecks])

  return { contributePattern, listPatterns, searchPatterns, getSkillGaps, getBottlenecks }
}
