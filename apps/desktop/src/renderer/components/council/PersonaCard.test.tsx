import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PersonaCard } from './PersonaCard'
import type { PersonaReview } from '../../../shared/personaCouncil'

const review: PersonaReview = {
  persona_name: 'Security Auditor',
  persona_description: 'Checks for vulnerabilities and security flaws.',
  critiques: [
    { title: 'SQL Injection risk', description: 'Use parameterized queries.', severity: 'critical' },
    { title: 'Missing input validation', description: 'Validate all inputs.', severity: 'warning' },
  ],
  risk_score: 8.0,
}

describe('PersonaCard', () => {
  it('renders persona name', () => {
    render(<PersonaCard review={review} />)
    expect(screen.getByText('Security Auditor')).toBeInTheDocument()
  })

  it('shows critique count subtitle', () => {
    render(<PersonaCard review={review} />)
    expect(screen.getByText(/2 issues/)).toBeInTheDocument()
  })

  it('renders the risk score badge', () => {
    render(<PersonaCard review={review} />)
    expect(screen.getByText(/8\.0/)).toBeInTheDocument()
  })

  it('is expanded by default showing description', () => {
    render(<PersonaCard review={review} />)
    expect(screen.getByText('Checks for vulnerabilities and security flaws.')).toBeInTheDocument()
  })

  it('toggle button has aria-expanded="true" when expanded', () => {
    render(<PersonaCard review={review} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
  })

  it('collapses content when toggle is clicked', async () => {
    render(<PersonaCard review={review} />)
    await userEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('Checks for vulnerabilities and security flaws.')).not.toBeInTheDocument()
  })

  it('shows "issue" singular when one critique', () => {
    const singleCritique: PersonaReview = { ...review, critiques: [review.critiques[0]] }
    render(<PersonaCard review={singleCritique} />)
    expect(screen.getByText(/1 issue$/)).toBeInTheDocument()
  })
})
