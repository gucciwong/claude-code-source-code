import { beforeEach, describe, expect, it } from 'vitest'
import { useKnowledgeLibraryStore } from './knowledgeLibraryStore'
import { type SearchResult, type Snippet } from '../../shared/knowledge'

function makeSnippet(overrides: Partial<Snippet> = {}): Snippet {
  return {
    id: 'snip-1',
    text: 'const x = 1',
    language: 'typescript',
    domain: 'frontend',
    qualityScore: 0.8,
    usageCount: 0,
    createdAt: 1000,
    updatedAt: 1000,
    tags: [],
    rejected: false,
    ...overrides,
  }
}

describe('useKnowledgeLibraryStore', () => {
  beforeEach(() => {
    useKnowledgeLibraryStore.setState({
      snippets: [],
      decisions: [],
      memoryMarkdown: '',
      domainStats: [],
      totalItems: 0,
      isIndexing: false,
      searchQuery: '',
      searchResults: [],
      injectionEnabled: true,
    })
  })

  // Test 1
  it('initial state has correct defaults', () => {
    const state = useKnowledgeLibraryStore.getState()
    expect(state.snippets).toEqual([])
    expect(state.decisions).toEqual([])
    expect(state.memoryMarkdown).toBe('')
    expect(state.domainStats).toEqual([])
    expect(state.totalItems).toBe(0)
    expect(state.isIndexing).toBe(false)
    expect(state.searchQuery).toBe('')
    expect(state.searchResults).toEqual([])
    expect(state.injectionEnabled).toBe(true)
  })

  // Test 2
  it('setSnippets updates snippets', () => {
    const snippets = [makeSnippet({ id: 'a' }), makeSnippet({ id: 'b' })]
    useKnowledgeLibraryStore.getState().setSnippets(snippets)
    expect(useKnowledgeLibraryStore.getState().snippets).toHaveLength(2)
    expect(useKnowledgeLibraryStore.getState().snippets[0].id).toBe('a')
    expect(useKnowledgeLibraryStore.getState().snippets[1].id).toBe('b')
  })

  // Test 3
  it('setInjectionEnabled toggles value', () => {
    expect(useKnowledgeLibraryStore.getState().injectionEnabled).toBe(true)
    useKnowledgeLibraryStore.getState().setInjectionEnabled(false)
    expect(useKnowledgeLibraryStore.getState().injectionEnabled).toBe(false)
    useKnowledgeLibraryStore.getState().setInjectionEnabled(true)
    expect(useKnowledgeLibraryStore.getState().injectionEnabled).toBe(true)
  })

  // Test 4
  it('removeSnippet removes by id', () => {
    const snippets = [
      makeSnippet({ id: 'keep-1' }),
      makeSnippet({ id: 'remove-me' }),
      makeSnippet({ id: 'keep-2' }),
    ]
    useKnowledgeLibraryStore.getState().setSnippets(snippets)
    useKnowledgeLibraryStore.getState().removeSnippet('remove-me')
    const result = useKnowledgeLibraryStore.getState().snippets
    expect(result).toHaveLength(2)
    expect(result.find((s) => s.id === 'remove-me')).toBeUndefined()
    expect(result.find((s) => s.id === 'keep-1')).toBeDefined()
    expect(result.find((s) => s.id === 'keep-2')).toBeDefined()

    // No-op: removing a non-existent ID leaves the list unchanged
    useKnowledgeLibraryStore.getState().setSnippets([
      { id: 'a', text: 'keep', language: 'ts', domain: 'test', qualityScore: 0.8, usageCount: 0, createdAt: 1, updatedAt: 1, tags: [], rejected: false },
    ])
    useKnowledgeLibraryStore.getState().removeSnippet('nonexistent-id')
    expect(useKnowledgeLibraryStore.getState().snippets).toHaveLength(1)
  })

  // Test 5
  it('setSearchResults updates results', () => {
    const results: SearchResult[] = [
      {
        id: 'r1',
        text: 'some code',
        similarity: 0.95,
        language: 'typescript',
        domain: 'frontend',
        createdAt: 2000,
      },
    ]
    useKnowledgeLibraryStore.getState().setSearchResults(results)
    expect(useKnowledgeLibraryStore.getState().searchResults).toHaveLength(1)
    expect(useKnowledgeLibraryStore.getState().searchResults[0].id).toBe('r1')
    expect(useKnowledgeLibraryStore.getState().searchResults[0].similarity).toBe(0.95)
  })
})
