import { useSystemStore } from '../store/systemStore'
import { useNavigationStore } from '../store/navigationStore'
import { MessageSquare, Zap, BookOpen, Activity } from 'lucide-react'
import { SystemPanel } from '../components/common/SystemPanel'
import { ErrorBoundary } from '../components/common/ErrorBoundary'

function VramBar({ used, total }: { used: number | null; total: number | null }) {
  const pct = used != null && total != null && total > 0 ? Math.min((used / total) * 100, 100) : 0
  return (
    <div
      className="w-full h-2 bg-bg-surface-3 rounded-full overflow-hidden"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="VRAM usage"
    >
      <div
        className="h-full bg-accent-500 rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function HealthDot({ status }: { status: 'ok' | 'warn' | 'idle' }) {
  const color =
    status === 'ok' ? 'bg-green-500' : status === 'warn' ? 'bg-yellow-400' : 'bg-text-muted'
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} aria-hidden="true" />
}

export function Dashboard() {
  const { activeModel, tokensPerSec, vramUsed, vramTotal, gpuTemp, trainingStatus, ollamaOnline } =
    useSystemStore()
  const setActive = useNavigationStore((s) => s.setActive)

  const inferenceStatus: 'ok' | 'warn' | 'idle' = ollamaOnline ? 'ok' : 'idle'
  const gpuStatus: 'ok' | 'warn' | 'idle' =
    gpuTemp != null && gpuTemp > 85 ? 'warn' : gpuTemp != null && gpuTemp > 0 ? 'ok' : 'idle'
  const trainingDotStatus: 'ok' | 'warn' | 'idle' = trainingStatus === 'running' ? 'ok' : 'idle'

  return (
    <div data-testid="screen-dashboard" className="p-6 space-y-6">
      {/* Hero: Active Model Card */}
      <div className="bg-bg-surface-2 border border-border-default rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {activeModel ?? 'No model loaded'}
            </h2>
            {activeModel && (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-local-badge-bg text-local-badge-fg">
                local
              </span>
            )}
          </div>
          <span className="text-sm text-text-muted">
            {tokensPerSec != null && tokensPerSec > 0 ? `${tokensPerSec} tok/s` : '—'}
          </span>
        </div>

        <VramBar used={vramUsed} total={vramTotal} />
        <p className="text-xs text-text-muted">
          {vramUsed != null ? vramUsed.toFixed(1) : '—'} /{' '}
          {vramTotal != null ? vramTotal.toFixed(1) : '—'} GB VRAM
        </p>

        <button
          className="bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          onClick={() => setActive('chat')}
        >
          <MessageSquare size={16} aria-hidden="true" />
          Open Chat
        </button>
      </div>

      {/* Health strip */}
      <div className="flex items-center gap-4 text-sm text-text-secondary">
        <span className="flex items-center gap-1.5">
          <HealthDot status={inferenceStatus} />
          Inference: {ollamaOnline ? 'Ready' : 'Offline'}
        </span>
        <span className="flex items-center gap-1.5">
          <HealthDot status={gpuStatus} />
          GPU: {gpuTemp != null && gpuTemp > 0 ? `${gpuTemp}°C` : 'N/A'}
        </span>
        <span className="flex items-center gap-1.5">
          <HealthDot status={trainingDotStatus} />
          Training: {trainingStatus === 'running' ? 'Running' : 'Idle'}
        </span>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <button
          className="border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-3 py-1.5 text-sm cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          onClick={() => setActive('chat')}
        >
          <MessageSquare size={16} aria-hidden="true" />
          Open Chat
        </button>
        <button
          className="border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-3 py-1.5 text-sm cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          onClick={() => setActive('training')}
        >
          <Zap size={16} aria-hidden="true" />
          Start Training
        </button>
        <button
          className="border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-3 py-1.5 text-sm cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          onClick={() => setActive('models')}
        >
          <BookOpen size={16} aria-hidden="true" />
          Browse Models
        </button>
        <button
          className="border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-3 py-1.5 text-sm cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          onClick={() => setActive('settings')}
        >
          <Activity size={16} aria-hidden="true" />
          System Health
        </button>
      </div>

      {/* System panel with health and benchmark tabs */}
      <ErrorBoundary label="SystemPanel">
        <SystemPanel />
      </ErrorBoundary>
    </div>
  )
}
