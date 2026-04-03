import { render, screen } from '@testing-library/react'
import { TaskNode } from './TaskNode'
import type { TaskSpec } from '../../../shared/orchestration'

const baseTask: TaskSpec = {
  id: 'task-1',
  title: 'Analyze codebase',
  description: 'Scan all source files',
  dependencies: [],
  status: 'pending',
}

describe('TaskNode', () => {
  it('renders task title', () => {
    render(<TaskNode task={baseTask} />)
    expect(screen.getByText('Analyze codebase')).toBeInTheDocument()
  })

  it('renders task description', () => {
    render(<TaskNode task={baseTask} />)
    expect(screen.getByText('Scan all source files')).toBeInTheDocument()
  })

  it('renders result when present', () => {
    const task: TaskSpec = { ...baseTask, status: 'completed', result: 'Found 42 issues' }
    render(<TaskNode task={task} />)
    expect(screen.getByText('Found 42 issues')).toBeInTheDocument()
  })

  it('renders error when present', () => {
    const task: TaskSpec = { ...baseTask, status: 'failed', error: 'Connection refused' }
    render(<TaskNode task={task} />)
    expect(screen.getByText('Connection refused')).toBeInTheDocument()
  })

  it('applies green background for completed status', () => {
    const task: TaskSpec = { ...baseTask, status: 'completed' }
    const { container } = render(<TaskNode task={task} />)
    expect(container.querySelector('.bg-green-500\\/10')).not.toBeNull()
  })

  it('applies red background for failed status', () => {
    const task: TaskSpec = { ...baseTask, status: 'failed' }
    const { container } = render(<TaskNode task={task} />)
    expect(container.querySelector('.bg-red-500\\/10')).not.toBeNull()
  })
})
