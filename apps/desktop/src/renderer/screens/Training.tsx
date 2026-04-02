import { useState } from 'react'
import { Pause, Play, Square, Zap, TrendingUp, Archive } from 'lucide-react'
import { useTrainingService } from '../hooks/useTrainingService'

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

export function Training() {
  const [isRunning, setIsRunning] = useState(false)
  const [schedule, setSchedule] = useState<'manual' | 'auto' | 'scheduled'>('auto')
  const [progress, setProgress] = useState(48)
  const { trainingStatus, eventCount, isServiceAvailable } = useTrainingService()

  const trainingRuns: TrainingRun[] = [
    {
      id: '1',
      version: 'v1.4',
      sample_count: 847,
      validation_loss: 0.341,
      improvement: 3.2,
      training_time: '4h 12m',
      status: 'completed',
      timestamp: 'Apr 1, 02:14',
    },
    {
      id: '2',
      version: 'v1.3',
      sample_count: 720,
      validation_loss: 0.368,
      improvement: 1.8,
      training_time: '3h 58m',
      status: 'completed',
      timestamp: 'Mar 31, 22:00',
    },
    {
      id: '3',
      version: 'v1.2',
      sample_count: 650,
      validation_loss: 0.375,
      improvement: 0.4,
      training_time: '3h 45m',
      status: 'rejected',
      timestamp: 'Mar 31, 14:00',
    },
  ]

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
                Iteration 23/48 · Elapsed: 02:18:34 · ETA: 04:01h
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
                <p className="text-text-primary font-semibold">0.312 <span className="text-green-400">↓</span></p>
              </div>
              <div className="space-y-1">
                <span className="text-text-muted">Val Loss</span>
                <p className="text-text-primary font-semibold">0.341 <span className="text-green-400">↓</span></p>
              </div>
              <div className="space-y-1">
                <span className="text-text-muted">Learning Rate</span>
                <p className="text-text-primary font-mono">1.2e-4</p>
              </div>
            </div>

            <div className="pt-2 border-t border-border-subtle">
              <p className="text-xs text-text-muted mb-2">GPU: RTX 4090 · VRAM: 22.1/24 GB · Temp: 78°C · TDP: 310W</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsRunning(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded border border-border-default text-text-secondary hover:bg-bg-surface-3 cursor-pointer"
              >
                <Pause size={14} aria-hidden="true" />
                Pause
              </button>
              <button
                onClick={() => setIsRunning(false)}
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
            onClick={() => setIsRunning(true)}
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
                <p className="text-2xl font-bold text-text-primary">847</p>
                <p className="text-xs text-text-muted">847 completion pairs</p>
              </div>
              <div className="space-y-1">
                <p className="text-text-muted">Agent Trajectories</p>
                <p className="text-2xl font-bold text-text-primary">12</p>
                <p className="text-xs text-text-muted">12 agent trajectories</p>
              </div>
              <div className="space-y-1">
                <p className="text-text-muted">Correction Pairs</p>
                <p className="text-2xl font-bold text-text-primary">203</p>
                <p className="text-xs text-text-muted">203 correction pairs</p>
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
          {trainingRuns.map((run) => (
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
