import { render, screen } from '@testing-library/react'
import { RoundStatusCard } from './RoundStatusCard'
import type { FederationRound } from '../../../shared/federationCore'

const round: FederationRound = {
  round_id: 'abcdef1234567890',
  status: 'collecting',
  participating_peers: ['p1', 'p2', 'p3'],
  submitted_peers: ['p1'],
  aggregated_gradients: null,
  dp_noise_applied: false,
}

describe('RoundStatusCard', () => {
  it('renders round ID (first 8 chars)', () => {
    render(<RoundStatusCard round={round} />)
    expect(screen.getByText(/Round abcdef12/)).toBeInTheDocument()
  })

  it('shows status label', () => {
    render(<RoundStatusCard round={round} />)
    expect(screen.getByText('collecting')).toBeInTheDocument()
  })

  it('renders submitted/total peer count', () => {
    render(<RoundStatusCard round={round} />)
    expect(screen.getByText('1/3')).toBeInTheDocument()
  })

  it('shows complete status with checkmark', () => {
    const complete: FederationRound = { ...round, status: 'complete', submitted_peers: ['p1', 'p2', 'p3'] }
    render(<RoundStatusCard round={complete} />)
    expect(screen.getByText('complete')).toBeInTheDocument()
    expect(screen.getByText('3/3')).toBeInTheDocument()
  })

  it('shows DP noise message when dp_noise_applied is true', () => {
    const dp: FederationRound = { ...round, dp_noise_applied: true }
    render(<RoundStatusCard round={dp} />)
    expect(screen.getByText(/DP noise applied/)).toBeInTheDocument()
  })

  it('does not show DP noise message when dp_noise_applied is false', () => {
    render(<RoundStatusCard round={round} />)
    expect(screen.queryByText(/DP noise applied/)).not.toBeInTheDocument()
  })

  it('shows aggregated gradients message', () => {
    const agg: FederationRound = { ...round, aggregated_gradients: [0.1, 0.2, 0.3] }
    render(<RoundStatusCard round={agg} />)
    expect(screen.getByText(/Aggregated: 3 gradient/)).toBeInTheDocument()
  })
})
