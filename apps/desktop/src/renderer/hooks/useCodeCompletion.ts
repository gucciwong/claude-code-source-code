import { useCallback } from 'react'
import { useCodeCompletionStore } from '../store/codeCompletionStore'
import type { Completion, CompletionRequest, CompletionFeedback } from '../../shared/codeCompletion'

const BASE_URL = 'http://localhost:8015'

export function useCodeCompletion() {
  const { setCompletions, setLoading, setError } = useCodeCompletionStore()

  const getCompletions = useCallback(async (req: CompletionRequest): Promise<Completion[]> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) return []
      const data: { completions: Completion[] } = await res.json()
      setCompletions(data.completions)
      return data.completions
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
      return []
    } finally {
      setLoading(false)
    }
  }, [setCompletions, setLoading, setError])

  const submitFeedback = useCallback(async (fb: CompletionFeedback): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fb),
        signal: AbortSignal.timeout(10_000),
      })
      return res.ok
    } catch {
      return false
    }
  }, [])

  return { getCompletions, submitFeedback }
}
