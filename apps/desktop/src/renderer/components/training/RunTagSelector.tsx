import { ChevronDown } from 'lucide-react'

interface RunTagSelectorProps {
  runTags: string[]
  currentRunTag: string
  onRunTagChange: (runTag: string) => void
  isLoading?: boolean
}

export function RunTagSelector({
  runTags,
  currentRunTag,
  onRunTagChange,
  isLoading = false,
}: RunTagSelectorProps) {
  if (runTags.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="run-tag-select" className="text-sm font-medium text-text-primary">
        Run Tag:
      </label>
      <div className="relative">
        <select
          id="run-tag-select"
          value={currentRunTag}
          onChange={(e) => onRunTagChange(e.target.value)}
          disabled={isLoading}
          className="appearance-none px-3 py-2 pr-8 border border-border-default rounded-lg bg-bg-surface-2 text-text-primary font-medium cursor-pointer hover:border-border-default focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {runTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted"
        />
      </div>

      {/* Stats badge */}
      <div className="text-xs text-text-muted bg-bg-surface-2 px-2 py-1 rounded">
        {runTags.length} run{runTags.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
