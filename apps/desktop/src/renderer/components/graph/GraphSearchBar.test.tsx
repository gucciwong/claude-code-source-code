import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphSearchBar } from './GraphSearchBar'

describe('GraphSearchBar', () => {
  it('renders input with correct aria-label', () => {
    render(<GraphSearchBar value="" onChange={vi.fn()} />)
    expect(screen.getByRole('searchbox', { name: 'Search decision graph' })).toBeInTheDocument()
  })

  it('displays current value', () => {
    render(<GraphSearchBar value="bug fix" onChange={vi.fn()} />)
    expect(screen.getByRole('searchbox')).toHaveValue('bug fix')
  })

  it('shows placeholder text', () => {
    render(<GraphSearchBar value="" onChange={vi.fn()} />)
    expect(screen.getByPlaceholderText(/Search commits/)).toBeInTheDocument()
  })

  it('calls onChange with new value on typing', async () => {
    const onChange = vi.fn()
    render(<GraphSearchBar value="" onChange={onChange} />)
    await userEvent.type(screen.getByRole('searchbox'), 'a')
    expect(onChange).toHaveBeenCalledWith('a')
  })
})
