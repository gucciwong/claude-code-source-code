import { render, screen } from '@testing-library/react'
import { DecisionLog } from './DecisionLog'
import type { Decision } from '../../../shared/knowledge'

const decision: Decision = {
  id: 'dec-001',
  summary: 'Use Tailwind v4 for desktop app',
  rationale: 'Modern CSS variables approach aligns with our token system.',
  alternatives: ['Vanilla CSS', 'Styled Components'],
  outcome: 'Implemented successfully across all screens.',
  timestamp: new Date('2024-03-01T12:00:00').getTime(),
  projectPath: '/projects/desktop',
}

const noOutcomeDecision: Decision = {
  id: 'dec-002',
  summary: 'Adopt Zustand for state',
  rationale: 'Lightweight and simple API.',
  alternatives: [],
  outcome: '',
  timestamp: Date.now(),
  projectPath: '/projects/desktop',
}

describe('DecisionLog', () => {
  it('shows empty state when no decisions', () => {
    render(<DecisionLog decisions={[]} />)
    expect(screen.getByText('No decisions logged yet.')).toBeInTheDocument()
  })

  it('renders decision summary', () => {
    render(<DecisionLog decisions={[decision]} />)
    expect(screen.getByText(decision.summary)).toBeInTheDocument()
  })

  it('renders decision rationale', () => {
    render(<DecisionLog decisions={[decision]} />)
    expect(screen.getByText(decision.rationale)).toBeInTheDocument()
  })

  it('renders outcome when present', () => {
    render(<DecisionLog decisions={[decision]} />)
    expect(screen.getByText(`Outcome: ${decision.outcome}`)).toBeInTheDocument()
  })

  it('does not render outcome label when outcome is empty', () => {
    render(<DecisionLog decisions={[noOutcomeDecision]} />)
    expect(screen.queryByText(/^Outcome:/)).not.toBeInTheDocument()
  })

  it('renders alternatives as tags', () => {
    render(<DecisionLog decisions={[decision]} />)
    expect(screen.getByText('Vanilla CSS')).toBeInTheDocument()
    expect(screen.getByText('Styled Components')).toBeInTheDocument()
  })
})
