import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFinetune } from './useFinetune'
import { useFinetuneStore } from '../store/finetuneStore'
import type { FinetuneConfig, FinetuneJob, Checkpoint } from '../../shared/finetuning'

const makeConfig = (): FinetuneConfig => ({
  base_model: 'mistral-7b',
  dataset_path: './data.jsonl',
  learning_rate: 3e-4,
  epochs: 3,
  batch_size: 4,
  lora_rank: 8,
  output_dir: './finetune-output',
})

const makeJob = (): FinetuneJob => ({
  job_id: 'test-job-999',
  config: { base_model: 'mistral-7b' },
  status: 'queued',
  progress: 0,
  current_epoch: 0,
  total_epochs: 3,
  loss_history: [],
  created_at: '2026-04-02T00:00:00',
  completed_at: null,
})

const makeCheckpoint = (): Checkpoint => ({
  name: 'ckpt-epoch-3',
  epoch: 3,
  loss: 0.42,
  path: './output/final',
})

describe('useFinetune', () => {
  beforeEach(() => {
    useFinetuneStore.setState({
      jobs: [],
      checkpoints: [],
      activeJobId: null,
      isLoading: false,
      error: null,
    })
    vi.restoreAllMocks()
  })

  it('startJob POSTs to /finetune/start then GETs /finetune/status/{id}', async () => {
    const job = makeJob()
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ job_id: job.job_id, status: 'queued' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => job })
    vi.stubGlobal('fetch', mockFetch)

    const { result } = renderHook(() => useFinetune())
    await act(() => result.current.startJob(makeConfig()))

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8001/finetune/start',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(mockFetch).toHaveBeenCalledWith(`http://localhost:8001/finetune/status/${job.job_id}`)
  })

  it('startJob calls addJob and setActiveJobId on success', async () => {
    const job = makeJob()
    vi.stubGlobal('fetch', vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ job_id: job.job_id }) })
      .mockResolvedValueOnce({ ok: true, json: async () => job }),
    )

    const { result } = renderHook(() => useFinetune())
    await act(() => result.current.startJob(makeConfig()))

    const state = useFinetuneStore.getState()
    expect(state.jobs).toHaveLength(1)
    expect(state.jobs[0].job_id).toBe(job.job_id)
    expect(state.activeJobId).toBe(job.job_id)
  })

  it('startJob returns null and sets error on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const { result } = renderHook(() => useFinetune())
    let returnVal: FinetuneJob | null = undefined as unknown as null
    await act(async () => {
      returnVal = await result.current.startJob(makeConfig())
    })

    expect(returnVal).toBeNull()
    expect(useFinetuneStore.getState().error).toBe('Network error')
  })

  it('fetchJobs calls GET /finetune/jobs and calls setJobs', async () => {
    const jobs = [makeJob()]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => jobs }))

    const { result } = renderHook(() => useFinetune())
    await act(() => result.current.fetchJobs())

    expect(useFinetuneStore.getState().jobs).toEqual(jobs)
  })

  it('fetchJobs returns empty array on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network down')))

    const { result } = renderHook(() => useFinetune())
    let returned: FinetuneJob[] = []
    await act(async () => {
      returned = await result.current.fetchJobs()
    })
    expect(returned).toEqual([])
  })

  it('stopJob sends POST to /finetune/stop/{id}', async () => {
    const job = makeJob()
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...job, status: 'stopped' }) })
    vi.stubGlobal('fetch', mockFetch)

    const { result } = renderHook(() => useFinetune())
    await act(() => result.current.stopJob(job.job_id))

    expect(mockFetch).toHaveBeenCalledWith(
      `http://localhost:8001/finetune/stop/${job.job_id}`,
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('fetchCheckpoints calls GET /finetune/checkpoints and calls setCheckpoints', async () => {
    const checkpoints = [makeCheckpoint()]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => checkpoints }))

    const { result } = renderHook(() => useFinetune())
    await act(() => result.current.fetchCheckpoints())

    expect(useFinetuneStore.getState().checkpoints).toEqual(checkpoints)
  })

  it('fetchCheckpoints returns empty array on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')))

    const { result } = renderHook(() => useFinetune())
    let returned: Checkpoint[] = []
    await act(async () => {
      returned = await result.current.fetchCheckpoints()
    })
    expect(returned).toEqual([])
  })
})
