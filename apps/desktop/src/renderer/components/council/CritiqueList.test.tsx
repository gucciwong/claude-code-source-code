import { render, screen } from '@testing-library/react'
import { CritiqueList } from './CritiqueList'
import type { CritiqueItem } from '../../../shared/personaCouncil'

const critiques: CritiqueItem[] = [
  { title: 'Unsafe eval', description: 'Do not use eval().', severity: 'critical' },
  { title: 'Unused variable', description: 'Remove unused vars.', severity: 'warning' },
  { title: 'Missing semicolon', description: 'Add semicolons.', severity: 'info', line_hint: 42 },
]

describe('CritiqueList', () => {
  it('renders empty state message when no critiques', () => {
    render(<CritiqueList critiques={[]} />)
    expect(screen.getByText(/No issues found/)).toBeInTheDocument()
  })

  it('renders each critique title', () => {
    render(<CritiqueList critiques={critiques} />)
    expect(screen.getByText('Unsafe eval')).toBeInTheDocument()
    expect(screen.getByText('Unused variable')).toBeInTheDocument()
    expect(screen.getByText('Missing semicolon')).toBeInTheDocument()
  })

  it('renders descriptions', () => {
    render(<CritiqueList critiques={critiques} />)
    expect(screen.getByText('Do not use eval().')).toBeInTheDocument()
  })

  it('shows line_hint when present', () => {
    render(<CritiqueList critiques={critiques} />)
    expect(screen.getByText(/line 42/)).toBeInTheDocument()
  })

  it('does not render line hint for critiques without line_hint', () => {
    render(<CritiqueList critiques={[critiques[0]]} />)
    expect(screen.queryByText(/line/)).not.toBeInTheDocument()
  })
})
