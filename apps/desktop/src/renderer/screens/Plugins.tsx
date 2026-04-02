import React, { useEffect } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Puzzle, RefreshCw } from 'lucide-react'
import { usePluginSystem } from '../hooks/usePluginSystem'
import { usePluginStore } from '../store/pluginStore'
import { PluginCard, HooksList } from '../components/plugins'

export function Plugins() {
  const { fetchPlugins, unregisterPlugin, togglePlugin } = usePluginSystem()
  const { plugins, isLoading } = usePluginStore()

  useEffect(() => {
    fetchPlugins()
  }, [fetchPlugins])

  const handleToggle = (id: string, enabled: boolean) => togglePlugin(id, enabled)
  const handleRemove = (id: string) => unregisterPlugin(id)

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <Puzzle size={20} aria-hidden="true" className="text-accent-400" />
            <h1 className="text-text-primary text-xl font-semibold">Plugin Extension System</h1>
          </div>
          <button
            onClick={() => fetchPlugins()}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-surface-3 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            aria-label="Refresh plugins"
          >
            <RefreshCw size={14} aria-hidden="true" />
          </button>
        </div>
        <p className="text-text-secondary text-sm">Extend Sovereign Coder with custom plugins</p>
      </div>

      <Tabs.Root defaultValue="installed" className="flex flex-col flex-1 min-h-0">
        <Tabs.List className="flex gap-1 px-6 pt-4 border-b border-border-subtle">
          {(['installed', 'hooks', 'guide'] as const).map(t => (
            <Tabs.Trigger
              key={t}
              value={t}
              className="text-sm px-3 py-1.5 rounded-t capitalize text-text-secondary data-[state=active]:text-text-primary data-[state=active]:bg-bg-surface-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              {t === 'installed' ? `Installed (${plugins.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="flex-1 overflow-y-auto p-6">
          <Tabs.Content value="installed">
            {isLoading ? (
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <RefreshCw size={14} className="animate-spin" aria-hidden="true" />
                Loading plugins…
              </div>
            ) : plugins.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <Puzzle size={40} aria-hidden="true" className="text-text-muted" />
                <p className="text-text-muted text-sm">No plugins installed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {plugins.map(p => (
                  <PluginCard key={p.id} plugin={p} onToggle={handleToggle} onRemove={handleRemove} />
                ))}
              </div>
            )}
          </Tabs.Content>
          <Tabs.Content value="hooks">
            <HooksList />
          </Tabs.Content>
          <Tabs.Content value="guide">
            <div>
              <h3 className="text-text-primary text-sm font-medium mb-3">Plugin Development Guide</h3>
              <p className="text-text-secondary text-sm">
                Create a manifest JSON and POST to <code className="text-text-code">/plugins/register</code> to install a plugin.
              </p>
            </div>
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  )
}
