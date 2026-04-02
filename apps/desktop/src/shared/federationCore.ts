export interface PeerInfo {
  peer_id: string
  address: string
  data_size: number
}

export interface FederationRound {
  round_id: string
  status: 'collecting' | 'aggregating' | 'complete'
  participating_peers: string[]
  submitted_peers: string[]
  aggregated_gradients: number[] | null
  dp_noise_applied: boolean
}

export interface GradientUpdate {
  peer_id: string
  round_id: string
  gradients: number[]
  data_size: number
}
