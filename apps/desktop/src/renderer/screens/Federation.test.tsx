import { render, screen } from '@testing-library/react'
import { Federation } from './Federation'

describe('Federation Screen', () => {
  test('renders federation console header', () => {
    render(<Federation />)
    expect(screen.getByText('Federation Console')).toBeInTheDocument()
    expect(screen.getByText(/Join federations, contribute gradients/)).toBeInTheDocument()
  })

  test('displays join federation button', () => {
    render(<Federation />)
    expect(screen.getByText('Join Federation')).toBeInTheDocument()
  })

  test('shows my federations section', () => {
    render(<Federation />)
    expect(screen.getByText('My Federations')).toBeInTheDocument()
  })

  test('displays federation entries', () => {
    render(<Federation />)
    expect(screen.getByText('Finance AI Consortium')).toBeInTheDocument()
    expect(screen.getByText('Open Source Coder Commons')).toBeInTheDocument()
  })

  test('shows connected federation status', () => {
    render(<Federation />)
    expect(screen.getByText(/Connected · 8 peers/)).toBeInTheDocument()
  })

  test('shows offline federation status', () => {
    render(<Federation />)
    expect(screen.getByText('Offline — Resume')).toBeInTheDocument()
  })

  test('displays privacy status section', () => {
    render(<Federation />)
    expect(screen.getByText('Privacy Status')).toBeInTheDocument()
    expect(screen.getByText(/Differential Privacy: ON/)).toBeInTheDocument()
  })

  test('shows network graph section', () => {
    render(<Federation />)
    expect(screen.getByText('Network Graph')).toBeInTheDocument()
  })

  test('displays contribution history', () => {
    render(<Federation />)
    expect(screen.getByText('Contribution History')).toBeInTheDocument()
    expect(screen.getByText(/Round 127/)).toBeInTheDocument()
  })

  test('shows reputation score', () => {
    render(<Federation />)
    expect(screen.getByText(/847 points/)).toBeInTheDocument()
    expect(screen.getByText('Top 15% contributor')).toBeInTheDocument()
  })

  test('has test id', () => {
    render(<Federation />)
    expect(screen.getByTestId('screen-federation')).toBeInTheDocument()
  })
})
