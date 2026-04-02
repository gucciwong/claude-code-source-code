import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PersonaCouncil } from './PersonaCouncil'
import { usePersonaCouncilStore } from '../store/personaCouncilStore'
import type { CouncilReport } from '../../shared/personaCouncil'

const mockReport: CouncilReport = {
  session_id: 'sess-1',
  code_snippet: 'x = 1',
  language: 'python',
  reviews: [
    {
      persona_name: 'Security Auditor',
      persona_description: 'Checks security',
      critiques: [],
      risk_score: 0,
    },
    {
      persona_name: 'Performance Engineer',
      persona_description: 'Checks performance',
      critiques: [],
      risk_score: 0,
    },
  ],
  risk_score: { overall: 0, breakdown: { 'Security Auditor': 0, 'Performance Engineer': 0 } },
  consensus_summary: 'NO ISSUES DETECTED',
}

beforeEach(() => {
  usePersonaCouncilStore.setState({
    reports: [],
    activeReport: null,
    isReviewing: false,
    error: null,
  })
})

describe('PersonaCouncil screen', () => {
  it('renders heading "Adversarial Persona Council"', () => {
    render(<PersonaCouncil />)
    expect(screen.getByText('Adversarial Persona Council')).toBeInTheDocument()
  })

  it('renders code textarea', () => {
    render(<PersonaCouncil />)
    expect(screen.getByLabelText('Code to review')).toBeInTheDocument()
  })

  it('renders language select', () => {
    render(<PersonaCouncil />)
    expect(screen.getByLabelText(/language/i) ?? screen.getByRole('combobox')).toBeTruthy()
  })

  it('renders "Review with Council" button', () => {
    render(<PersonaCouncil />)
    expect(screen.getByText('Review with Council')).toBeInTheDocument()
  })

  it('button is disabled when code is empty', () => {
    render(<PersonaCouncil />)
    const button = screen.getByText('Review with Council').closest('button')!
    expect(button).toBeDisabled()
  })

  it('shows "No review yet" when no active report', () => {
    render(<PersonaCouncil />)
    expect(screen.getByText('No review yet')).toBeInTheDocument()
  })

  it('shows ConsensusPanel when activeReport exists in store', () => {
    usePersonaCouncilStore.setState({ activeReport: mockReport })
    render(<PersonaCouncil />)
    expect(screen.getByText('Council Consensus')).toBeInTheDocument()
  })

  it('shows PersonaCard for each review when report has reviews', () => {
    usePersonaCouncilStore.setState({ activeReport: mockReport })
    render(<PersonaCouncil />)
    expect(screen.getByText('Security Auditor')).toBeInTheDocument()
    expect(screen.getByText('Performance Engineer')).toBeInTheDocument()
  })
})
