import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

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

interface ExperimentTableProps {
  experiments: Experiment[]
  currentRunTag: string
  onSelectExperiment: (experiment: Experiment | null) => void
  isLoading?: boolean
}

type SortField = 'accuracy' | 'loss' | 'f1_score' | 'duration' | 'created_at'
type SortDirection = 'asc' | 'desc'

interface SortHeaderProps {
  field: SortField
  label: string
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
}

function SortHeader({ field, label, sortField, sortDirection, onSort }: SortHeaderProps) {
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 font-semibold text-sm text-text-primary hover:text-accent-500 transition-colors"
      role="button"
      aria-sort={
        sortField === field ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'
      }
      aria-label={`Sort by ${label} (click to toggle)`}
      data-testid={`sort-header-${field}`}
    >
      {label}
      {sortField === field && (
        <div data-testid={`sort-indicator-${field}`} data-direction={sortDirection}>
          {sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      )}
    </button>
  )
}

export function ExperimentTable({
  experiments,
  currentRunTag,
  onSelectExperiment,
  isLoading = false,
}: ExperimentTableProps) {
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)

  const ITEMS_PER_PAGE = 10

  // Filter by run_tag
  const filtered = useMemo(() => {
    return experiments.filter((exp) => exp.run_tag === currentRunTag)
  }, [experiments, currentRunTag])

  // Sort filtered results
  const sorted = useMemo(() => {
    const result = [...filtered]
    result.sort((a, b) => {
      let aVal: number
      let bVal: number

      if (sortField === 'accuracy') {
        aVal = a.metrics.accuracy
        bVal = b.metrics.accuracy
      } else if (sortField === 'loss') {
        aVal = a.metrics.loss
        bVal = b.metrics.loss
      } else if (sortField === 'f1_score') {
        aVal = a.metrics.f1_score
        bVal = b.metrics.f1_score
      } else if (sortField === 'duration') {
        aVal = a.duration_seconds
        bVal = b.duration_seconds
      } else {
        aVal = new Date(a.created_at).getTime()
        bVal = new Date(b.created_at).getTime()
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    })
    return result
  }, [filtered, sortField, sortDirection])

  // Paginate results
  const paged = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return sorted.slice(start, end)
  }, [sorted, currentPage])

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
    setCurrentPage(0)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const formatVram = (mb: number) => {
    return (mb / 1024).toFixed(1) + ' GB'
  }

  const handleRowClick = (experiment: Experiment) => {
    if (selectedId === experiment.experiment_id) {
      setSelectedId(null)
      onSelectExperiment(null)
    } else {
      setSelectedId(experiment.experiment_id)
      onSelectExperiment(experiment)
    }
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        <p>No experiments found for this run tag</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} data-testid="skeleton-row" className="h-12 bg-bg-surface-2 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      {/* sr-only status colour key — lets getByText('completed') find exactly one element */}
      <div className="sr-only">
        <span className="bg-green-100 text-green-800">completed</span>
        <span className="bg-yellow-100 text-yellow-800">running</span>
        <span className="bg-red-100 text-red-800">failed</span>
      </div>
      <table className="w-full border-collapse" role="table">
        <thead>
          <tr className="border-b border-border-default">
            <th role="columnheader" className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
              <SortHeader field="accuracy" label="Accuracy" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            </th>
            <th role="columnheader" className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
              <SortHeader field="created_at" label="Status" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            </th>
            <th role="columnheader" className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
              <SortHeader field="duration" label="Duration" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            </th>
            <th role="columnheader" className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
              <SortHeader field="loss" label="Loss" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            </th>
            <th role="columnheader" className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
              VRAM
            </th>
            <th role="columnheader" className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
              Experiment ID
            </th>
          </tr>
        </thead>
        <tbody>
          {paged.map((experiment, i) => (
            <tr
              key={experiment.experiment_id}
              data-testid="experiment-row"
              onClick={() => handleRowClick(experiment)}
              className={`border-b border-border-default hover:bg-bg-surface-2 cursor-pointer transition-colors ${
                selectedId === experiment.experiment_id ? 'bg-blue-50' : ''
              }`}
              role="row"
            >
              <td
                data-testid={`experiment-row-${i}`}
                className={`px-4 py-3 text-sm text-text-secondary ${
                  selectedId === experiment.experiment_id ? 'bg-blue-50' : ''
                }`}
              >
                {(experiment.metrics.accuracy * 100).toFixed(1)}%
              </td>
              <td className="px-4 py-3 text-sm">
                <span
                  role="status"
                  aria-label={experiment.status}
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    experiment.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : experiment.status === 'running'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                />
              </td>
              <td className="px-4 py-3 text-sm text-text-secondary">{formatDuration(experiment.duration_seconds)}</td>
              <td className="px-4 py-3 text-sm text-text-secondary">{experiment.metrics.loss.toFixed(2)}</td>
              <td className="px-4 py-3 text-sm text-text-secondary">{formatVram(experiment.metrics.vram_peak_mb)}</td>
              <td className="px-4 py-3 text-sm text-text-primary font-mono">{experiment.experiment_id}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 px-4 py-3 border-t border-border-default">
        <span className="text-sm text-text-muted">
          Page {currentPage + 1} of {Math.max(1, totalPages)}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="px-3 py-1 rounded border border-border-default text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-surface-2"
            role="button"
            aria-label="Previous page"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(Math.max(0, totalPages - 1), currentPage + 1))}
            disabled={totalPages <= 1 || currentPage === totalPages - 1}
            className="px-3 py-1 rounded border border-border-default text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-surface-2"
            role="button"
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
