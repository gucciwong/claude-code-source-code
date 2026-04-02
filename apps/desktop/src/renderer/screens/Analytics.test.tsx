import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Analytics } from './Analytics'
import { useAnalyticsStore } from '../store/analyticsStore'
import type { AnalyticsReport } from '../../shared/analytics'

// Mock useAnalytics hook so tests don't actually fetch
vi.mock('../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    fetchReport: vi.fn().mockResolvedValue(null),
    ingestEvent: vi.fn(),
    exportReport: vi.fn(),
  }),
}))

const mockReport: AnalyticsReport = {
  generated_at: 1000000,
  total_events: 10,
  productivity: {
    total_sessions: 8,
    total_tokens: 4000,
    avg_tokens_per_session: 500,
    total_code_reviews: 4,
    total_training_runs: 2,
    acceptance_rate: 0.85,
  },
  quality_trends: [
    { date_label: '2026-04-01', avg_quality_score: 0.9, pattern_count: 3 },
  ],
  training_roi: {
    total_training_runs: 2,
    avg_improvement_pct: 18.0,
    time_saved_hours: 2.1,
    estimated_roi_multiplier: 1.9,
  },
}

describe('Analytics screen', () => {
  beforeEach(() => {
    useAnalyticsStore.setState({ report: null, isLoading: false, error: null })
  })

  it('renders heading "Analytics"', () => {
    render(<Analytics />)
    expect(screen.getByRole('heading', { name: /Analytics/i })).toBeInTheDocument()
  })

  it('renders Productivity tab trigger', () => {
    render(<Analytics />)
    expect(screen.getByRole('tab', { name: /productivity/i })).toBeInTheDocument()
  })

  it('renders Quality tab trigger', () => {
    render(<Analytics />)
    expect(screen.getByRole('tab', { name: /quality/i })).toBeInTheDocument()
  })

  it('renders Training ROI tab trigger', () => {
    render(<Analytics />)
    expect(screen.getByRole('tab', { name: /training roi/i })).toBeInTheDocument()
  })

  it('renders Export tab trigger', () => {
    render(<Analytics />)
    expect(screen.getByRole('tab', { name: /export/i })).toBeInTheDocument()
  })

  it('renders Refresh button', () => {
    render(<Analytics />)
    expect(screen.getByRole('button', { name: /refresh analytics/i })).toBeInTheDocument()
  })

  it('shows loading state when isLoading is true', () => {
    useAnalyticsStore.setState({ isLoading: true, report: null, error: null })
    render(<Analytics />)
    expect(screen.getByText(/loading metrics/i)).toBeInTheDocument()
  })

  it('renders metric cards when productivity report exists', () => {
    useAnalyticsStore.setState({ report: mockReport, isLoading: false, error: null })
    render(<Analytics />)
    expect(screen.getByText('Total Sessions')).toBeInTheDocument()
    expect(screen.getByText('Total Tokens')).toBeInTheDocument()
    expect(screen.getByText('Acceptance Rate')).toBeInTheDocument()
  })
})
