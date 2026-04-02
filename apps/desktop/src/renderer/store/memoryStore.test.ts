import { describe, it, expect, beforeEach } from 'vitest'
import { useMemoryStore } from './memoryStore'

const makeMemory = (id = 'mem-1', text = 'hello') => ({
  id,
  text,
  tags: [],
  relevance_score: 0,
  timestamp: new Date().toISOString(),
})

describe('useMemoryStore', () => {
  beforeEach(() => {
    useMemoryStore.setState({
      memories: [],
      searchResults: [],
      contextSummary: null,
      isLoading: false,
      error: null,
    })
  })

  it('initial state has empty memories, empty searchResults, null contextSummary, false isLoading, null error', () => {
    const state = useMemoryStore.getState()
    expect(state.memories).toEqual([])
    expect(state.searchResults).toEqual([])
    expect(state.contextSummary).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('setMemories replaces memories array', () => {
    const mem = makeMemory()
    useMemoryStore.getState().setMemories([mem])
    expect(useMemoryStore.getState().memories).toEqual([mem])
  })

  it('addMemory appends memory', () => {
    const mem1 = makeMemory('1', 'first')
    const mem2 = makeMemory('2', 'second')
    useMemoryStore.getState().addMemory(mem1)
    useMemoryStore.getState().addMemory(mem2)
    const { memories } = useMemoryStore.getState()
    expect(memories).toHaveLength(2)
    expect(memories[0].id).toBe('1')
    expect(memories[1].id).toBe('2')
  })

  it('removeMemory filters by id', () => {
    const mem1 = makeMemory('a', 'keep')
    const mem2 = makeMemory('b', 'remove')
    useMemoryStore.getState().setMemories([mem1, mem2])
    useMemoryStore.getState().removeMemory('b')
    const { memories } = useMemoryStore.getState()
    expect(memories).toHaveLength(1)
    expect(memories[0].id).toBe('a')
  })

  it('setSearchResults updates searchResults', () => {
    const result = { memory: makeMemory(), score: 0.8 }
    useMemoryStore.getState().setSearchResults([result])
    expect(useMemoryStore.getState().searchResults).toEqual([result])
  })

  it('setContextSummary updates contextSummary', () => {
    const summary = {
      query: 'hello',
      relevant_memories: [],
      compressed_context: 'ctx',
      token_estimate: 10,
    }
    useMemoryStore.getState().setContextSummary(summary)
    expect(useMemoryStore.getState().contextSummary).toEqual(summary)
  })

  it('setLoading updates isLoading', () => {
    useMemoryStore.getState().setLoading(true)
    expect(useMemoryStore.getState().isLoading).toBe(true)
    useMemoryStore.getState().setLoading(false)
    expect(useMemoryStore.getState().isLoading).toBe(false)
  })

  it('setError updates error', () => {
    useMemoryStore.getState().setError('something went wrong')
    expect(useMemoryStore.getState().error).toBe('something went wrong')
    useMemoryStore.getState().setError(null)
    expect(useMemoryStore.getState().error).toBeNull()
  })
})
