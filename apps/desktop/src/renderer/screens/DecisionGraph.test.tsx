import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DecisionGraph } from './DecisionGraph'
import { DecisionTimeline } from '../components/graph/DecisionTimeline'
import { DecisionNodeCard } from '../components/graph/DecisionNode'
import { GraphSearchBar } from '../components/graph/GraphSearchBar'
import { useDecisionGraphStore } from '../store/decisionGraphStore'
import { vi } from 'vitest'
import type { DecisionNode } from '../../../shared/enterprise'

const sampleNodes: DecisionNode[] = [
  {
    id: 'n1', type: 'BugFix', summary: 'fix: login crash', rationale: '',
    timestamp: 1712345678, commitHash: 'abc1234567890', author: 'alice@example.com', filesChanged: ['auth.ts'],
  },
  {
    id: 'n2', type: 'FeatureAdd', summary: 'feat: new dashboard', rationale: '',
    timestamp: 1712345700, commitHash: 'def1234567890', author: 'bob@example.com', filesChanged: ['Dashboard.tsx'],
  },
]

beforeEach(() => {
  useDecisionGraphStore.setState({
    nodes: [],
    filteredNodes: [],
    searchQuery: '',
    isLoading: false,
  })
})

test('renders Decision Graph heading', () => {
  render(<DecisionGraph />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Decision Graph')
})

test('renders search bar', () => {
  render(<DecisionGraph />)
  expect(screen.getByRole('searchbox')).toBeInTheDocument()
})

test('shows empty state when no nodes', () => {
  render(<DecisionGraph />)
  expect(screen.getByText(/no decision nodes/i)).toBeInTheDocument()
})

test('renders nodes from store', () => {
  useDecisionGraphStore.setState({ nodes: sampleNodes, filteredNodes: sampleNodes })
  render(<DecisionGraph />)
  expect(screen.getByText('fix: login crash')).toBeInTheDocument()
  expect(screen.getByText('feat: new dashboard')).toBeInTheDocument()
})

test('search filters nodes by summary', async () => {
  const user = userEvent.setup()
  useDecisionGraphStore.setState({ nodes: sampleNodes, filteredNodes: sampleNodes })
  render(<DecisionGraph />)
  await user.type(screen.getByRole('searchbox'), 'login')
  expect(screen.getByText('fix: login crash')).toBeInTheDocument()
  expect(screen.queryByText('feat: new dashboard')).not.toBeInTheDocument()
})

test('search filters nodes by type', async () => {
  const user = userEvent.setup()
  useDecisionGraphStore.setState({ nodes: sampleNodes, filteredNodes: sampleNodes })
  render(<DecisionGraph />)
  await user.type(screen.getByRole('searchbox'), 'bugfix')
  expect(screen.getByText('fix: login crash')).toBeInTheDocument()
  expect(screen.queryByText('feat: new dashboard')).not.toBeInTheDocument()
})

test('empty search resets to all nodes', async () => {
  const user = userEvent.setup()
  useDecisionGraphStore.setState({ nodes: sampleNodes, filteredNodes: sampleNodes })
  render(<DecisionGraph />)
  const input = screen.getByRole('searchbox')
  await user.type(input, 'login')
  await user.clear(input)
  expect(screen.getByText('fix: login crash')).toBeInTheDocument()
  expect(screen.getByText('feat: new dashboard')).toBeInTheDocument()
})

test('DecisionTimeline empty state shows message', () => {
  render(<DecisionTimeline nodes={[]} />)
  expect(screen.getByText(/no decision nodes/i)).toBeInTheDocument()
})

test('DecisionTimeline renders node cards', () => {
  render(<DecisionTimeline nodes={sampleNodes} />)
  expect(screen.getByText('fix: login crash')).toBeInTheDocument()
  expect(screen.getByText('feat: new dashboard')).toBeInTheDocument()
})

test('DecisionNodeCard displays commit hash', () => {
  render(<DecisionNodeCard node={sampleNodes[0]} />)
  expect(screen.getByText('abc1234')).toBeInTheDocument()
})

test('DecisionNodeCard displays type badge', () => {
  render(<DecisionNodeCard node={sampleNodes[0]} />)
  expect(screen.getByText('BugFix')).toBeInTheDocument()
})

test('GraphSearchBar has accessible label', () => {
  render(<GraphSearchBar value="" onChange={vi.fn()} />)
  expect(screen.getByRole('searchbox', { name: /search decision graph/i })).toBeInTheDocument()
})
