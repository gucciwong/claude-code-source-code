import { render, screen } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'
import { Orchestration } from './Orchestration'
import { useOrchestrationStore } from '../store/orchestrationStore'
import type { OrchestratorSession } from '../../shared/orchestration'

vi.mock('../hooks/useOrchestration', () => ({
  useOrchestration: () => ({
    createSession: vi.fn().mockResolvedValue(null),
    getSession: vi.fn().mockResolvedValue(null),
    cancelSession: vi.fn().mockResolvedValue(false),
    checkHealth: vi.fn().mockResolvedValue(true),
  }),
}))

function makeSession(id: string, goal = 'Build a feature'): OrchestratorSession {
  return {
    id,
    goal,
    context: 'some context',
    tasks: [
      { id: 't1', title: 'Task 1', description: 'Do task 1', dependencies: [], status: 'completed', result: 'done' },
    ],
    status: 'completed',
    created_at: 1000,
    merged_result: '## Completed Tasks\n### Task 1\ndone\n',
  }
}

beforeEach(() => {
  useOrchestrationStore.setState({
    sessions: [],
    activeSessionId: null,
    isLoading: false,
    error: null,
  })
})

test('renders heading "Multi-Agent Orchestration"', () => {
  render(<Orchestration />)
  expect(screen.getByRole('heading', { name: /multi-agent orchestration/i })).toBeInTheDocument()
})

test('renders goal textarea', () => {
  render(<Orchestration />)
  expect(screen.getByRole('textbox', { name: /orchestration goal/i })).toBeInTheDocument()
})

test('renders context textarea', () => {
  render(<Orchestration />)
  expect(screen.getByRole('textbox', { name: /orchestration context/i })).toBeInTheDocument()
})

test('Create Session button is disabled when goal is empty', () => {
  render(<Orchestration />)
  const btn = screen.getByRole('button', { name: /create session/i })
  expect(btn).toBeDisabled()
})

test('shows "No sessions yet" when sessions list is empty', () => {
  render(<Orchestration />)
  expect(screen.getByText(/no sessions yet/i)).toBeInTheDocument()
})

test('shows "No session selected" when no active session', () => {
  render(<Orchestration />)
  expect(screen.getByText(/no session selected/i)).toBeInTheDocument()
})

test('renders session list when sessions exist', () => {
  useOrchestrationStore.setState({
    sessions: [makeSession('s1', 'Build a feature'), makeSession('s2', 'Fix a bug')],
    activeSessionId: null,
    isLoading: false,
    error: null,
  })
  render(<Orchestration />)
  expect(screen.getByText('Build a feature')).toBeInTheDocument()
  expect(screen.getByText('Fix a bug')).toBeInTheDocument()
})

test('shows merged result when active session has merged_result', () => {
  const session = makeSession('s1', 'Build a feature')
  useOrchestrationStore.setState({
    sessions: [session],
    activeSessionId: 's1',
    isLoading: false,
    error: null,
  })
  render(<Orchestration />)
  expect(screen.getByText(/merged result/i)).toBeInTheDocument()
})
