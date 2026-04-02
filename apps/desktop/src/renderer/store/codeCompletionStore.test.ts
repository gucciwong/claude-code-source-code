import { beforeEach, describe, expect, it } from 'vitest'
import { useCodeCompletionStore } from './codeCompletionStore'

describe('codeCompletionStore', () => {
  beforeEach(() => {
    useCodeCompletionStore.setState({
      completions: [],
      activeIndex: 0,
      isLoading: false,
      prefix: '',
      error: null,
    })
  })

  it('initial state: empty completions, activeIndex 0, isLoading false, empty prefix, null error', () => {
    const state = useCodeCompletionStore.getState()
    expect(state.completions).toEqual([])
    expect(state.activeIndex).toBe(0)
    expect(state.isLoading).toBe(false)
    expect(state.prefix).toBe('')
    expect(state.error).toBeNull()
  })

  it('setCompletions replaces completions and resets activeIndex to 0', () => {
    const { setCompletions, setActiveIndex } = useCodeCompletionStore.getState()
    setActiveIndex(2)
    const items = [{ text: 'function', confidence: 0.8, source: 'ngram' as const }]
    setCompletions(items)
    const state = useCodeCompletionStore.getState()
    expect(state.completions).toEqual(items)
    expect(state.activeIndex).toBe(0)
  })

  it('setActiveIndex updates activeIndex', () => {
    useCodeCompletionStore.getState().setActiveIndex(3)
    expect(useCodeCompletionStore.getState().activeIndex).toBe(3)
  })

  it('setLoading updates isLoading', () => {
    useCodeCompletionStore.getState().setLoading(true)
    expect(useCodeCompletionStore.getState().isLoading).toBe(true)
  })

  it('setPrefix updates prefix', () => {
    useCodeCompletionStore.getState().setPrefix('def')
    expect(useCodeCompletionStore.getState().prefix).toBe('def')
  })

  it('setError updates error', () => {
    useCodeCompletionStore.getState().setError('network error')
    expect(useCodeCompletionStore.getState().error).toBe('network error')
  })

  it('setCompletions with empty array results in empty completions', () => {
    useCodeCompletionStore.getState().setCompletions([])
    expect(useCodeCompletionStore.getState().completions).toEqual([])
  })

  it('setActiveIndex to 2 sets activeIndex to 2', () => {
    useCodeCompletionStore.getState().setActiveIndex(2)
    expect(useCodeCompletionStore.getState().activeIndex).toBe(2)
  })
})
