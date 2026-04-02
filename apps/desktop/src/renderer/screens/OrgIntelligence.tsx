import React, { useEffect, useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Users, Search } from 'lucide-react'
import { useOrgIntelligence } from '../hooks/useOrgIntelligence'
import { useOrgIntelligenceStore } from '../store/orgIntelligenceStore'
import { PatternCard, SkillGapChart, BottleneckList, ContributePatternDialog } from '../components/org'

export function OrgIntelligence() {
  const [searchQuery, setSearchQuery] = useState('')
  const { listPatterns, searchPatterns, getSkillGaps, getBottlenecks } = useOrgIntelligence()
  const { sharedPatterns, skillGapReport, bottlenecks, searchResults } = useOrgIntelligenceStore()

  useEffect(() => {
    listPatterns()
    getSkillGaps()
    getBottlenecks()
  }, [listPatterns, getSkillGaps, getBottlenecks])

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchPatterns(searchQuery)
    }
  }

  const displayPatterns = searchResults.length > 0 ? searchResults : sharedPatterns

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Users size={20} aria-hidden="true" className="text-accent-400" />
              <h1 className="text-text-primary text-xl font-semibold">Org Intelligence</h1>
            </div>
            <p className="text-text-secondary text-sm">Share anonymized patterns and discover team insights</p>
          </div>
          <ContributePatternDialog />
        </div>
      </div>

      <Tabs.Root defaultValue="patterns" className="flex flex-col flex-1 min-h-0">
        <Tabs.List className="flex gap-1 px-6 border-b border-border-subtle bg-bg-surface-1" aria-label="Org intelligence tabs">
          {(['patterns', 'skill-gaps', 'bottlenecks'] as const).map(tab => (
            <Tabs.Trigger
              key={tab}
              value={tab}
              className="px-4 py-3 text-sm text-text-secondary hover:text-text-primary data-[state=active]:text-text-primary data-[state=active]:border-b-2 data-[state=active]:border-accent-500 -mb-px cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 capitalize"
            >
              {tab.replace('-', ' ')}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="patterns" className="flex-1 overflow-y-auto p-6">
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={14} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search patterns…"
                className="w-full bg-bg-surface-3 border border-border-default rounded-md pl-9 pr-3 py-2 text-text-primary text-sm placeholder-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                aria-label="Search patterns"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-accent-500 hover:bg-accent-400 text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              Search
            </button>
          </div>
          {displayPatterns.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} aria-hidden="true" className="text-text-muted mx-auto mb-4" />
              <p className="text-text-primary text-lg font-medium mb-2">No patterns yet</p>
              <p className="text-text-secondary text-sm">Contribute your first anonymized code pattern to get started</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {displayPatterns.map(pattern => (
                <PatternCard key={pattern.id} pattern={pattern} />
              ))}
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="skill-gaps" className="flex-1 overflow-y-auto p-6">
          {skillGapReport ? (
            <SkillGapChart report={skillGapReport} />
          ) : (
            <p className="text-text-muted text-sm text-center py-8">Loading skill gaps…</p>
          )}
        </Tabs.Content>

        <Tabs.Content value="bottlenecks" className="flex-1 overflow-y-auto p-6">
          <BottleneckList bottlenecks={bottlenecks} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
