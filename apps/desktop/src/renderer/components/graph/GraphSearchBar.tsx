import { Search } from 'lucide-react'

interface Props {
  value: string
  onChange: (q: string) => void
}

export function GraphSearchBar({ value, onChange }: Props) {
  return (
    <div className="relative flex items-center">
      <Search size={14} aria-hidden="true" className="absolute left-3 text-text-muted" />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search commits: 'bug fixes', 'last 10', 'refactors in auth'..."
        aria-label="Search decision graph"
        className="w-full bg-bg-surface-2 border border-border-default rounded-md pl-9 pr-3 py-2 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
      />
    </div>
  )
}
