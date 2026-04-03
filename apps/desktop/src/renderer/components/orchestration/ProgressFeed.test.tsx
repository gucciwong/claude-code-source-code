import { render, screen } from '@testing-library/react'
import { ProgressFeed } from './ProgressFeed'
import type { OrchestratorSession, TaskSpec } from '../../../shared/orchestration'

const tasks: TaskSpec[] = [
  { id: 't1', title: 'Task One', description: 'Do first thing', dependencies: [], status: 'completed' },
  { id: 't2', title: 'Task Two', description: 'Do second thing', dependencies: [], status: 'running' },
  { id: 't3', title: 'Task Three', description: 'Do third thing', dependencies: [], status: 'pending' },
]

const session: OrchestratorSession = {
  id: 'sess-1',
  goal: 'Refactor everything',
  context: 'Large codebase',
  tasks,
  status: 'running',
  created_at: 1700000000,
}

describe('ProgressFeed', () => {
  it('renders task count header', () => {
    render(<ProgressFeed session={session} />)
    expect(screen.getByText('Tasks (1/3)')).toBeInTheDocument()
  })

  it('renders all task titles', () => {
    render(<ProgressFeed session={session} />)
    expect(screen.getByText('Task One')).toBeInTheDocument()
    expect(screen.getByText('Task Two')).toBeInTheDocument()
    expect(screen.getByText('Task Three')).toBeInTheDocument()
  })
})
