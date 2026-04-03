import { render, screen } from '@testing-library/react'
import { CheckpointTable } from './CheckpointTable'
import type { Checkpoint } from '../../../shared/finetuning'

const checkpoints: Checkpoint[] = [
  { name: 'checkpoint-001', epoch: 1, loss: 1.234, path: '/models/ckpt-001' },
  { name: 'checkpoint-002', epoch: 2, loss: 0.876, path: '/models/ckpt-002' },
]

describe('CheckpointTable', () => {
  it('shows empty state when no checkpoints', () => {
    render(<CheckpointTable checkpoints={[]} />)
    expect(screen.getByText('No checkpoints yet.')).toBeInTheDocument()
  })

  it('renders table headers', () => {
    render(<CheckpointTable checkpoints={checkpoints} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Epoch')).toBeInTheDocument()
    expect(screen.getByText('Loss')).toBeInTheDocument()
    expect(screen.getByText('Path')).toBeInTheDocument()
  })

  it('renders checkpoint names', () => {
    render(<CheckpointTable checkpoints={checkpoints} />)
    expect(screen.getByText('checkpoint-001')).toBeInTheDocument()
    expect(screen.getByText('checkpoint-002')).toBeInTheDocument()
  })

  it('renders epoch numbers', () => {
    render(<CheckpointTable checkpoints={checkpoints} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders loss formatted to 3 decimal places', () => {
    render(<CheckpointTable checkpoints={checkpoints} />)
    expect(screen.getByText('1.234')).toBeInTheDocument()
    expect(screen.getByText('0.876')).toBeInTheDocument()
  })

  it('renders checkpoint paths', () => {
    render(<CheckpointTable checkpoints={checkpoints} />)
    expect(screen.getByText('/models/ckpt-001')).toBeInTheDocument()
    expect(screen.getByText('/models/ckpt-002')).toBeInTheDocument()
  })
})
