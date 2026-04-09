import { useCallback } from 'react'
import { usePersonaCouncilStore } from '../store/personaCouncilStore'
import type { ReviewRequest, CouncilReport } from '../../shared/personaCouncil'

const BASE_URL = 'http://localhost:8014'

export function usePersonaCouncil() {
  const { addReport, setActiveReport, setReviewing, setError } = usePersonaCouncilStore()

  const reviewCode = useCallback(async (req: ReviewRequest): Promise<CouncilReport | null> => {
    setReviewing(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const report: CouncilReport = await res.json()
      addReport(report)
      setActiveReport(report)
      return report
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return null
    } finally {
      setReviewing(false)
    }
  }, [addReport, setActiveReport, setReviewing, setError])

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/health`)
      return res.ok
    } catch {
      return false
    }
  }, [])

  return { reviewCode, checkHealth }
}
