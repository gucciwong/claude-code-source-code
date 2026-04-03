import { render, screen } from '@testing-library/react'
import { DecisionTimeline } from './DecisionTimeline'
import type { DecisionNode } from '../../../../shared/enterprise'

const node: DecisionNode = {
  id: 'n1',
  type: 'FeatureAdd',
  summary: 'Add OAuth2 login',
  rationale: 'Required for SSO',
  timestamp: 1700000000,
  commitHash: 'deadbeef1234',
  author: 'bob@example.com',
  filesChanged: ['src/login.ts'],
}

describe('DecisionTimeline', () => {
  it('shows empty state when no nodes', () => {
    render(<DecisionTimeline nodes={[]} />)
    expect(screen.getByText(/No decision nodes/)).toBeInTheDocument()
  })

  it('renders a card for each node', () => {
    render(<DecisionTimeline nodes={[node, { ...node, id: 'n2', summary: 'Another change' }]} />)
    expect(screen.getByText('Add OAuth2 login')).toBeInTheDocument()
    expect(screen.getByText('Another change')).toBeInTheDocument()
  })

  it('renders node type for each provided node', () => {
    render(<DecisionTimeline nodes={[node]} />)
    expect(screen.getByText('FeatureAdd')).toBeInTheDocument()
  })
})
