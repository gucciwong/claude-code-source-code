import { useCallback } from 'react'
import { useMessagingStore } from '../store/messagingStore'
import type { PlatformConfig, PlatformStatus, MessageLogEntry } from '../../shared/messaging'

const BASE_URL = 'http://localhost:8010'

export function useMessaging() {
  const { setPlatforms, setLoading, setError, addLogEntry } = useMessagingStore()

  const configurePlatform = useCallback(
    async (config: PlatformConfig): Promise<boolean> => {
      try {
        const res = await fetch(`${BASE_URL}/platforms/configure`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        })
        return res.ok
      } catch {
        return false
      }
    },
    []
  )

  const listPlatforms = useCallback(async (): Promise<PlatformStatus[]> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/platforms`)
      if (!res.ok) throw new Error('Failed to fetch platforms')
      const data: PlatformStatus[] = await res.json()
      const withStatus = data.map(p => ({
        ...p,
        connected: !!(p.bot_token || p.webhook_url),
      }))
      setPlatforms(withStatus)
      return withStatus
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return []
    } finally {
      setLoading(false)
    }
  }, [setPlatforms, setLoading, setError])

  const removePlatform = useCallback(async (platform: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/platforms/${platform}`, { method: 'DELETE' })
      return res.ok
    } catch {
      return false
    }
  }, [])

  const fetchMessageLog = useCallback(async (): Promise<MessageLogEntry[]> => {
    try {
      const res = await fetch(`${BASE_URL}/messages/log`)
      if (!res.ok) return []
      return (await res.json()) as MessageLogEntry[]
    } catch {
      return []
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

  return { configurePlatform, listPlatforms, removePlatform, fetchMessageLog, checkHealth }
}
