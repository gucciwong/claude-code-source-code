import { describe, it, expect, beforeEach } from 'vitest'
import { useFederationCoreStore } from './federationCoreStore'
import type { PeerInfo, FederationRound } from '../../../shared/federationCore'

const mockPeer: PeerInfo = { peer_id: 'p1', address: 'localhost:5001', data_size: 100 }
const mockRound: FederationRound = {
  round_id: 'round-uuid-1',
  status: 'collecting',
  participating_peers: ['p1'],
  submitted_peers: [],
  aggregated_gradients: null,
  dp_noise_applied: false,
}

describe('federationCoreStore', () => {
  beforeEach(() => {
    useFederationCoreStore.setState({
      peers: [],
      currentRound: null,
      roundHistory: [],
      isLoading: false,
      error: null,
    })
  })

  it('initial state: empty peers, null currentRound, empty roundHistory, false isLoading, null error', () => {
    const state = useFederationCoreStore.getState()
    expect(state.peers).toEqual([])
    expect(state.currentRound).toBeNull()
    expect(state.roundHistory).toEqual([])
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('setPeers replaces peers', () => {
    useFederationCoreStore.getState().setPeers([mockPeer])
    expect(useFederationCoreStore.getState().peers).toEqual([mockPeer])
  })

  it('addPeer appends peer', () => {
    const peer2: PeerInfo = { peer_id: 'p2', address: 'localhost:5002', data_size: 200 }
    useFederationCoreStore.getState().setPeers([mockPeer])
    useFederationCoreStore.getState().addPeer(peer2)
    expect(useFederationCoreStore.getState().peers).toHaveLength(2)
    expect(useFederationCoreStore.getState().peers[1]).toEqual(peer2)
  })

  it('removePeer filters out peer by peer_id', () => {
    useFederationCoreStore.getState().setPeers([mockPeer])
    useFederationCoreStore.getState().removePeer('p1')
    expect(useFederationCoreStore.getState().peers).toHaveLength(0)
  })

  it('setCurrentRound updates currentRound', () => {
    useFederationCoreStore.getState().setCurrentRound(mockRound)
    expect(useFederationCoreStore.getState().currentRound).toEqual(mockRound)
  })

  it('setRoundHistory updates roundHistory', () => {
    useFederationCoreStore.getState().setRoundHistory([mockRound])
    expect(useFederationCoreStore.getState().roundHistory).toEqual([mockRound])
  })

  it('setLoading updates isLoading', () => {
    useFederationCoreStore.getState().setLoading(true)
    expect(useFederationCoreStore.getState().isLoading).toBe(true)
  })

  it('setError updates error', () => {
    useFederationCoreStore.getState().setError('network error')
    expect(useFederationCoreStore.getState().error).toBe('network error')
  })
})
