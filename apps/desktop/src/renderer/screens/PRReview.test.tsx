import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { PRReview } from './PRReview'
import { usePRReviewStore } from '../store/prReviewStore'
import type { ReviewResult, ReviewRule } from '../../shared/prReview'

// Mock the hook to avoid actual fetch calls
vi.mock('../hooks/usePRReview', () => ({
  usePRReview: () => ({
    reviewDiff: vi.fn(),
    fetchRules: vi.fn().mockResolvedValue([]),
  }),
}))

const makeResult = (): ReviewResult => ({
  summary: { total_files: 1, total_changes: 3, errors: 0, warnings: 1, infos: 0, score: 95 },
  comments: [],
  approved: true,
})

const makeRules = (): ReviewRule[] => [
  { id: 'no_print_statements', severity: 'warning', message: 'Avoid print statements.' },
  { id: 'no_todo_fixme', severity: 'info', message: 'Track TODOs in issues.' },
]

describe('PRReview screen', () => {
  beforeEach(() => {
    usePRReviewStore.setState({
      result: null,
      rules: [],
      diff: '',
      isReviewing: false,
      error: null,
    })
  })

  it('renders heading "PR Review Agent"', () => {
    render(<PRReview />)
    expect(screen.getByText('PR Review Agent')).toBeInTheDocument()
  })

  it('renders "PR Review Agent" heading text as h1', () => {
    render(<PRReview />)
    const heading = screen.getByRole('heading', { name: 'PR Review Agent' })
    expect(heading).toBeInTheDocument()
  })

  it('renders Run Review button', () => {
    render(<PRReview />)
    expect(screen.getByRole('button', { name: /run review/i })).toBeInTheDocument()
  })

  it('renders diff textarea with correct aria-label', () => {
    render(<PRReview />)
    expect(screen.getByRole('textbox', { name: 'Git diff input' })).toBeInTheDocument()
  })

  it('renders tabs: Review, Rules, History', () => {
    render(<PRReview />)
    expect(screen.getByRole('tab', { name: 'Review' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Rules' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'History' })).toBeInTheDocument()
  })

  it('shows ReviewSummaryCard when result is available', () => {
    usePRReviewStore.setState({ result: makeResult() })
    render(<PRReview />)
    expect(screen.getByText('Approved')).toBeInTheDocument()
    expect(screen.getByText('Score: 95/100')).toBeInTheDocument()
  })

  it('renders rules count when rules are loaded', async () => {
    usePRReviewStore.setState({ rules: makeRules() })
    render(<PRReview />)
    await userEvent.click(screen.getByRole('tab', { name: 'Rules' }))
    expect(screen.getByText('Active Rules (2)')).toBeInTheDocument()
  })
})
