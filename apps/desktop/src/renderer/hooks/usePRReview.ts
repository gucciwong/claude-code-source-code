import { useCallback } from 'react'
import { usePRReviewStore } from '../store/prReviewStore'
import type { ReviewResult, ReviewRule } from '../../shared/prReview'

const BASE_URL = 'http://localhost:8013'

export function usePRReview() {
  const { setResult, setRules, setReviewing, setError } = usePRReviewStore()

  const reviewDiff = useCallback(
    async (diff: string, language = 'python', rules: string[] = []): Promise<ReviewResult | null> => {
      if (!diff.trim()) return null
      setReviewing(true)
      setError(null)
      try {
        const res = await fetch(`${BASE_URL}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ diff, language, rules }),
        })
        if (!res.ok) throw new Error('Review failed')
        const data: ReviewResult = await res.json()
        setResult(data)
        return data
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Review error')
        return null
      } finally {
        setReviewing(false)
      }
    },
    [setResult, setReviewing, setError],
  )

  const fetchRules = useCallback(async (): Promise<ReviewRule[]> => {
    try {
      const res = await fetch(`${BASE_URL}/rules`)
      if (!res.ok) return []
      const data = await res.json()
      setRules(data.rules ?? [])
      return data.rules ?? []
    } catch {
      return []
    }
  }, [setRules])

  return { reviewDiff, fetchRules }
}
