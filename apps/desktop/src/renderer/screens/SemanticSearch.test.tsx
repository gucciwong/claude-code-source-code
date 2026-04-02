import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { SemanticSearch } from './SemanticSearch'
import { useSemanticSearchStore } from '../store/semanticSearchStore'

vi.mock('../hooks/useSemanticSearch', () => ({
  useSemanticSearch: () => ({
    search: vi.fn().mockResolvedValue([]),
    clearIndex: vi.fn().mockResolvedValue(true),
    fetchStatus: vi.fn().mockResolvedValue(null),
    indexContent: vi.fn().mockResolvedValue(true),
  }),
}))

describe('SemanticSearch screen', () => {
  beforeEach(() => {
    useSemanticSearchStore.setState({
      results: [],
      indexStatus: null,
      isSearching: false,
      isIndexing: false,
      error: null,
      query: '',
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders heading "Code Search"', () => {
    render(<SemanticSearch />)
    expect(screen.getByText('Code Search')).toBeInTheDocument()
  })

  it('renders search query input', () => {
    render(<SemanticSearch />)
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('renders Search button', () => {
    render(<SemanticSearch />)
    expect(screen.getByRole('button', { name: /^Search$/i })).toBeInTheDocument()
  })

  it('renders "Search your codebase semantically" description', () => {
    render(<SemanticSearch />)
    expect(screen.getByText(/Search your codebase semantically/i)).toBeInTheDocument()
  })

  it('search button is disabled when query is empty', () => {
    render(<SemanticSearch />)
    const btn = screen.getByRole('button', { name: /^Search$/i })
    expect(btn).toBeDisabled()
  })

  it('renders EmptySearchState when no search has been done', () => {
    render(<SemanticSearch />)
    expect(screen.getByText('Search your codebase by meaning')).toBeInTheDocument()
  })

  it('renders IndexStatusBadge when status is available', () => {
    useSemanticSearchStore.setState({
      results: [],
      indexStatus: { total_chunks: 15, indexed_files: 3, status: 'ready' },
      isSearching: false,
      isIndexing: false,
      error: null,
      query: '',
    })
    render(<SemanticSearch />)
    expect(screen.getByText('15 chunks')).toBeInTheDocument()
  })

  it('renders Refresh and Clear buttons', () => {
    render(<SemanticSearch />)
    expect(screen.getByRole('button', { name: /refresh index status/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear search index/i })).toBeInTheDocument()
  })
})
