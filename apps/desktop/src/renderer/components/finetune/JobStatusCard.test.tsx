import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JobStatusCard } from './JobStatusCard'
import type { FinetuneJob } from '../../../shared/finetuning'

const baseJob: FinetuneJob = {
  job_id: 'abcdef1234567890',
  config: {},
  status: 'running',
  progress: 0.45,
  current_epoch: 2,
  total_epochs: 5,
  loss_history: [1.2, 0.9, 0.7],
  created_at: '2024-01-01T00:00:00Z',
  completed_at: null,
}

describe('JobStatusCard', () => {
  it('shows truncated job id (first 8 chars)', () => {
    render(<JobStatusCard job={baseJob} />)
    expect(screen.getByText('abcdef12')).toBeInTheDocument()
  })

  it('shows job status text', () => {
    render(<JobStatusCard job={baseJob} />)
    expect(screen.getByText('running')).toBeInTheDocument()
  })

  it('shows progress percentage', () => {
    render(<JobStatusCard job={baseJob} />)
    expect(screen.getByText('45%')).toBeInTheDocument()
  })

  it('shows epoch progress text', () => {
    render(<JobStatusCard job={baseJob} />)
    expect(screen.getByText(/Epoch 2\/5/)).toBeInTheDocument()
  })

  it('shows Stop button when status is running and onStop provided', () => {
    const onStop = vi.fn()
    render(<JobStatusCard job={baseJob} onStop={onStop} />)
    expect(screen.getByRole('button', { name: 'Stop fine-tune job' })).toBeInTheDocument()
  })

  it('calls onStop with job_id when Stop is clicked', async () => {
    const onStop = vi.fn()
    render(<JobStatusCard job={baseJob} onStop={onStop} />)
    await userEvent.click(screen.getByRole('button', { name: 'Stop fine-tune job' }))
    expect(onStop).toHaveBeenCalledWith('abcdef1234567890')
  })

  it('hides Stop button when status is complete', () => {
    const completedJob: FinetuneJob = { ...baseJob, status: 'complete', completed_at: '2024-01-02T00:00:00Z' }
    render(<JobStatusCard job={completedJob} />)
    expect(screen.queryByRole('button', { name: 'Stop fine-tune job' })).not.toBeInTheDocument()
  })

  it('hides Stop button when status is running but no onStop provided', () => {
    render(<JobStatusCard job={baseJob} />)
    expect(screen.queryByRole('button', { name: 'Stop fine-tune job' })).not.toBeInTheDocument()
  })
})
