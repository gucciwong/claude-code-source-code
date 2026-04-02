import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OrgIntelligence } from './OrgIntelligence'
import { useOrgIntelligenceStore } from '../store/orgIntelligenceStore'
import type { SharedPattern, SkillGapReport } from '../../../shared/orgIntelligence'

vi.mock('../hooks/useOrgIntelligence', () => ({
  useOrgIntelligence: () => ({
    listPatterns: vi.fn().mockResolvedValue([]),
    searchPatterns: vi.fn().mockResolvedValue([]),
    getSkillGaps: vi.fn().mockResolvedValue(null),
    getBottlenecks: vi.fn().mockResolvedValue([]),
    contributePattern: vi.fn().mockResolvedValue(null),
  }),
}))

const makePattern = (id: string): SharedPattern => ({
  id,
  language: 'python',
  pattern_text: `def pattern_${id}(): pass`,
  contributor_count: 1,
  usage_count: 0,
  created_at: 1000,
})

const makeReport = (): SkillGapReport => ({
  gaps: [{ topic: 'error_handling', adoption_rate: 0.2, recommended_patterns: [] }],
  generated_at: 1000,
})

beforeEach(() => {
  useOrgIntelligenceStore.setState({
    sharedPatterns: [],
    skillGapReport: null,
    bottlenecks: [],
    searchResults: [],
    isLoading: false,
    error: null,
  })
})

it('renders heading "Org Intelligence"', () => {
  render(<OrgIntelligence />)
  expect(screen.getByRole('heading', { name: /org intelligence/i })).toBeInTheDocument()
})

it('renders Patterns tab trigger', () => {
  render(<OrgIntelligence />)
  expect(screen.getByRole('tab', { name: /patterns/i })).toBeInTheDocument()
})

it('renders Skill Gaps tab trigger', () => {
  render(<OrgIntelligence />)
  expect(screen.getByRole('tab', { name: /skill gaps/i })).toBeInTheDocument()
})

it('renders Bottlenecks tab trigger', () => {
  render(<OrgIntelligence />)
  expect(screen.getByRole('tab', { name: /bottlenecks/i })).toBeInTheDocument()
})

it('renders contribute button', () => {
  render(<OrgIntelligence />)
  expect(screen.getByRole('button', { name: /contribute pattern/i })).toBeInTheDocument()
})

it('shows "No patterns yet" when store is empty', () => {
  render(<OrgIntelligence />)
  expect(screen.getByText(/no patterns yet/i)).toBeInTheDocument()
})

it('renders pattern cards when patterns exist', () => {
  useOrgIntelligenceStore.setState({ sharedPatterns: [makePattern('a'), makePattern('b')] })
  render(<OrgIntelligence />)
  expect(screen.getByText('def pattern_a(): pass')).toBeInTheDocument()
  expect(screen.getByText('def pattern_b(): pass')).toBeInTheDocument()
})

it('renders SkillGapChart when report exists in store', async () => {
  const user = userEvent.setup()
  useOrgIntelligenceStore.setState({ skillGapReport: makeReport() })
  render(<OrgIntelligence />)
  // Switch to skill-gaps tab to see the chart content
  await user.click(screen.getByRole('tab', { name: /skill gaps/i }))
  // SkillGapChart renders gap topics
  expect(screen.getByText(/error handling/i)).toBeInTheDocument()
})
