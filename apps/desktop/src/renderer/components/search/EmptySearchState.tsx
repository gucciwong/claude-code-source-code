import React from 'react'
import { Search } from 'lucide-react'

export function EmptySearchState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Search size={40} aria-hidden="true" className="text-text-muted" />
      <p className="text-text-muted text-sm">Search your codebase by meaning</p>
      <p className="text-text-muted text-xs max-w-sm text-center">
        Index your code files, then type a natural language query like "function that handles authentication"
      </p>
    </div>
  )
}
