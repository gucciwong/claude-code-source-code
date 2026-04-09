import { Cpu, HardDrive } from 'lucide-react'
import { CompatibilityCheck, CompatibilityReport } from '../../utils/modelCompatibility'

function statusClasses(status: CompatibilityCheck['status']) {
  switch (status) {
    case 'pass':
      return {
        badge: 'bg-green-500/15 text-green-300 border-green-500/40',
        bar: 'bg-green-500',
      }
    case 'warn':
      return {
        badge: 'bg-yellow-500/15 text-yellow-200 border-yellow-500/40',
        bar: 'bg-yellow-500',
      }
    case 'fail':
      return {
        badge: 'bg-red-500/15 text-red-300 border-red-500/40',
        bar: 'bg-red-500',
      }
    default:
      return {
        badge: 'bg-bg-surface-3 text-text-muted border-border-default',
        bar: 'bg-text-muted',
      }
  }
}

function statusLabel(status: CompatibilityCheck['status']) {
  switch (status) {
    case 'pass':
      return 'Pass'
    case 'warn':
      return 'Tight'
    case 'fail':
      return 'Blocked'
    default:
      return 'Unknown'
  }
}

function resourceIcon(label: CompatibilityCheck['label']) {
  if (label === 'CPU Threads') {
    return <Cpu size={16} aria-hidden="true" />
  }
  if (label === 'RAM') {
    return <HardDrive size={16} aria-hidden="true" />
  }
  if (label === 'GPU / VRAM') {
    return <Cpu size={16} aria-hidden="true" />
  }
  return <HardDrive size={16} aria-hidden="true" />
}

interface HardwareCompatibilityCardProps {
  report: CompatibilityReport | null
  title?: string
  emptyState?: string
}

export function HardwareCompatibilityCard({
  report,
  title = 'Hardware Fit',
  emptyState = 'Select or load a model to compare CPU, RAM, GPU, VRAM, and storage needs.',
}: HardwareCompatibilityCardProps) {
  if (!report) {
    return (
      <div className="bg-bg-surface-2 border border-border-default rounded-lg p-5">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h4 className="text-base font-semibold text-text-primary">{title}</h4>
          <span className="text-xs px-2 py-1 rounded border border-border-default text-text-muted">Waiting for model</span>
        </div>
        <p className="text-sm text-text-muted">{emptyState}</p>
      </div>
    )
  }

  const overall = statusClasses(report.overallStatus)

  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h4 className="text-base font-semibold text-text-primary">{title}</h4>
          <p className="text-sm text-text-secondary mt-1">{report.modelName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded border ${overall.badge}`}>
            {statusLabel(report.overallStatus)}
          </span>
          <span className="text-sm font-semibold text-text-primary">{report.score}/100</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {report.checks.map((check) => {
          const styles = statusClasses(check.status)
          const width = check.ratio == null ? 0 : Math.max(8, Math.min(check.ratio * 100, 100))
          return (
            <article
              key={check.label}
              className="rounded-md border border-border-default bg-bg-surface-3 p-4"
              aria-label={`${check.label}: ${statusLabel(check.status)}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 text-text-primary">
                  {resourceIcon(check.label)}
                  <span className="text-sm font-medium">{check.label}</span>
                </div>
                <span className={`text-[11px] px-2 py-1 rounded border ${styles.badge}`}>
                  {statusLabel(check.status)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-text-secondary mb-2">
                <span>Available: {check.available}</span>
                <span>Need: {check.required}</span>
              </div>
              <div className="h-2 rounded-full bg-bg-base overflow-hidden mb-2" aria-hidden="true">
                <div className={`h-full ${styles.bar}`} style={{ width: `${width}%` }} />
              </div>
              <p className="text-xs text-text-muted">{check.detail}</p>
            </article>
          )
        })}
      </div>

      <div className="mt-4 rounded-md border border-border-default bg-bg-base px-4 py-3">
        <p className="text-sm font-medium text-text-primary mb-1">{report.summary}</p>
        <p className="text-xs text-text-muted">Recommended runtime: {report.recommendedRuntime}</p>
      </div>
    </div>
  )
}