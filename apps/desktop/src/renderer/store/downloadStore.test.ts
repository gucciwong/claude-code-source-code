import { beforeEach, describe, expect, it } from 'vitest'
import { useDownloadStore } from './downloadStore'

describe('downloadStore', () => {
  beforeEach(() => {
    useDownloadStore.setState({
      downloadStatuses: new Map(),
      downloadDetails: {},
    })
  })

  it('keeps download details visible when backend queue temporarily stops reporting before local model scan catches up', () => {
    useDownloadStore.getState().setDownloadStatus('qwen/model', 'downloading')
    useDownloadStore.getState().syncFromBackendStatus({
      'qwen/model': {
        status: 'downloading',
        progress: 92,
        total_size_gb: 10.4,
        downloaded_gb: 9.6,
        model_name: 'Qwen 3.5',
        started_at: 100,
      },
    })

    useDownloadStore.getState().syncFromBackendStatus({})

    const state = useDownloadStore.getState()
    expect(state.downloadStatuses.get('qwen/model')).toBe('downloading')
    expect(state.downloadDetails['qwen/model']).toBeDefined()
    expect(state.downloadDetails['qwen/model'].progress).toBe(92)
  })

  it('marks a download done only after the cached model scan reports it locally', () => {
    useDownloadStore.getState().setDownloadStatus('qwen/model', 'downloading')
    useDownloadStore.getState().syncFromBackendStatus({
      'qwen/model': {
        status: 'done',
        progress: 100,
        total_size_gb: 10.4,
        downloaded_gb: 10.4,
        model_name: 'Qwen 3.5',
        started_at: 100,
      },
    })

    let state = useDownloadStore.getState()
    expect(state.downloadStatuses.get('qwen/model')).not.toBe('done')
    expect(state.downloadDetails['qwen/model']).toBeDefined()

    useDownloadStore.getState().bulkMergeDone(['qwen/model'])

    state = useDownloadStore.getState()
    expect(state.downloadStatuses.get('qwen/model')).toBe('done')
    expect(state.downloadDetails['qwen/model']).toBeUndefined()
  })
})