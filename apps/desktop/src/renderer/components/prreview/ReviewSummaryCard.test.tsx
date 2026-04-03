import { render, screen } from '@testing-library/react'
import { ReviewSummaryCard } from './ReviewSummaryCard'
import type { ReviewSummary } from '../../../shared/prReview'

const summary: ReviewSummary = {
  total_files: 5,
  total_changes: 120,
  errors: 2,
  warnings: 4,
  infos: 1,
  score: 78,
}

describe('ReviewSummaryCard', () => {
  it('shows Approved when approved=true', () => {
    render(<ReviewSummaryCard summary={summary} approved={true} />)
    expect(screen.getByText('Approved')).toBeInTheDocument()
  })

  it('shows Changes Required when approved=false', () => {
    render(<ReviewSummaryCard summary={summary} approved={false} />)
    expect(screen.getByText('Changes Required')).toBeInTheDocument()
  })

  it('renders score', () => {
    render(<ReviewSummaryCard summary={summary} approved={true} />)
    expect(screen.getByText('Score: 78/100')).toBeInTheDocument()
  })

  it('renders total files', () => {
    render(<ReviewSummaryCard summary={summary} approved={true} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders error count', () => {
    render(<ReviewSummaryCard summary={summary} approved={false} />)
    const twos = screen.getAllByText('2')
    expect(twos.length).toBeGreaterThan(0)
  })

  it('renders warning count', () => {
    render(<ReviewSummaryCard summary={summary} approved={false} />)
    const fours = screen.getAllByText('4')
    expect(fours.length).toBeGreaterThan(0)
  })
})
