import { useCallback } from 'react'
import { useAwardStore } from '../store/awardStore'
import type { OrgLeaderboard, MemberAward } from '../../shared/awards'

const BASE_URL = 'http://localhost:8011'

export function useAwards() {
  const { setLeaderboard, setSelectedMember, setLoading, setError } = useAwardStore()

  const fetchLeaderboard = useCallback(async (orgId: string): Promise<OrgLeaderboard | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/awards/${encodeURIComponent(orgId)}/leaderboard`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const lb: OrgLeaderboard = await res.json()
      setLeaderboard(lb)
      return lb
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [setLeaderboard, setLoading, setError])

  const fetchMemberAward = useCallback(async (orgId: string, memberId: string): Promise<MemberAward | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/awards/${encodeURIComponent(orgId)}/member/${encodeURIComponent(memberId)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const award: MemberAward = await res.json()
      setSelectedMember(award)
      return award
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [setSelectedMember, setLoading, setError])

  const seedDemoData = useCallback(async (orgId: string): Promise<OrgLeaderboard | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/awards/${encodeURIComponent(orgId)}/seed-demo`, { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const lb: OrgLeaderboard = await res.json()
      setLeaderboard(lb)
      return lb
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [setLeaderboard, setLoading, setError])

  return { fetchLeaderboard, fetchMemberAward, seedDemoData }
}
