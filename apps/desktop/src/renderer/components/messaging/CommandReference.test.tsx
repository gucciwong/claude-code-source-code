import { render, screen } from '@testing-library/react'
import { CommandReference } from './CommandReference'
import { AVAILABLE_COMMANDS } from '../../../shared/messaging'

describe('CommandReference', () => {
  it('renders table with accessible label', () => {
    render(<CommandReference />)
    expect(screen.getByRole('table', { name: 'Available IM commands' })).toBeInTheDocument()
  })

  it('renders all command names', () => {
    render(<CommandReference />)
    for (const cmd of AVAILABLE_COMMANDS) {
      expect(screen.getAllByText(cmd.name).length).toBeGreaterThan(0)
    }
  })

  it('renders all command descriptions', () => {
    render(<CommandReference />)
    for (const cmd of AVAILABLE_COMMANDS) {
      expect(screen.getByText(cmd.description)).toBeInTheDocument()
    }
  })

  it('renders all command usages', () => {
    render(<CommandReference />)
    for (const cmd of AVAILABLE_COMMANDS) {
      expect(screen.getAllByText(cmd.usage).length).toBeGreaterThan(0)
    }
  })

  it('renders column headers', () => {
    render(<CommandReference />)
    expect(screen.getByText('Command')).toBeInTheDocument()
    expect(screen.getByText('Usage')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
  })
})
