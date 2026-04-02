import { useEffect, useState } from 'react'
import { Pause, Play, Square, Zap, TrendingUp, Archive } from 'lucide-react'
import { useTrainingService } from '../hooks/useTrainingService'
import { useSystemStore } from '../store/systemStore'

interface TrainingRun {
  id: string
  version: string
  sample_count: number
  validation_loss: number
  improvement: number
  training_time: string
  status: 'completed' | 'rejected'
  timestamp: string
}

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
  const { trainingStatus, isTraining, eventCount, isServiceAvailable, getStats } = useTrainingService()
  const { vramUsed, vramTotal, gpuTemp } = useSystemStore()

  const isRunning = isTraining
  const progress = trainingStatus && trainingStatus.is_training
    ? Math.round((trainingStatus.quick_train_count / Math.max(trainingStatus.quick_train_count + trainingStatus.next_full_train_in, 1)) * 100)
    : 0

  useEffect(() => {
    if (isServiceAvailable) {
      getStats().then((s) => {
        if (s) setStats(s as TrainingStats)
      })
    }
  }, [isServiceAvailable, getStats])

  // Training runs history — no list API available yet; populated when service exposes it
  const trainingRuns: TrainingRun[] = []

  return (
    <div data-testid="screen-training" className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Training Console</h1>
        <p className="text-sm text-text-muted mt-1">Monitor and schedule QLoRA fine-tuning runs</p>
      </div>

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
              <>
                Cycle: {trainingStatus?.active_cycle ?? '—'} · Quick trains: {trainingStatus?.quick_train_count ?? '—'} · Full in: {trainingStatus?.next_full_train_in ?? '—'}
              </>
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
                className="flex items-center gap-2 px-3 py-2 text-sm rounded border border-border-default text-text-secondary hover:bg-bg-surface-3 cursor-pointer"
              >
                <Pause size={14} aria-hidden="true" />
                Pause
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 text-sm rounded border border-border-default text-red-400 hover:bg-red-500/10 cursor-pointer"
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
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-400 text-text-primary rounded font-medium cursor-pointer"
          >
            <Play size={16} aria-hidden="true" />
            Start Training
          </button>
        )}
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
                  {stats?.completion_accepted != null ? `${stats.completion_accepted} completion pairs` : 'Loading...'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-text-muted">Agent Trajectories</p>
                <p className="text-2xl font-bold text-text-primary">{stats?.task_completed_total ?? '—'}</p>
                <p className="text-xs text-text-muted">
                  {stats?.task_completed_total != null ? `${stats.task_completed_total} agent trajectories` : 'Loading...'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-text-muted">Correction Pairs</p>
                <p className="text-2xl font-bold text-text-primary">{stats?.completion_edited ?? '—'}</p>
                <p className="text-xs text-text-muted">
                  {stats?.completion_edited != null ? `${stats.completion_edited} correction pairs` : 'Loading...'}
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
                <span className="text-text-muted">Service uptime:</span>
                <span className="text-text-primary font-semibold">{trainingStatus?.uptime_seconds ? Math.floor(trainingStatus.uptime_seconds / 3600) + 'h' : '-'}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2 text-sm">
            <p className="text-red-400">⚠ Training service unavailable</p>
            <p className="text-text-secondary">Make sure the training service is running at <code className="text-xs bg-bg-surface-3 px-2 py-1 rounded">http://localhost:8001</code></p>
            <p className="text-text-muted text-xs mt-2">See TRAINING_INTEGRATION.md for setup instructions.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <button className="px-3 py-1.5 text-xs rounded border border-border-default text-text-secondary hover:bg-bg-surface-3 cursor-pointer">
            Clear Dataset
          </button>
          <button className="px-3 py-1.5 text-xs rounded border border-border-default text-text-secondary hover:bg-bg-surface-3 cursor-pointer">
            Preview Samples
          </button>
          <button className="px-3 py-1.5 text-xs rounded border border-border-default text-text-secondary hover:bg-bg-surface-3 cursor-pointer">
            Export Dataset
          </button>
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-text-primary">Schedule</h2>

        <div className="space-y-3">
          {(['manual', 'auto', 'scheduled'] as const).map((mode) => (
            <label key={mode} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="schedule"
                value={mode}
                checked={schedule === mode}
                onChange={(e) => setSchedule(e.target.value as typeof mode)}
                className="w-4 h-4 rounded-full"
              />
              <span className="text-sm text-text-secondary">
                {mode === 'manual' && 'Manual (start manually)'}
                {mode === 'auto' && 'Auto (train when GPU idle > 10 min)'}
                {mode === 'scheduled' && 'Scheduled — Set Time...'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Version History */}
      <div className="bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <TrendingUp size={18} aria-hidden="true" />
          Version History
        </h2>

        <div className="space-y-3">
          {trainingRuns.length === 0 ? (
            <p className="text-sm text-text-muted">No training history available from service.</p>
          ) : trainingRuns.map((run) => (
            <div
              key={run.id}
              className="flex items-center justify-between p-3 border border-border-subtle rounded-lg hover:bg-bg-surface-3 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary">{run.version}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    run.status === 'completed'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {run.status === 'completed' ? '✓ Submitted' : '✗ Rejected'}
                  </span>
                </div>
                <p className="text-xs text-text-muted">
                  {run.sample_count} samples · {run.training_time} training · Val loss: {run.validation_loss}
                </p>
              </div>

              <div className="text-right space-y-1">
                <p className="text-sm font-semibold text-text-primary">
                  {run.improvement > 0 ? '+' : ''}{run.improvement}% HumanEval
                </p>
                <p className="text-xs text-text-muted">{run.timestamp}</p>
              </div>

              <div className="flex gap-2 ml-4">
                <button className="px-2 py-1 text-xs rounded border border-border-default text-text-secondary hover:bg-bg-surface-1 cursor-pointer">
                  Load
                </button>
                <button className="px-2 py-1 text-xs rounded border border-border-default text-text-secondary hover:bg-bg-surface-1 cursor-pointer">
                  Export
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
