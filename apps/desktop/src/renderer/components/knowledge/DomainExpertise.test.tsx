import { render, screen } from '@testing-library/react'
import { DomainExpertise } from './DomainExpertise'
import type { DomainStat } from '../../../shared/knowledge'

const domains: DomainStat[] = [
  { domain: 'backend', language: 'typescript', count: 42 },
  { domain: 'frontend', language: 'typescript', count: 18 },
]

describe('DomainExpertise', () => {
  it('shows empty state when no domains', () => {
    render(<DomainExpertise domains={[]} />)
    expect(screen.getByText('No domain expertise tracked yet.')).toBeInTheDocument()
  })

  it('renders domain names', () => {
    render(<DomainExpertise domains={domains} />)
    expect(screen.getByText('backend')).toBeInTheDocument()
    expect(screen.getByText('frontend')).toBeInTheDocument()
  })

  it('renders domain counts', () => {
    render(<DomainExpertise domains={domains} />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('18')).toBeInTheDocument()
  })

  it('renders a bar per domain', () => {
    const { container } = render(<DomainExpertise domains={domains} />)
    const bars = container.querySelectorAll('.bg-accent-500.rounded-full.h-1\\.5')
    expect(bars.length).toBe(2)
  })
})
