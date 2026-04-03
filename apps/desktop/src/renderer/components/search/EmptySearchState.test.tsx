import { render, screen } from '@testing-library/react'
import { EmptySearchState } from './EmptySearchState'

describe('EmptySearchState', () => {
  it('renders primary message', () => {
    render(<EmptySearchState />)
    expect(screen.getByText('Search your codebase by meaning')).toBeInTheDocument()
  })

  it('renders hint text about natural language query', () => {
    render(<EmptySearchState />)
    expect(screen.getByText(/natural language query/)).toBeInTheDocument()
  })
})
