import { useState, useCallback } from 'react'
import type {
  ConnectorConfig,
  QueryResult,
  SchemaTable,
  EnterpriseContextBlock,
} from '../../../shared/enterprise'

const ENTERPRISE_SERVICE_URL = 'http://localhost:8004'

export function useEnterpriseData() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registerConnector = useCallback(
    async (config: Omit<ConnectorConfig, 'id' | 'createdAt'>): Promise<ConnectorConfig | null> => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`${ENTERPRISE_SERVICE_URL}/connectors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return await res.json()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const listConnectors = useCallback(async (): Promise<ConnectorConfig[]> => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${ENTERPRISE_SERVICE_URL}/connectors`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const removeConnector = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${ENTERPRISE_SERVICE_URL}/connectors/${id}`, { method: 'DELETE' })
      return res.ok
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const queryConnector = useCallback(
    async (id: string, params: Record<string, unknown>): Promise<QueryResult | null> => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`${ENTERPRISE_SERVICE_URL}/connectors/${id}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return await res.json()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const getSchema = useCallback(async (id: string): Promise<SchemaTable[]> => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${ENTERPRISE_SERVICE_URL}/connectors/${id}/schema`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return data.tables ?? []
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const buildContext = useCallback(
    async (prompt: string, connectorIds: string[]): Promise<string> => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`${ENTERPRISE_SERVICE_URL}/context`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, connector_ids: connectorIds }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: EnterpriseContextBlock = await res.json()
        return data.enterprise_context
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
        return ''
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${ENTERPRISE_SERVICE_URL}/health`)
      return res.ok
    } catch {
      return false
    }
  }, [])

  return {
    isLoading,
    error,
    registerConnector,
    listConnectors,
    removeConnector,
    queryConnector,
    getSchema,
    buildContext,
    checkHealth,
  }
}
