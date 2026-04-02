import { useCallback } from 'react'
import { useFederationCoreStore } from '../store/federationCoreStore'
import type { PeerInfo, FederationRound, GradientUpdate } from '../../../shared/federationCore'

const BASE_URL = 'http://localhost:8014'

export function useFederationCore() {
  const { setPeers, addPeer, removePeer, setCurrentRound, setRoundHistory, setLoading, setError } =
    useFederationCoreStore()

  const fetchPeers = useCallback(async (): Promise<PeerInfo[]> => {
    try {
      const res = await fetch(`${BASE_URL}/peers`)
      if (!res.ok) return []
      const data: PeerInfo[] = await res.json()
      setPeers(data)
      return data
    } catch {
      return []
    }
  }, [setPeers])

  const registerPeer = useCallback(
    async (peer: PeerInfo): Promise<boolean> => {
      try {
        const res = await fetch(`${BASE_URL}/peers/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(peer),
        })
        if (res.ok) addPeer(peer)
        return res.ok
      } catch {
        return false
      }
    },
    [addPeer],
  )

  const unregisterPeer = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await fetch(`${BASE_URL}/peers/${id}`, { method: 'DELETE' })
        if (res.ok) removePeer(id)
        return res.ok
      } catch {
        return false
      }
    },
    [removePeer],
  )

  const startRound = useCallback(async (): Promise<FederationRound | null> => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/rounds/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      if (!res.ok) return null
      const data: FederationRound = await res.json()
      setCurrentRound(data)
      return data
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
      return null
    } finally {
      setLoading(false)
    }
  }, [setCurrentRound, setLoading, setError])

  const fetchHistory = useCallback(async (): Promise<FederationRound[]> => {
    try {
      const res = await fetch(`${BASE_URL}/rounds/history`)
      if (!res.ok) return []
      const data: FederationRound[] = await res.json()
      setRoundHistory(data)
      return data
    } catch {
      return []
    }
  }, [setRoundHistory])

  return { fetchPeers, registerPeer, unregisterPeer, startRound, fetchHistory }
}
