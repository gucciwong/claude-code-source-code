import { create } from 'zustand'
import type { ReviewResult, ReviewRule } from '../../shared/prReview'

interface PRReviewStore {
  result: ReviewResult | null
  rules: ReviewRule[]
  diff: string
  isReviewing: boolean
  error: string | null
  setResult: (result: ReviewResult | null) => void
  setRules: (rules: ReviewRule[]) => void
  setDiff: (diff: string) => void
  setReviewing: (reviewing: boolean) => void
  setError: (error: string | null) => void
}

export const usePRReviewStore = create<PRReviewStore>(set => ({
  result: null,
  rules: [],
  diff: '',
  isReviewing: false,
  error: null,
  setResult: result => set({ result }),
  setRules: rules => set({ rules }),
  setDiff: diff => set({ diff }),
  setReviewing: isReviewing => set({ isReviewing }),
  setError: error => set({ error }),
}))
