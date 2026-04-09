import { X, Copy, Check } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Experiment {
  experiment_id: string
  program_id: string
  run_tag: string
  config: Record<string, unknown>
  status: 'completed' | 'running' | 'failed'
  duration_seconds: number
  created_at: string
  updated_at: string
  metrics: {
    accuracy: number
    f1_score: number
    loss: number
    vram_peak_mb: number
  }
  parent_experiment_id: string | null
}

interface ExperimentDetailModalProps {
  experiment: Experiment | null
  onClose: () => void
}

export function ExperimentDetailModal({ experiment, onClose }: ExperimentDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    if (copiedField) {
      const timeout = setTimeout(() => setCopiedField(null), 2000)
      return () => clearTimeout(timeout)
    }
  }, [copiedField])

  if (!experiment) {
    return null
  }

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-surface-1 rounded-lg border border-border-default max-w-2xl max-h-[90vh] overflow-y-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-default sticky top-0 bg-bg-surface-1">
          <div>
            <h2 className="text-xl font-bold text-text-primary">{experiment.experiment_id}</h2>
            <p className="text-sm text-text-muted mt-1">Run: {experiment.run_tag}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-surface-2 rounded transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Status & Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Status</p>
              <p className="text-sm font-medium text-text-primary mt-1 capitalize">{experiment.status}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Duration</p>
              <p className="text-sm font-medium text-text-primary mt-1">{formatDuration(experiment.duration_seconds)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Created</p>
              <p className="text-sm font-medium text-text-primary mt-1">
                {new Date(experiment.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Updated</p>
              <p className="text-sm font-medium text-text-primary mt-1">
                {new Date(experiment.updated_at).toLocaleString()}
              </p>
            </div>
            {experiment.parent_experiment_id && (
              <div className="col-span-2">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Parent Experiment</p>
                <p className="text-sm font-mono text-accent-500 mt-1">{experiment.parent_experiment_id}</p>
              </div>
            )}
          </div>

          {/* Metrics Table */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">Metrics</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="text-left px-3 py-2 font-semibold text-text-primary">Metric</th>
                    <th className="text-right px-3 py-2 font-semibold text-text-primary">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border-default hover:bg-bg-surface-2">
                    <td className="px-3 py-2 text-text-primary">Accuracy</td>
                    <td className="text-right px-3 py-2 text-text-secondary font-mono">
                      {(experiment.metrics.accuracy * 100).toFixed(2)}%
                    </td>
                  </tr>
                  <tr className="border-b border-border-default hover:bg-bg-surface-2">
                    <td className="px-3 py-2 text-text-primary">F1 Score</td>
                    <td className="text-right px-3 py-2 text-text-secondary font-mono">
                      {experiment.metrics.f1_score.toFixed(4)}
                    </td>
                  </tr>
                  <tr className="border-b border-border-default hover:bg-bg-surface-2">
                    <td className="px-3 py-2 text-text-primary">Loss</td>
                    <td className="text-right px-3 py-2 text-text-secondary font-mono">
                      {experiment.metrics.loss.toFixed(4)}
                    </td>
                  </tr>
                  <tr className="hover:bg-bg-surface-2">
                    <td className="px-3 py-2 text-text-primary">Peak VRAM</td>
                    <td className="text-right px-3 py-2 text-text-secondary font-mono">
                      {(experiment.metrics.vram_peak_mb / 1024).toFixed(2)} GB
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Config */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Configuration</h3>
              <button
                onClick={() => handleCopy(JSON.stringify(experiment.config, null, 2), 'config')}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-bg-surface-2 text-accent-500 hover:text-accent-600 transition-colors"
              >
                {copiedField === 'config' ? (
                  <>
                    <Check size={14} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="bg-bg-surface-2 border border-border-default rounded p-4 text-xs overflow-x-auto text-text-secondary">
              {JSON.stringify(experiment.config, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-default bg-bg-surface-1 sticky bottom-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
