import React, { useEffect, useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { FlaskConical, RefreshCw, Play } from 'lucide-react'
import { useFinetune } from '../hooks/useFinetune'
import { useFinetuneStore } from '../store/finetuneStore'
import { LossCurve, CheckpointTable, JobStatusCard } from '../components/finetune'
import type { FinetuneConfig } from '../../shared/finetuning'

const DEFAULT_CONFIG: FinetuneConfig = {
  base_model: 'mistral-7b',
  dataset_path: './datasets/custom.jsonl',
  learning_rate: 3e-4,
  epochs: 3,
  batch_size: 4,
  lora_rank: 8,
  output_dir: './finetune-output',
}

export function Finetune() {
  const { startJob, fetchJobs, stopJob, fetchCheckpoints } = useFinetune()
  const { jobs, checkpoints, activeJobId, isLoading } = useFinetuneStore()
  const [config, setConfig] = useState<FinetuneConfig>(DEFAULT_CONFIG)

  useEffect(() => {
    fetchJobs()
    fetchCheckpoints()
  }, [fetchJobs, fetchCheckpoints])

  const activeJob = jobs.find(j => j.job_id === activeJobId) ?? null

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-border-subtle">
        <div className="flex items-center gap-3 mb-1">
          <FlaskConical size={20} aria-hidden="true" className="text-accent-400" />
          <h1 className="text-text-primary text-xl font-semibold">Local Model Fine-tuning</h1>
        </div>
        <p className="text-text-secondary text-sm">
          Fine-tune local models with LoRA on custom datasets
        </p>
      </div>

      <Tabs.Root defaultValue="configure" className="flex flex-col flex-1 min-h-0">
        <Tabs.List className="flex gap-1 px-6 pt-4 border-b border-border-subtle">
          {(['configure', 'jobs', 'checkpoints', 'loss'] as const).map(t => (
            <Tabs.Trigger
              key={t}
              value={t}
              className="text-sm px-3 py-1.5 rounded-t capitalize text-text-secondary data-[state=active]:text-text-primary data-[state=active]:bg-bg-surface-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              {t === 'jobs'
                ? `Jobs (${jobs.length})`
                : t === 'checkpoints'
                  ? `Checkpoints (${checkpoints.length})`
                  : t.charAt(0).toUpperCase() + t.slice(1)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="flex-1 overflow-y-auto p-6">
          <Tabs.Content value="configure">
            <div className="grid grid-cols-2 gap-4 mb-6">
              {(
                [
                  { key: 'base_model', label: 'Base Model', type: 'text' },
                  { key: 'dataset_path', label: 'Dataset Path', type: 'text' },
                  { key: 'learning_rate', label: 'Learning Rate', type: 'number' },
                  { key: 'epochs', label: 'Epochs', type: 'number' },
                  { key: 'batch_size', label: 'Batch Size', type: 'number' },
                  { key: 'lora_rank', label: 'LoRA Rank', type: 'number' },
                ] as const
              ).map(({ key, label, type }) => (
                <div key={key}>
                  <label className="text-text-secondary text-xs block mb-1">{label}</label>
                  <input
                    type={type}
                    value={(config as Record<string, unknown>)[key] as string | number}
                    onChange={e =>
                      setConfig(c => ({
                        ...c,
                        [key]: type === 'number' ? parseFloat(e.target.value) : e.target.value,
                      }))
                    }
                    className="w-full bg-bg-surface-2 border border-border-default rounded-md px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                    aria-label={label}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => startJob(config)}
              disabled={isLoading}
              className="flex items-center gap-2 bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-text-primary text-sm font-medium px-4 py-2 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              {isLoading ? (
                <RefreshCw size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <Play size={14} aria-hidden="true" />
              )}
              {isLoading ? 'Starting…' : 'Start Fine-tuning'}
            </button>
          </Tabs.Content>

          <Tabs.Content value="jobs">
            {jobs.length === 0 ? (
              <p className="text-text-muted text-sm">No fine-tune jobs yet.</p>
            ) : (
              <div className="space-y-3">
                {jobs.map(j => (
                  <JobStatusCard key={j.job_id} job={j} onStop={stopJob} />
                ))}
              </div>
            )}
          </Tabs.Content>

          <Tabs.Content value="checkpoints">
            <CheckpointTable checkpoints={checkpoints} />
          </Tabs.Content>

          <Tabs.Content value="loss">
            {activeJob && activeJob.loss_history.length > 0 ? (
              <>
                <p className="text-text-muted text-xs mb-3">
                  Loss curve for job {activeJob.job_id.slice(0, 8)}
                </p>
                <LossCurve losses={activeJob.loss_history} />
              </>
            ) : (
              <p className="text-text-muted text-sm">
                No active job with loss data. Start a fine-tune to see the curve.
              </p>
            )}
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  )
}
