import { useCallback } from 'react'
import { useOrchestrationStore } from '../store/orchestrationStore'
import type { OrchestratorSession, CreateSessionRequest } from '../../shared/orchestration'

const BASE_URL = 'http://localhost:8006'

export function useOrchestration() {
  const { addSession, updateSession, setLoading, setError } = useOrchestrationStore()

  const createSession = useCallback(async (req: CreateSessionRequest): Promise<OrchestratorSession | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const session: OrchestratorSession = await res.json()
      addSession(session)
      return session
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [addSession, setLoading, setError])

  const getSession = useCallback(async (sessionId: string): Promise<OrchestratorSession | null> => {
    try {
      const res = await fetch(`${BASE_URL}/sessions/${sessionId}`)
      if (!res.ok) return null
      const session: OrchestratorSession = await res.json()
      updateSession(session)
      return session
    } catch {
      return null
    }
  }, [updateSession])

  const cancelSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/sessions/${sessionId}`, { method: 'DELETE' })
      return res.ok
    } catch {
      return false
    }
  }, [])

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/health`)
      return res.ok
    } catch {
      return false
    }
  }, [])

  return { createSession, getSession, cancelSession, checkHealth }
}
