import React, { useEffect, useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Brain, Search, RefreshCw, Plus } from 'lucide-react'
import { useConversationMemory } from '../hooks/useConversationMemory'
import { useMemoryStore } from '../store/memoryStore'
import { MemoryCard, ContextViewer } from '../components/memory'

export function ConversationMemory() {
  const { fetchMemories, addMemoryItem, searchMemories, deleteMemory, buildContext } = useConversationMemory()
  const { memories, searchResults, contextSummary, isLoading } = useMemoryStore()
  const [newText, setNewText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [contextQuery, setContextQuery] = useState('')

  useEffect(() => { fetchMemories() }, [fetchMemories])

  const handleAdd = async () => {
    if (newText.trim()) {
      await addMemoryItem(newText)
      setNewText('')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <Brain size={20} aria-hidden="true" className="text-accent-400" />
            <h1 className="text-text-primary text-xl font-semibold">Conversation Memory</h1>
          </div>
          <button
            onClick={fetchMemories}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-surface-3 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            aria-label="Refresh memories"
          >
            <RefreshCw size={14} aria-hidden="true" />
          </button>
        </div>
        <p className="text-text-secondary text-sm">TF-IDF relevance ranking · context compression</p>
      </div>

      <Tabs.Root defaultValue="memories" className="flex flex-col flex-1 min-h-0">
        <Tabs.List className="flex gap-1 px-6 pt-4 border-b border-border-subtle">
          {(['memories', 'search', 'context'] as const).map(t => (
            <Tabs.Trigger
              key={t}
              value={t}
              className="text-sm px-3 py-1.5 rounded-t capitalize text-text-secondary data-[state=active]:text-text-primary data-[state=active]:bg-bg-surface-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              {t === 'memories' ? `Memories (${memories.length})` : t === 'search' ? `Search (${searchResults.length})` : 'Context'}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="flex-1 overflow-y-auto p-6">
          <Tabs.Content value="memories">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newText}
                onChange={e => setNewText(e.target.value)}
                placeholder="Add a new memory..."
                aria-label="New memory text"
                className="flex-1 bg-bg-surface-2 border border-border-default rounded-md px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder:text-text-muted"
              />
              <button
                onClick={handleAdd}
                className="flex items-center gap-1 bg-accent-500 hover:bg-accent-400 text-text-primary text-sm px-3 py-1.5 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                aria-label="Add memory"
              >
                <Plus size={14} aria-hidden="true" />
                Add
              </button>
            </div>
            {memories.length === 0
              ? <p className="text-text-muted text-sm">No memories yet.</p>
              : <div className="space-y-2">{memories.map(m => <MemoryCard key={m.id} memory={m} onDelete={deleteMemory} />)}</div>
            }
          </Tabs.Content>

          <Tabs.Content value="search">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search memories..."
                aria-label="Search query"
                className="flex-1 bg-bg-surface-2 border border-border-default rounded-md px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder:text-text-muted"
              />
              <button
                onClick={() => searchMemories(searchQuery)}
                className="flex items-center gap-1 border border-border-default text-text-secondary hover:bg-bg-surface-3 text-sm px-3 py-1.5 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                aria-label="Search"
              >
                <Search size={14} aria-hidden="true" />
                Search
              </button>
            </div>
            {searchResults.length === 0
              ? <p className="text-text-muted text-sm">Enter a query to search memories.</p>
              : <div className="space-y-2">{searchResults.map(r => <MemoryCard key={r.memory.id} memory={r.memory} onDelete={deleteMemory} />)}</div>
            }
          </Tabs.Content>

          <Tabs.Content value="context">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={contextQuery}
                onChange={e => setContextQuery(e.target.value)}
                placeholder="Build context for query..."
                aria-label="Context query"
                className="flex-1 bg-bg-surface-2 border border-border-default rounded-md px-3 py-1.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder:text-text-muted"
              />
              <button
                onClick={() => buildContext(contextQuery)}
                disabled={isLoading}
                className="flex items-center gap-1 bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-text-primary text-sm px-3 py-1.5 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                aria-label="Build context"
              >
                Build Context
              </button>
            </div>
            {contextSummary && <ContextViewer summary={contextSummary} />}
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  )
}
