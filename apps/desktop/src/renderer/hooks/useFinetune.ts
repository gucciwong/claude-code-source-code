import { useCallback } from 'react'
import { useFinetuneStore } from '../store/finetuneStore'
import type { FinetuneConfig, FinetuneJob, Checkpoint } from '../../shared/finetuning'

const BASE_URL = 'http://localhost:8001'

export function useFinetune() {
  const { addJob, updateJob, setJobs, setCheckpoints, setActiveJobId, setLoading, setError } =
    useFinetuneStore()

  const startJob = useCallback(
    async (config: FinetuneConfig): Promise<FinetuneJob | null> => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${BASE_URL}/finetune/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        })
        if (!res.ok) throw new Error('Failed to start fine-tune')
        const data = await res.json()
        const jobRes = await fetch(`${BASE_URL}/finetune/status/${data.job_id}`)
        const job: FinetuneJob = await jobRes.json()
        addJob(job)
        setActiveJobId(job.job_id)
        return job
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
        return null
      } finally {
        setLoading(false)
      }
    },
    [addJob, setActiveJobId, setLoading, setError],
  )

  const fetchJobs = useCallback(async (): Promise<FinetuneJob[]> => {
    try {
      const res = await fetch(`${BASE_URL}/finetune/jobs`)
      if (!res.ok) return []
      const data: FinetuneJob[] = await res.json()
      setJobs(data)
      return data
    } catch {
      return []
    }
  }, [setJobs])

  const stopJob = useCallback(
    async (jobId: string): Promise<boolean> => {
      try {
        const res = await fetch(`${BASE_URL}/finetune/stop/${jobId}`, { method: 'POST' })
        if (res.ok) {
          const updated = await fetch(`${BASE_URL}/finetune/status/${jobId}`)
          if (updated.ok) updateJob(await updated.json())
        }
        return res.ok
      } catch {
        return false
      }
    },
    [updateJob],
  )

  const fetchCheckpoints = useCallback(async (): Promise<Checkpoint[]> => {
    try {
      const res = await fetch(`${BASE_URL}/finetune/checkpoints`)
      if (!res.ok) return []
      const data: Checkpoint[] = await res.json()
      setCheckpoints(data)
      return data
    } catch {
      return []
    }
  }, [setCheckpoints])

  return { startJob, fetchJobs, stopJob, fetchCheckpoints }
}
