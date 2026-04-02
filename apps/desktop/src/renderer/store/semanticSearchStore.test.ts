import { describe, it, expect, beforeEach } from 'vitest'
import { useSemanticSearchStore } from './semanticSearchStore'
import type { CodeSnippet, IndexStatus } from '../../shared/semanticSearch'

describe('semanticSearchStore', () => {
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

  it('has correct initial state', () => {
    const state = useSemanticSearchStore.getState()
    expect(state.results).toEqual([])
    expect(state.indexStatus).toBeNull()
    expect(state.isSearching).toBe(false)
    expect(state.isIndexing).toBe(false)
    expect(state.error).toBeNull()
    expect(state.query).toBe('')
  })

  it('setResults updates results', () => {
    const snippets: CodeSnippet[] = [
      { file_path: 'auth.py', chunk_text: 'def auth():', start_line: 1, end_line: 10, score: 0.9, language: 'python' },
    ]
    useSemanticSearchStore.getState().setResults(snippets)
    expect(useSemanticSearchStore.getState().results).toHaveLength(1)
    expect(useSemanticSearchStore.getState().results[0].file_path).toBe('auth.py')
  })

  it('setIndexStatus updates indexStatus', () => {
    const status: IndexStatus = { total_chunks: 42, indexed_files: 3, status: 'ready' }
    useSemanticSearchStore.getState().setIndexStatus(status)
    expect(useSemanticSearchStore.getState().indexStatus?.total_chunks).toBe(42)
    expect(useSemanticSearchStore.getState().indexStatus?.status).toBe('ready')
  })

  it('setSearching updates isSearching', () => {
    useSemanticSearchStore.getState().setSearching(true)
    expect(useSemanticSearchStore.getState().isSearching).toBe(true)
    useSemanticSearchStore.getState().setSearching(false)
    expect(useSemanticSearchStore.getState().isSearching).toBe(false)
  })

  it('setIndexing updates isIndexing', () => {
    useSemanticSearchStore.getState().setIndexing(true)
    expect(useSemanticSearchStore.getState().isIndexing).toBe(true)
  })

  it('setError updates error', () => {
    useSemanticSearchStore.getState().setError('Search failed')
    expect(useSemanticSearchStore.getState().error).toBe('Search failed')
  })

  it('setQuery updates query', () => {
    useSemanticSearchStore.getState().setQuery('authentication middleware')
    expect(useSemanticSearchStore.getState().query).toBe('authentication middleware')
  })

  it('setError null clears error', () => {
    useSemanticSearchStore.getState().setError('Some error')
    useSemanticSearchStore.getState().setError(null)
    expect(useSemanticSearchStore.getState().error).toBeNull()
  })
})
