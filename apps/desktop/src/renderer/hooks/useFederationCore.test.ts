import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFederationCore } from './useFederationCore'
import { useFederationCoreStore } from '../store/federationCoreStore'
import type { PeerInfo, FederationRound } from '../../../shared/federationCore'

const mockPeer: PeerInfo = { peer_id: 'p1', address: 'localhost:5001', data_size: 100 }
const mockRound: FederationRound = {
  round_id: 'r1',
  status: 'collecting',
  participating_peers: ['p1'],
  submitted_peers: [],
  aggregated_gradients: null,
  dp_noise_applied: false,
}

function makeFetch(ok: boolean, data: unknown) {
  return vi.fn().mockResolvedValue({ ok, json: async () => data })
}

describe('useFederationCore', () => {
  beforeEach(() => {
    useFederationCoreStore.setState({
      peers: [],
      currentRound: null,
      roundHistory: [],
      isLoading: false,
      error: null,
    })
  })

  it('fetchPeers calls GET /peers and calls setPeers', async () => {
    vi.stubGlobal('fetch', makeFetch(true, [mockPeer]))
    const { result } = renderHook(() => useFederationCore())
    await act(async () => { await result.current.fetchPeers() })
    expect(fetch).toHaveBeenCalledWith('http://localhost:8008/peers')
    expect(useFederationCoreStore.getState().peers).toEqual([mockPeer])
    vi.unstubAllGlobals()
  })

  it('fetchPeers returns empty array on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    const { result } = renderHook(() => useFederationCore())
    let peers: PeerInfo[] = []
    await act(async () => { peers = await result.current.fetchPeers() })
    expect(peers).toEqual([])
    vi.unstubAllGlobals()
  })

  it('registerPeer POSTs to /peers/register and calls addPeer on 200', async () => {
    vi.stubGlobal('fetch', makeFetch(true, { status: 'ok', peer_id: 'p1' }))
    const { result } = renderHook(() => useFederationCore())
    let ok = false
    await act(async () => { ok = await result.current.registerPeer(mockPeer) })
    expect(ok).toBe(true)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8008/peers/register',
      expect.objectContaining({ method: 'POST' })
    )
    expect(useFederationCoreStore.getState().peers).toContainEqual(mockPeer)
    vi.unstubAllGlobals()
  })

  it('registerPeer returns false on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')))
    const { result } = renderHook(() => useFederationCore())
    let ok = true
    await act(async () => { ok = await result.current.registerPeer(mockPeer) })
    expect(ok).toBe(false)
    vi.unstubAllGlobals()
  })

  it('unregisterPeer sends DELETE to /peers/{id}', async () => {
    vi.stubGlobal('fetch', makeFetch(true, { status: 'ok' }))
    useFederationCoreStore.getState().setPeers([mockPeer])
    const { result } = renderHook(() => useFederationCore())
    await act(async () => { await result.current.unregisterPeer('p1') })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8008/peers/p1',
      expect.objectContaining({ method: 'DELETE' })
    )
    expect(useFederationCoreStore.getState().peers).toHaveLength(0)
    vi.unstubAllGlobals()
  })

  it('startRound POSTs to /rounds/start and calls setCurrentRound', async () => {
    vi.stubGlobal('fetch', makeFetch(true, mockRound))
    const { result } = renderHook(() => useFederationCore())
    let round: FederationRound | null = null
    await act(async () => { round = await result.current.startRound() })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8008/rounds/start',
      expect.objectContaining({ method: 'POST' })
    )
    expect(round).toEqual(mockRound)
    expect(useFederationCoreStore.getState().currentRound).toEqual(mockRound)
    vi.unstubAllGlobals()
  })

  it('startRound returns null on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')))
    const { result } = renderHook(() => useFederationCore())
    let round: FederationRound | null = mockRound
    await act(async () => { round = await result.current.startRound() })
    expect(round).toBeNull()
    vi.unstubAllGlobals()
  })

  it('fetchHistory calls GET /rounds/history and calls setRoundHistory', async () => {
    vi.stubGlobal('fetch', makeFetch(true, [mockRound]))
    const { result } = renderHook(() => useFederationCore())
    await act(async () => { await result.current.fetchHistory() })
    expect(fetch).toHaveBeenCalledWith('http://localhost:8008/rounds/history')
    expect(useFederationCoreStore.getState().roundHistory).toEqual([mockRound])
    vi.unstubAllGlobals()
  })
})
