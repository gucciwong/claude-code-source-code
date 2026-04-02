import React, { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Code, Zap, Settings } from 'lucide-react'
import { useCodeCompletion } from '../hooks/useCodeCompletion'
import { useCodeCompletionStore } from '../store/codeCompletionStore'
import { CompletionDropdown } from '../components/completion'

export function CodeCompletion() {
  const { getCompletions, submitFeedback } = useCodeCompletion()
  const { completions, isLoading, prefix, setPrefix } = useCodeCompletionStore()
  const [context, setContext] = useState('')

  const handleGetCompletions = async () => {
    if (prefix.trim()) {
      await getCompletions({ prefix, context, max_results: 3 })
    }
  }

  const handleAccept = async (text: string) => {
    await submitFeedback({ completion: text, accepted: true })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-border-subtle">
        <div className="flex items-center gap-3 mb-1">
          <Code size={20} aria-hidden="true" className="text-accent-400" />
          <h1 className="text-text-primary text-xl font-semibold">Code Completions</h1>
        </div>
        <p className="text-text-secondary text-sm">N-gram prefix model with feedback learning</p>
      </div>

      <Tabs.Root defaultValue="editor" className="flex flex-col flex-1 min-h-0">
        <Tabs.List className="flex gap-1 px-6 pt-4 border-b border-border-subtle">
          {(['editor', 'completions', 'settings'] as const).map(t => (
            <Tabs.Trigger
              key={t}
              value={t}
              className="text-sm px-3 py-1.5 rounded-t capitalize text-text-secondary data-[state=active]:text-text-primary data-[state=active]:bg-bg-surface-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              {t === 'completions'
                ? `Completions (${completions.length})`
                : t.charAt(0).toUpperCase() + t.slice(1)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="flex-1 overflow-y-auto p-6">
          <Tabs.Content value="editor">
            <div className="space-y-4">
              <div>
                <label className="block text-text-secondary text-xs mb-1.5" htmlFor="context-input">
                  Context (optional)
                </label>
                <textarea
                  id="context-input"
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  placeholder="Paste code context here..."
                  rows={6}
                  className="w-full bg-bg-surface-2 border border-border-default rounded-lg px-3 py-2 text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder:text-text-muted resize-none"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-xs mb-1.5" htmlFor="prefix-input">
                  Prefix / Current Word
                </label>
                <input
                  id="prefix-input"
                  type="text"
                  value={prefix}
                  onChange={e => setPrefix(e.target.value)}
                  placeholder="e.g. def"
                  className="w-full bg-bg-surface-2 border border-border-default rounded-lg px-3 py-2 text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder:text-text-muted"
                />
              </div>
              <button
                onClick={handleGetCompletions}
                disabled={isLoading || !prefix.trim()}
                className="flex items-center gap-2 bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-text-primary text-sm font-medium px-4 py-2 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                <Zap size={14} aria-hidden="true" />
                Get Completions
              </button>
              {completions.length > 0 && (
                <div className="mt-2">
                  <CompletionDropdown onAccept={handleAccept} />
                </div>
              )}
            </div>
          </Tabs.Content>

          <Tabs.Content value="completions">
            {completions.length === 0 ? (
              <p className="text-text-muted text-sm">No completions yet. Enter a prefix in the Editor tab.</p>
            ) : (
              <CompletionDropdown onAccept={handleAccept} />
            )}
          </Tabs.Content>

          <Tabs.Content value="settings">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Settings size={16} aria-hidden="true" className="text-accent-400" />
                <span className="text-text-secondary text-sm">Model: N-gram (bigram)</span>
              </div>
              <p className="text-text-muted text-xs">Port: 8015 · Max results: 3 · Window: 10 lines</p>
            </div>
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  )
}
