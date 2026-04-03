import { render, screen } from '@testing-library/react'
import { PatternCard } from './PatternCard'
import type { SharedPattern } from '../../../shared/orgIntelligence'

const fixture: SharedPattern = {
  id: 'pat-1',
  language: 'typescript',
  pattern_text: 'const x = 1\nconst y = 2',
  contributor_count: 7,
  usage_count: 42,
  created_at: 1700000000,
}

describe('PatternCard', () => {
  it('renders language badge', () => {
    render(<PatternCard pattern={fixture} />)
    expect(screen.getByText('typescript')).toBeInTheDocument()
  })

  it('renders contributor count', () => {
    render(<PatternCard pattern={fixture} />)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('renders pattern text', () => {
    render(<PatternCard pattern={fixture} />)
    expect(screen.getByText(/const x = 1/)).toBeInTheDocument()
  })
})
