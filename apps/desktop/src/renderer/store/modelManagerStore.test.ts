import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useModelManagerStore } from './modelManagerStore'
import { useSystemStore } from './systemStore'
import { modelManagerAPI } from '../services/modelManagerAPI'

vi.mock('../services/modelManagerAPI', () => ({
  modelManagerAPI: {
    listModels: vi.fn(),
    setActiveModel: vi.fn(),
    deleteModel: vi.fn(),
    startTraining: vi.fn(),
    startOneClickTraining: vi.fn(),
    getTrainingStatus: vi.fn(),
    exportModel: vi.fn(),
    isServiceAvailable: vi.fn(),
  },
}))

describe('modelManagerStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSystemStore.setState({ activeModel: null })
    useModelManagerStore.setState({
      models: [],
      selectedModel: null,
      trainingJobs: [],
      activeTrainingJob: null,
      isLoading: false,
      error: null,
      isServiceAvailable: false,
      last_error: null,
    })
  })

  it('rethrows setActiveModel failures and records last_error', async () => {
    vi.mocked(modelManagerAPI.setActiveModel).mockRejectedValue(new Error('backend load failed'))

    await expect(useModelManagerStore.getState().setActiveModel('broken-model')).rejects.toThrow('backend load failed')
    expect(useModelManagerStore.getState().last_error).toBe('backend load failed')
  })

  it('rethrows deleteModel failures and records last_error', async () => {
    vi.mocked(modelManagerAPI.deleteModel).mockRejectedValue(new Error('backend delete failed'))

    await expect(useModelManagerStore.getState().deleteModel('broken-model')).rejects.toThrow('backend delete failed')
    expect(useModelManagerStore.getState().last_error).toBe('backend delete failed')
  })
})