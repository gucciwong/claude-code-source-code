import { useEffect, useState } from 'react'
import { Pause, Play, Square, Zap, Archive, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { useTrainingService } from '../hooks/useTrainingService'
import { useSystemStore } from '../store/systemStore'
import { useModelManagerStore } from '../store/modelManagerStore'
import { TrainingStartDialog } from '../components/training/TrainingStartDialog'

interface TrainingStats {
  total_events: number
  completion_accepted: number
  completion_rejected: number
  completion_edited: number
  task_completed_total: number
  task_success_rate: number
  recent_events_24h: number
}

export function Training() {
  const [schedule, setSchedule] = useState<'manual' | 'auto' | 'scheduled'>('auto')
  const [stats, setStats] = useState<TrainingStats | null>(null)
  const [startDialogOpen, setStartDialogOpen] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  
  const { trainingStatus, isTraining, eventCount, isServiceAvailable, getStats } = useTrainingService()
  const { vramUsed, vramTotal, gpuTemp } = useSystemStore()
  const { activeTrainingJob, trainingJobs, isServiceAvailable: modelServiceAvailable } = useModelManagerStore()

  const isRunning = isTraining || (activeTrainingJob?.status === 'running' || activeTrainingJob?.status === 'queued')
  const progress = activeTrainingJob?.progress || (trainingStatus && trainingStatus.is_training
    ? Math.round((trainingStatus.quick_train_count / Math.max(trainingStatus.quick_train_count + trainingStatus.next_full_train_in, 1)) * 100)
    : 0)

  useEffect(() => {
    if (isServiceAvailable) {
      getStats().then((s) => {
        if (s) setStats(s as TrainingStats)
      })
    }
  }, [isServiceAvailable, getStats])

  if (!isServiceAvailable && !modelServiceAvailable) {
    return (
      <div data-testid="screen-training" className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <AlertCircle size={48} className="text-yellow-500 mx-auto" />
          <h2 className="text-lg font-semibold text-text-primary">Training service unavailable</h2>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="screen-training" className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Training Console</h1>
        <p className="text-sm text-text-muted mt-1">Monitor and schedule QLoRA fine-tuning runs</p>
      </div>

      {/* One-Click Training Banner — visible when idle */}
      {!isRunning && (
        <div className="rounded-xl bg-gradient-to-r from-accent-500/15 via-purple-500/10 to-accent-500/5 border border-accent-500/30 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-accent-500/20 flex-shrink-0">
                <Sparkles size={20} className="text-accent-400" />
              </div>
              <div>
                <h2 className="font-semibold text-text-primary text-sm">Train on Your Personal Data</h2>
                <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-sm">
                  Sovereign Code has been quietly learning from your usage. One click fine-tunes the model on your accepted completions, corrections, and completed tasks — no configuration needed.
                </p>
              </div>
            </div>
            <button
              onClick={() => setStartDialogOpen(true)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-sm font-semibold transition whitespace-nowrap"
            >
              <Zap size={15} />
              One-Click Train
            </button>
          </div>
        </div>
      )}

      {/* Current Run */}
      <div className="bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className={`${isRunning ? 'text-yellow-400 animate-pulse' : 'text-text-muted'}`} size={20} />
            <span className={`font-semibold ${isRunning ? 'text-yellow-400' : 'text-text-muted'}`}>
              {isRunning ? 'RUNNING' : 'IDLE'}
            </span>
          </div>
          <div className="text-sm text-text-secondary">
            {isRunning ? (
              activeTrainingJob ? (
                <>Model: {activeTrainingJob.model_name} · Status: {activeTrainingJob.status}</> 
              ) : (
                <>Cycle: {trainingStatus?.active_cycle ?? '—'} · Quick trains: {trainingStatus?.quick_train_count ?? '—'} · Full in: {trainingStatus?.next_full_train_in ?? '—'}</>
              )
            ) : (
              'No training active'
            )}
          </div>
        </div>

        {isRunning && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-text-muted">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div
                className="w-full h-3 bg-bg-surface-3 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full bg-accent-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-text-muted">Train Loss</span>
                <p className="text-text-primary font-semibold">—</p>
              </div>
              <div className="space-y-1">
                <span className="text-text-muted">Val Loss</span>
                <p className="text-text-primary font-semibold">—</p>
              </div>
              <div className="space-y-1">
                <span className="text-text-muted">Learning Rate</span>
                <p className="text-text-primary font-mono">—</p>
              </div>
            </div>

            <div className="pt-2 border-t border-border-subtle">
              <p className="text-xs text-text-muted mb-2">
                {[
                  vramUsed != null && vramTotal != null ? `VRAM: ${vramUsed.toFixed(1)}/${vramTotal} GB` : null,
                  gpuTemp != null ? `Temp: ${gpuTemp}°C` : null,
                ].filter(Boolean).join(' · ') || 'GPU stats unavailable'}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                className="flex items-center gap-2 px-3 py-2 text-sm rounded border border-border-default text-text-secondary hover:bg-bg-surface-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={true}
              >
                <Pause size={14} aria-hidden="true" />
                Pause
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 text-sm rounded border border-border-default text-red-400 hover:bg-red-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={true}
              >
                <Square size={14} aria-hidden="true" />
                Stop
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-sm rounded border border-border-default text-text-secondary hover:bg-bg-surface-3 cursor-pointer">
                View Logs
              </button>
            </div>
          </>
        )}

        {!isRunning && (
          <button
            onClick={() => setStartDialogOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-bg-surface-3 hover:bg-bg-surface-2 text-text-muted border border-border-default rounded font-medium cursor-pointer transition text-sm"
          >
            <Play size={14} aria-hidden="true" />
            Advanced Setup
          </button>
        )}
      </div>

      {/* Version History */}
      <div className="bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <Zap size={18} aria-hidden="true" />
          Version History
        </h2>
        {trainingJobs.length === 0 ? (
          <p className="text-sm text-text-muted">No training history available</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {trainingJobs.slice(0, 5).map((job) => (
              <div key={job.job_id} className="p-3 bg-bg-surface-3 border border-border-default rounded-md text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-text-primary">{job.model_name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    job.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                    job.status === 'running' ? 'bg-yellow-500/10 text-yellow-600' :
                    job.status === 'failed' ? 'bg-red-500/10 text-red-600' :
                    'bg-blue-500/10 text-blue-600'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>Progress: {job.progress}%</span>
                  <span>{new Date(job.created_at).toLocaleDateString()}</span>
                </div>
                {job.progress > 0 && job.progress < 100 && (
                  <div className="mt-2 w-full h-1.5 bg-bg-base rounded overflow-hidden">
                    <div
                      className="h-full bg-accent-500 transition-all"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Training Schedule */}
      <div className="bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-text-primary">Training Schedule</h2>
        <fieldset className="space-y-2">
          <legend className="sr-only">Training schedule</legend>
          <div className="flex items-center gap-2 text-sm">
            <input type="radio" id="schedule-manual" name="schedule" value="manual"
                   checked={schedule === 'manual'} onChange={() => setSchedule('manual')} />
            <label htmlFor="schedule-manual">Manual (start manually)</label>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <input type="radio" id="schedule-auto" name="schedule" value="auto"
                   checked={schedule === 'auto'} onChange={() => setSchedule('auto')} />
            <label htmlFor="schedule-auto">Auto (train when GPU idle &gt; 10 min)</label>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <input type="radio" id="schedule-scheduled" name="schedule" value="scheduled"
                   checked={schedule === 'scheduled'} onChange={() => setSchedule('scheduled')} />
            <label htmlFor="schedule-scheduled">Scheduled — Set Time...</label>
          </div>
        </fieldset>
      </div>

      {/* Data Collection */}
      <div className="bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <Archive size={18} aria-hidden="true" />
          Data Collection
        </h2>

        {isServiceAvailable ? (
          <>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-text-muted">Completion Pairs</p>
                <p className="text-2xl font-bold text-text-primary">{stats?.completion_accepted ?? '—'}</p>
                <p className="text-xs text-text-muted">
                  {stats?.completion_accepted != null ? `${stats.completion_accepted} pairs` : 'Loading...'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-text-muted">Agent Trajectories</p>
                <p className="text-2xl font-bold text-text-primary">{stats?.task_completed_total ?? '—'}</p>
                <p className="text-xs text-text-muted">
                  {stats?.task_completed_total != null ? `${stats.task_completed_total} trajectories` : 'Loading...'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-text-muted">Correction Pairs</p>
                <p className="text-2xl font-bold text-text-primary">{stats?.completion_edited ?? '—'}</p>
                <p className="text-xs text-text-muted">
                  {stats?.completion_edited != null ? `${stats.completion_edited} pairs` : 'Loading...'}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-text-secondary">Training service status:</p>
              <ul className="space-y-1 text-text-primary">
                <li>• Total events collected: <span className="font-semibold">{eventCount}</span></li>
                <li>• Service: <span className="font-semibold text-green-400">✓ Running</span></li>
                <li>• Training status: <span className="font-semibold">{trainingStatus?.is_training ? 'Active' : 'Idle'}</span></li>
              </ul>
            </div>

            <div className="pt-2 border-t border-border-subtle space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Total training events:</span>
                <span className="text-text-primary font-semibold">{eventCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">24h events:</span>
                <span className="text-text-primary font-semibold">{stats?.recent_events_24h ?? '—'}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-border-subtle">
              <button className="px-3 py-1.5 text-sm rounded border border-border-default text-text-secondary hover:bg-bg-surface-3 cursor-pointer">
                Clear Dataset
              </button>
              <button className="px-3 py-1.5 text-sm rounded border border-border-default text-text-secondary hover:bg-bg-surface-3 cursor-pointer">
                Preview Samples
              </button>
              <button className="px-3 py-1.5 text-sm rounded border border-border-default text-text-secondary hover:bg-bg-surface-3 cursor-pointer">
                Export Dataset
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-text-muted">Training service unavailable</p>
        )}
      </div>

      {/* Dialogs */}
      <TrainingStartDialog open={startDialogOpen} onOpenChange={setStartDialogOpen} />
    </div>
  )
}
