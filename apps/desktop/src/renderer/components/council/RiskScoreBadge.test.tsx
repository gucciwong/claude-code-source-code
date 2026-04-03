import { render, screen } from '@testing-library/react'
import { RiskScoreBadge } from './RiskScoreBadge'

describe('RiskScoreBadge', () => {
  it('renders score with one decimal', () => {
    render(<RiskScoreBadge score={5} />)
    expect(screen.getByText(/5\.0/)).toBeInTheDocument()
  })

  it('shows High label for score >= 7', () => {
    render(<RiskScoreBadge score={8.5} />)
    expect(screen.getByText(/High/)).toBeInTheDocument()
  })

  it('shows Medium label for score in 4–6.9', () => {
    render(<RiskScoreBadge score={5.0} />)
    expect(screen.getByText(/Medium/)).toBeInTheDocument()
  })

  it('shows Low label for score > 0 and < 4', () => {
    render(<RiskScoreBadge score={2.3} />)
    expect(screen.getByText(/Low/)).toBeInTheDocument()
  })

  it('shows Clean label for score = 0', () => {
    render(<RiskScoreBadge score={0} />)
    expect(screen.getByText(/Clean/)).toBeInTheDocument()
  })

  it('applies lg size classes when size="lg"', () => {
    const { container } = render(<RiskScoreBadge score={3} size="lg" />)
    expect(container.firstChild).toHaveClass('px-3')
  })

  it('applies sm size classes by default', () => {
    const { container } = render(<RiskScoreBadge score={3} />)
    expect(container.firstChild).toHaveClass('px-2')
  })
})
