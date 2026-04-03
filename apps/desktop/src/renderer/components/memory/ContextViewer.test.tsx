import { render, screen } from '@testing-library/react'
import { ContextViewer } from './ContextViewer'
import type { ContextSummary } from '../../../shared/conversationMemory'

const summary: ContextSummary = {
  query: 'How does Tailwind v4 work?',
  relevant_memories: [
    { id: 'm1', text: 'memory one', tags: [], relevance_score: 0.9, timestamp: '' },
    { id: 'm2', text: 'memory two', tags: [], relevance_score: 0.8, timestamp: '' },
  ],
  compressed_context: 'User is working on a Tailwind v4 project with CSS @theme tokens.',
  token_estimate: 512,
}

const emptySummary: ContextSummary = {
  query: 'empty query',
  relevant_memories: [],
  compressed_context: '',
  token_estimate: 0,
}

describe('ContextViewer', () => {
  it('renders the query text', () => {
    render(<ContextViewer summary={summary} />)
    expect(screen.getByText(`Context for: "${summary.query}"`)).toBeInTheDocument()
  })

  it('renders token estimate', () => {
    render(<ContextViewer summary={summary} />)
    expect(screen.getByText('~512 tokens')).toBeInTheDocument()
  })

  it('renders compressed context', () => {
    render(<ContextViewer summary={summary} />)
    expect(screen.getByText(summary.compressed_context)).toBeInTheDocument()
  })

  it('renders relevant memory count', () => {
    render(<ContextViewer summary={summary} />)
    expect(screen.getByText('2 relevant memories')).toBeInTheDocument()
  })

  it('shows (empty) for empty compressed context', () => {
    render(<ContextViewer summary={emptySummary} />)
    expect(screen.getByText('(empty)')).toBeInTheDocument()
  })

  it('shows 0 relevant memories for empty summary', () => {
    render(<ContextViewer summary={emptySummary} />)
    expect(screen.getByText('0 relevant memories')).toBeInTheDocument()
  })
})
