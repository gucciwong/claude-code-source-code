import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgentCard } from './AgentCard'
import type { OrchestratorSession, TaskSpec } from '../../../shared/orchestration'

const tasks: TaskSpec[] = [
  { id: 't1', title: 'T1', description: 'D1', dependencies: [], status: 'completed' },
  { id: 't2', title: 'T2', description: 'D2', dependencies: [], status: 'running' },
]

const session: OrchestratorSession = {
  id: 'sess-1',
  goal: 'Optimize the pipeline',
  context: '',
  tasks,
  status: 'running',
  created_at: 1700000000,
}

describe('AgentCard', () => {
  it('renders session goal', () => {
    render(<AgentCard session={session} />)
    expect(screen.getByText('Optimize the pipeline')).toBeInTheDocument()
  })

  it('renders status and task count', () => {
    render(<AgentCard session={session} />)
    expect(screen.getByText('Running · 2 tasks')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<AgentCard session={session} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('sets aria-pressed to true when active', () => {
    render(<AgentCard session={session} isActive={true} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('sets aria-pressed to false when not active', () => {
    render(<AgentCard session={session} isActive={false} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })
})
