import { create } from 'zustand'
import type { PeerInfo, FederationRound } from '../../../shared/federationCore'

interface FederationCoreStore {
  peers: PeerInfo[]
  currentRound: FederationRound | null
  roundHistory: FederationRound[]
  isLoading: boolean
  error: string | null
  setPeers: (peers: PeerInfo[]) => void
  addPeer: (peer: PeerInfo) => void
  removePeer: (id: string) => void
  setCurrentRound: (round: FederationRound | null) => void
  setRoundHistory: (rounds: FederationRound[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useFederationCoreStore = create<FederationCoreStore>(set => ({
  peers: [],
  currentRound: null,
  roundHistory: [],
  isLoading: false,
  error: null,
  setPeers: peers => set({ peers }),
  addPeer: peer => set(state => ({ peers: [...state.peers, peer] })),
  removePeer: id => set(state => ({ peers: state.peers.filter(p => p.peer_id !== id) })),
  setCurrentRound: currentRound => set({ currentRound }),
  setRoundHistory: roundHistory => set({ roundHistory }),
  setLoading: isLoading => set({ isLoading }),
  setError: error => set({ error }),
}))
