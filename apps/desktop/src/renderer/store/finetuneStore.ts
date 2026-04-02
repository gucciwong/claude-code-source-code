import { create } from 'zustand'
import type { FinetuneJob, Checkpoint } from '../../shared/finetuning'

interface FinetuneStore {
  jobs: FinetuneJob[]
  checkpoints: Checkpoint[]
  activeJobId: string | null
  isLoading: boolean
  error: string | null
  setJobs: (jobs: FinetuneJob[]) => void
  addJob: (job: FinetuneJob) => void
  updateJob: (job: FinetuneJob) => void
  setCheckpoints: (checkpoints: Checkpoint[]) => void
  setActiveJobId: (id: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useFinetuneStore = create<FinetuneStore>(set => ({
  jobs: [],
  checkpoints: [],
  activeJobId: null,
  isLoading: false,
  error: null,
  setJobs: jobs => set({ jobs }),
  addJob: job => set(state => ({ jobs: [...state.jobs, job] })),
  updateJob: job => set(state => ({
    jobs: state.jobs.map(j => j.job_id === job.job_id ? job : j),
  })),
  setCheckpoints: checkpoints => set({ checkpoints }),
  setActiveJobId: activeJobId => set({ activeJobId }),
  setLoading: isLoading => set({ isLoading }),
  setError: error => set({ error }),
}))
