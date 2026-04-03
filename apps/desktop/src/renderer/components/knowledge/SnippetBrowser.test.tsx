import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SnippetBrowser } from './SnippetBrowser'
import type { Snippet } from '../../../shared/knowledge'

const snippet1: Snippet = {
  id: 'snip-1',
  text: 'const greet = () => "hello"',
  language: 'typescript',
  domain: 'utilities',
  qualityScore: 0.88,
  usageCount: 5,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tags: [],
  rejected: false,
}

const snippet2: Snippet = {
  id: 'snip-2',
  text: 'def add(a, b): return a + b',
  language: 'python',
  domain: 'math',
  qualityScore: 0.75,
  usageCount: 2,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tags: [],
  rejected: false,
}

describe('SnippetBrowser', () => {
  it('shows empty state when no snippets', () => {
    render(<SnippetBrowser snippets={[]} />)
    expect(screen.getByText(/No snippets yet/)).toBeInTheDocument()
  })

  it('shows snippet count', () => {
    render(<SnippetBrowser snippets={[snippet1, snippet2]} />)
    expect(screen.getByText('2 snippets')).toBeInTheDocument()
  })

  it('renders a search input', () => {
    render(<SnippetBrowser snippets={[snippet1]} />)
    expect(screen.getByPlaceholderText('Search snippets…')).toBeInTheDocument()
  })

  it('filters snippets by search query', async () => {
    const user = userEvent.setup()
    render(<SnippetBrowser snippets={[snippet1, snippet2]} />)
    await user.type(screen.getByPlaceholderText('Search snippets…'), 'greet')
    expect(screen.getByText('1 snippets')).toBeInTheDocument()
  })

  it('renders language options in select', () => {
    render(<SnippetBrowser snippets={[snippet1, snippet2]} />)
    expect(screen.getByRole('option', { name: 'typescript' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'python' })).toBeInTheDocument()
  })

  it('renders All Languages option', () => {
    render(<SnippetBrowser snippets={[snippet1]} />)
    expect(screen.getByRole('option', { name: 'All Languages' })).toBeInTheDocument()
  })
})
