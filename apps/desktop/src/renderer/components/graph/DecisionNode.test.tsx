import { render, screen } from '@testing-library/react'
import { DecisionNodeCard } from './DecisionNode'
import type { DecisionNode } from '../../../../shared/enterprise'

const node: DecisionNode = {
  id: 'node-1',
  type: 'BugFix',
  summary: 'Fix null pointer in auth handler',
  rationale: 'Prevent crash on missing session token',
  timestamp: 1700000000,
  commitHash: 'abc123def456',
  author: 'alice@example.com',
  filesChanged: ['src/auth.ts'],
}

describe('DecisionNodeCard', () => {
  it('renders node type badge', () => {
    render(<DecisionNodeCard node={node} />)
    expect(screen.getByText('BugFix')).toBeInTheDocument()
  })

  it('renders truncated commit hash (first 7 chars)', () => {
    render(<DecisionNodeCard node={node} />)
    expect(screen.getByText('abc123d')).toBeInTheDocument()
  })

  it('renders summary', () => {
    render(<DecisionNodeCard node={node} />)
    expect(screen.getByText('Fix null pointer in auth handler')).toBeInTheDocument()
  })

  it('renders rationale when present', () => {
    render(<DecisionNodeCard node={node} />)
    expect(screen.getByText('Prevent crash on missing session token')).toBeInTheDocument()
  })

  it('renders author', () => {
    render(<DecisionNodeCard node={node} />)
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
  })

  it('does not render rationale when absent', () => {
    const noRationale: DecisionNode = { ...node, rationale: '' }
    render(<DecisionNodeCard node={noRationale} />)
    const allText = document.body.textContent
    expect(allText).not.toContain('Prevent crash')
  })

  it('renders formatted date from timestamp', () => {
    render(<DecisionNodeCard node={node} />)
    const date = new Date(1700000000 * 1000).toLocaleDateString()
    expect(screen.getByText(date)).toBeInTheDocument()
  })
})
