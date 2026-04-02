import { useState, useCallback } from 'react'

const TRACE_SERVICE_URL = 'http://localhost:8005'

interface TraceResult {
  lines: Array<{ line: number; vars?: Record<string, unknown>; call?: string; duration_ms?: number }>
  error: string | null
  duration_ms: number
  language: string
}

export function useExecutionTrace() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tracePython = useCallback(async (code: string, timeoutMs = 5000): Promise<TraceResult | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${TRACE_SERVICE_URL}/trace/python`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, timeout_ms: timeoutMs }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const traceJs = useCallback(async (code: string, timeoutMs = 5000): Promise<TraceResult | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${TRACE_SERVICE_URL}/trace/js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, timeout_ms: timeoutMs }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${TRACE_SERVICE_URL}/health`)
      return res.ok
    } catch {
      return false
    }
  }, [])

  return { isLoading, error, tracePython, traceJs, checkHealth }
}
