import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PeerCard } from './PeerCard'
import type { PeerInfo } from '../../../shared/federationCore'

const peer: PeerInfo = {
  peer_id: 'node-abc',
  address: '192.168.1.10:5000',
  data_size: 1500,
}

describe('PeerCard', () => {
  it('renders peer_id', () => {
    render(<PeerCard peer={peer} onRemove={vi.fn()} />)
    expect(screen.getByText('node-abc')).toBeInTheDocument()
  })

  it('renders address and data_size', () => {
    render(<PeerCard peer={peer} onRemove={vi.fn()} />)
    expect(screen.getByText(/192\.168\.1\.10:5000/)).toBeInTheDocument()
    expect(screen.getByText(/1500 samples/)).toBeInTheDocument()
  })

  it('renders remove button with aria-label', () => {
    render(<PeerCard peer={peer} onRemove={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Remove peer node-abc/ })).toBeInTheDocument()
  })

  it('calls onRemove with peer_id when remove button clicked', async () => {
    const onRemove = vi.fn()
    render(<PeerCard peer={peer} onRemove={onRemove} />)
    await userEvent.click(screen.getByRole('button', { name: /Remove peer node-abc/ }))
    expect(onRemove).toHaveBeenCalledWith('node-abc')
  })
})
