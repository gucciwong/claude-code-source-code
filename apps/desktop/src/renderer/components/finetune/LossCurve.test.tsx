import { render, screen } from '@testing-library/react'
import { LossCurve } from './LossCurve'

describe('LossCurve', () => {
  it('shows empty state when no losses', () => {
    render(<LossCurve losses={[]} />)
    expect(screen.getByText('No loss data yet')).toBeInTheDocument()
  })

  it('renders an SVG with correct aria-label', () => {
    const losses = [1.5, 1.2, 0.9]
    render(<LossCurve losses={losses} />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute(
      'aria-label',
      `Loss curve: 3 data points, current loss ${(0.9).toFixed(3)}`
    )
  })

  it('renders a circle for each data point', () => {
    const losses = [1.0, 0.8, 0.6, 0.4]
    const { container } = render(<LossCurve losses={losses} />)
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(losses.length)
  })

  it('renders a polyline', () => {
    const { container } = render(<LossCurve losses={[1.0, 0.5]} />)
    const polyline = container.querySelector('polyline')
    expect(polyline).toBeInTheDocument()
    expect(polyline).toHaveAttribute('stroke-width', '2')
  })

  it('renders single data point without crashing', () => {
    render(<LossCurve losses={[0.42]} />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('aria-label', 'Loss curve: 1 data points, current loss 0.420')
  })
})
