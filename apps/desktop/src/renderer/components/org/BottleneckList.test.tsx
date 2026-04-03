import { render, screen } from '@testing-library/react'
import { BottleneckList } from './BottleneckList'
import type { Bottleneck } from '../../../shared/orgIntelligence'

const bottlenecks: Bottleneck[] = [
  { area: 'code_review', frequency: 10, description: 'Reviews take too long', severity: 'high' },
  { area: 'deployment', frequency: 5, description: 'Slow deploy pipeline', severity: 'medium' },
]

describe('BottleneckList', () => {
  it('renders empty state when no bottlenecks', () => {
    render(<BottleneckList bottlenecks={[]} />)
    expect(screen.getByText('No bottlenecks detected')).toBeInTheDocument()
  })

  it('renders area name (underscores replaced)', () => {
    render(<BottleneckList bottlenecks={bottlenecks} />)
    expect(screen.getByText('code review')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<BottleneckList bottlenecks={bottlenecks} />)
    expect(screen.getByText('Reviews take too long')).toBeInTheDocument()
  })

  it('renders severity label', () => {
    render(<BottleneckList bottlenecks={bottlenecks} />)
    expect(screen.getAllByText('high').length).toBeGreaterThan(0)
  })

  it('applies red color class for high severity', () => {
    const { container } = render(<BottleneckList bottlenecks={[bottlenecks[0]]} />)
    expect(container.querySelector('.text-red-400')).not.toBeNull()
  })

  it('applies yellow color class for medium severity', () => {
    const { container } = render(<BottleneckList bottlenecks={[bottlenecks[1]]} />)
    expect(container.querySelector('.text-yellow-400')).not.toBeNull()
  })
})
