import { describe, it, expect, beforeEach } from 'vitest'
import { usePRReviewStore } from './prReviewStore'
import type { ReviewResult, ReviewRule } from '../../shared/prReview'

const makeResult = (): ReviewResult => ({
  summary: { total_files: 1, total_changes: 3, errors: 0, warnings: 1, infos: 0, score: 95 },
  comments: [],
  approved: true,
})

const makeRules = (): ReviewRule[] => [
  { id: 'no_print', severity: 'warning', message: 'No print' },
]

describe('usePRReviewStore', () => {
  beforeEach(() => {
    usePRReviewStore.setState({
      result: null,
      rules: [],
      diff: '',
      isReviewing: false,
      error: null,
    })
  })

  it('has correct initial state', () => {
    const state = usePRReviewStore.getState()
    expect(state.result).toBeNull()
    expect(state.rules).toEqual([])
    expect(state.diff).toBe('')
    expect(state.isReviewing).toBe(false)
    expect(state.error).toBeNull()
  })

  it('setResult updates result', () => {
    const result = makeResult()
    usePRReviewStore.getState().setResult(result)
    expect(usePRReviewStore.getState().result).toEqual(result)
  })

  it('setRules updates rules array', () => {
    const rules = makeRules()
    usePRReviewStore.getState().setRules(rules)
    expect(usePRReviewStore.getState().rules).toEqual(rules)
  })

  it('setDiff updates diff', () => {
    usePRReviewStore.getState().setDiff('diff --git a/foo.py b/foo.py')
    expect(usePRReviewStore.getState().diff).toBe('diff --git a/foo.py b/foo.py')
  })

  it('setReviewing updates isReviewing', () => {
    usePRReviewStore.getState().setReviewing(true)
    expect(usePRReviewStore.getState().isReviewing).toBe(true)
    usePRReviewStore.getState().setReviewing(false)
    expect(usePRReviewStore.getState().isReviewing).toBe(false)
  })

  it('setError updates error', () => {
    usePRReviewStore.getState().setError('Something went wrong')
    expect(usePRReviewStore.getState().error).toBe('Something went wrong')
  })

  it('setResult(null) clears result', () => {
    usePRReviewStore.getState().setResult(makeResult())
    usePRReviewStore.getState().setResult(null)
    expect(usePRReviewStore.getState().result).toBeNull()
  })

  it('setError(null) clears error', () => {
    usePRReviewStore.getState().setError('some error')
    usePRReviewStore.getState().setError(null)
    expect(usePRReviewStore.getState().error).toBeNull()
  })
})
