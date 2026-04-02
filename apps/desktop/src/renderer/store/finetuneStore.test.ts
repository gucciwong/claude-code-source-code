import { describe, it, expect, beforeEach } from 'vitest'
import { useFinetuneStore } from './finetuneStore'
import type { FinetuneJob, Checkpoint } from '../../shared/finetuning'

const makeJob = (overrides?: Partial<FinetuneJob>): FinetuneJob => ({
  job_id: 'job-abc-123',
  config: { base_model: 'mistral-7b' },
  status: 'queued',
  progress: 0,
  current_epoch: 0,
  total_epochs: 3,
  loss_history: [],
  created_at: '2026-04-02T00:00:00',
  completed_at: null,
  ...overrides,
})

const makeCheckpoint = (): Checkpoint => ({
  name: 'ckpt-epoch-3',
  epoch: 3,
  loss: 0.42,
  path: './output/final',
})

describe('useFinetuneStore', () => {
  beforeEach(() => {
    useFinetuneStore.setState({
      jobs: [],
      checkpoints: [],
      activeJobId: null,
      isLoading: false,
      error: null,
    })
  })

  it('has correct initial state', () => {
    const state = useFinetuneStore.getState()
    expect(state.jobs).toEqual([])
    expect(state.checkpoints).toEqual([])
    expect(state.activeJobId).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('setJobs replaces jobs array', () => {
    const jobs = [makeJob(), makeJob({ job_id: 'job-xyz-456' })]
    useFinetuneStore.getState().setJobs(jobs)
    expect(useFinetuneStore.getState().jobs).toEqual(jobs)
  })

  it('addJob appends job to existing list', () => {
    const job1 = makeJob()
    const job2 = makeJob({ job_id: 'second-job' })
    useFinetuneStore.getState().addJob(job1)
    useFinetuneStore.getState().addJob(job2)
    const { jobs } = useFinetuneStore.getState()
    expect(jobs).toHaveLength(2)
    expect(jobs[0].job_id).toBe('job-abc-123')
    expect(jobs[1].job_id).toBe('second-job')
  })

  it('updateJob updates job matching job_id', () => {
    useFinetuneStore.getState().setJobs([makeJob()])
    const updated = makeJob({ status: 'running', progress: 0.5 })
    useFinetuneStore.getState().updateJob(updated)
    const { jobs } = useFinetuneStore.getState()
    expect(jobs[0].status).toBe('running')
    expect(jobs[0].progress).toBe(0.5)
  })

  it('setCheckpoints replaces checkpoints array', () => {
    const ckpts = [makeCheckpoint()]
    useFinetuneStore.getState().setCheckpoints(ckpts)
    expect(useFinetuneStore.getState().checkpoints).toEqual(ckpts)
  })

  it('setActiveJobId updates activeJobId', () => {
    useFinetuneStore.getState().setActiveJobId('job-abc-123')
    expect(useFinetuneStore.getState().activeJobId).toBe('job-abc-123')
    useFinetuneStore.getState().setActiveJobId(null)
    expect(useFinetuneStore.getState().activeJobId).toBeNull()
  })

  it('setLoading updates isLoading', () => {
    useFinetuneStore.getState().setLoading(true)
    expect(useFinetuneStore.getState().isLoading).toBe(true)
    useFinetuneStore.getState().setLoading(false)
    expect(useFinetuneStore.getState().isLoading).toBe(false)
  })

  it('setError updates error', () => {
    useFinetuneStore.getState().setError('Something went wrong')
    expect(useFinetuneStore.getState().error).toBe('Something went wrong')
    useFinetuneStore.getState().setError(null)
    expect(useFinetuneStore.getState().error).toBeNull()
  })
})
