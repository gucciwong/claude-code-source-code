import { useState } from 'react'
import { Search } from 'lucide-react'
import { Snippet } from '../../store/knowledgeLibraryStore'
import { KnowledgeCard } from './KnowledgeCard'

interface SnippetBrowserProps {
  snippets: Snippet[]
  onDelete?: (id: string) => void
}

export function SnippetBrowser({ snippets, onDelete }: SnippetBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [languageFilter, setLanguageFilter] = useState('all')

  const languages = Array.from(new Set(snippets.map((s) => s.language))).sort()

  const filtered = snippets.filter((s) => {
    const matchesQuery =
      searchQuery === '' ||
      s.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.domain.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLang = languageFilter === 'all' || s.language === languageFilter
    return matchesQuery && matchesLang
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Controls row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search snippets…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-bg-surface-3 border border-border-default text-text-primary placeholder-text-muted rounded-md pl-8 pr-3 py-2 text-sm w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          />
        </div>
        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
          className="bg-bg-surface-3 border border-border-default text-text-primary rounded-md px-3 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
          <option value="all">All Languages</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      {/* Count */}
      <p className="text-text-secondary text-sm">{filtered.length} snippets</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-text-muted text-sm">
          No snippets yet. Start coding to build your knowledge base.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((snippet) => (
            <KnowledgeCard key={snippet.id} snippet={snippet} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
