import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useOllamaStatus } from './useOllamaStatus'
import { useSystemStore } from '../store/systemStore'
import { useModelsStore } from '../store/modelsStore'
import { ollamaClient } from '../services/ollamaClient'

vi.mock('../services/ollamaClient', () => ({
  ollamaClient: {
    isOnline: vi.fn(),
    getModels: vi.fn(),
  },
}))

describe('useOllamaStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSystemStore.setState({
      activeModel: null,
      ollamaOnline: false,
      ollamaConnectionError: null,
    })
    useModelsStore.setState({ installed: [], selected: null })
  })

  it('preserves an existing non-Ollama active model', async () => {
    useSystemStore.setState({ activeModel: 'tiny-gguf' })
    vi.mocked(ollamaClient.isOnline).mockResolvedValue(true)
    vi.mocked(ollamaClient.getModels).mockResolvedValue([
      { name: 'llama3.1:8b', size: 1, digest: 'abc', modified_at: '2026-01-01T00:00:00Z' },
    ])

    renderHook(() => useOllamaStatus())

    await waitFor(() => {
      expect(useSystemStore.getState().ollamaOnline).toBe(true)
    })
    expect(useSystemStore.getState().activeModel).toBe('tiny-gguf')
  })

  it('initializes activeModel from Ollama only when no active model exists', async () => {
    vi.mocked(ollamaClient.isOnline).mockResolvedValue(true)
    vi.mocked(ollamaClient.getModels).mockResolvedValue([
      { name: 'llama3.1:8b', size: 1, digest: 'abc', modified_at: '2026-01-01T00:00:00Z' },
    ])

    renderHook(() => useOllamaStatus())

    await waitFor(() => {
      expect(useSystemStore.getState().activeModel).toBe('llama3.1:8b')
    })
  })
})