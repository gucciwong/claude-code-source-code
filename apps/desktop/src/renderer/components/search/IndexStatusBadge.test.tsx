import { render, screen } from '@testing-library/react'
import { IndexStatusBadge } from './IndexStatusBadge'
import type { IndexStatus } from '../../../shared/semanticSearch'

describe('IndexStatusBadge', () => {
  it('renders nothing when status is null', () => {
    const { container } = render(<IndexStatusBadge status={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders total chunks', () => {
    const status: IndexStatus = { total_chunks: 1500, indexed_files: 42, status: 'ready' }
    render(<IndexStatusBadge status={status} />)
    expect(screen.getByText('1500 chunks')).toBeInTheDocument()
  })

  it('renders indexed files', () => {
    const status: IndexStatus = { total_chunks: 1500, indexed_files: 42, status: 'ready' }
    render(<IndexStatusBadge status={status} />)
    expect(screen.getByText('42 files')).toBeInTheDocument()
  })

  it('applies green color for ready status', () => {
    const status: IndexStatus = { total_chunks: 10, indexed_files: 2, status: 'ready' }
    render(<IndexStatusBadge status={status} />)
    expect(screen.getByText('10 chunks')).toHaveClass('text-green-500')
  })

  it('applies yellow color for indexing status', () => {
    const status: IndexStatus = { total_chunks: 5, indexed_files: 1, status: 'indexing' }
    render(<IndexStatusBadge status={status} />)
    expect(screen.getByText('5 chunks')).toHaveClass('text-yellow-400')
  })
})
