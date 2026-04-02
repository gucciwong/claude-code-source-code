import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Finetune } from './Finetune'
import { useFinetuneStore } from '../store/finetuneStore'
import type { FinetuneJob, Checkpoint } from '../../shared/finetuning'

// Mock hooks to avoid fetch calls
vi.mock('../hooks/useFinetune', () => ({
  useFinetune: () => ({
    startJob: vi.fn(),
    fetchJobs: vi.fn().mockResolvedValue([]),
    stopJob: vi.fn(),
    fetchCheckpoints: vi.fn().mockResolvedValue([]),
  }),
}))

const makeJob = (id = 'job-001'): FinetuneJob => ({
  job_id: id,
  config: {},
  status: 'queued',
  progress: 0,
  current_epoch: 0,
  total_epochs: 3,
  loss_history: [],
  created_at: '2026-04-02T00:00:00',
  completed_at: null,
})

const makeCheckpoint = (): Checkpoint => ({
  name: 'ckpt-epoch-3',
  epoch: 3,
  loss: 0.42,
  path: './output/final',
})

describe('Finetune screen', () => {
  beforeEach(() => {
    useFinetuneStore.setState({
      jobs: [],
      checkpoints: [],
      activeJobId: null,
      isLoading: false,
      error: null,
    })
  })

  it('renders heading "Local Model Fine-tuning"', () => {
    render(<Finetune />)
    expect(screen.getByText('Local Model Fine-tuning')).toBeInTheDocument()
  })

  it('renders Configure tab', () => {
    render(<Finetune />)
    expect(screen.getByRole('tab', { name: /configure/i })).toBeInTheDocument()
  })

  it('renders Jobs tab', () => {
    render(<Finetune />)
    expect(screen.getByRole('tab', { name: /jobs/i })).toBeInTheDocument()
  })

  it('renders Checkpoints tab', () => {
    render(<Finetune />)
    expect(screen.getByRole('tab', { name: /checkpoints/i })).toBeInTheDocument()
  })

  it('renders Loss tab', () => {
    render(<Finetune />)
    expect(screen.getByRole('tab', { name: /loss/i })).toBeInTheDocument()
  })

  it('renders Start Fine-tuning button', () => {
    render(<Finetune />)
    expect(screen.getByText('Start Fine-tuning')).toBeInTheDocument()
  })

  it('shows jobs count in Jobs tab label', () => {
    useFinetuneStore.setState({ jobs: [makeJob(), makeJob('job-002')], checkpoints: [], activeJobId: null, isLoading: false, error: null })
    render(<Finetune />)
    expect(screen.getByText(/jobs \(2\)/i)).toBeInTheDocument()
  })

  it('shows checkpoints count in Checkpoints tab label', () => {
    useFinetuneStore.setState({ jobs: [], checkpoints: [makeCheckpoint()], activeJobId: null, isLoading: false, error: null })
    render(<Finetune />)
    expect(screen.getByText(/checkpoints \(1\)/i)).toBeInTheDocument()
  })
})
