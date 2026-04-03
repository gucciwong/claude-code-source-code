import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Federation } from './Federation'
import { useFederationCoreStore } from '../store/federationCoreStore'
import * as useFederationCoreHook from '../hooks/useFederationCore'

vi.mock('../hooks/useFederationCore', () => ({
  useFederationCore: vi.fn(),
}))

const mockHook = {
  fetchPeers: vi.fn().mockResolvedValue([]),
  registerPeer: vi.fn().mockResolvedValue(true),
  unregisterPeer: vi.fn().mockResolvedValue(true),
  startRound: vi.fn().mockResolvedValue(null),
  fetchHistory: vi.fn().mockResolvedValue([]),
}

describe('Federation Screen', () => {
  beforeEach(() => {
    vi.mocked(useFederationCoreHook.useFederationCore).mockReturnValue(mockHook)
    useFederationCoreStore.setState({
      peers: [],
      currentRound: null,
      roundHistory: [],
      isLoading: false,
      error: null,
    })
  })

  it('renders "Federated Learning Core" heading', () => {
    render(<Federation />)
    expect(screen.getByText('Federated Learning Core')).toBeInTheDocument()
  })

  it('renders description mentioning Federated Averaging or Differential Privacy', () => {
    render(<Federation />)
    expect(screen.getByText(/Federated Averaging|Differential Privacy/i)).toBeInTheDocument()
  })

  it('renders Peers tab', () => {
    render(<Federation />)
    expect(screen.getByRole('tab', { name: /peers/i })).toBeInTheDocument()
  })

  it('renders Current Round tab', () => {
    render(<Federation />)
    expect(screen.getByRole('tab', { name: /current round/i })).toBeInTheDocument()
  })

  it('renders History tab', () => {
    render(<Federation />)
    expect(screen.getByRole('tab', { name: /history/i })).toBeInTheDocument()
  })

  it('renders peer ID input', () => {
    render(<Federation />)
    expect(screen.getByLabelText('New peer ID')).toBeInTheDocument()
  })

  it('renders Start Federated Round button', async () => {
    const user = userEvent.setup()
    render(<Federation />)
    await user.click(screen.getByRole('tab', { name: /current round/i }))
    expect(screen.getByRole('button', { name: /Start Federated Round/i })).toBeInTheDocument()
  })
})
