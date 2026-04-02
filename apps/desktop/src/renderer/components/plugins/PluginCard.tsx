import React from 'react'
import { Puzzle, Trash2, ToggleLeft, ToggleRight, Tag } from 'lucide-react'
import type { PluginManifest } from '../../../shared/pluginSystem'

interface PluginCardProps {
  plugin: PluginManifest
  onToggle: (id: string, enabled: boolean) => void
  onRemove: (id: string) => void
}

export function PluginCard({ plugin, onToggle, onRemove }: PluginCardProps) {
  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Puzzle size={20} aria-hidden="true" className="text-accent-400 mt-0.5" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-text-primary text-sm font-semibold">{plugin.name}</span>
              <span className="text-text-muted text-xs bg-bg-surface-3 px-1.5 py-0.5 rounded">{plugin.version}</span>
            </div>
            <p className="text-text-secondary text-xs mb-2">{plugin.description}</p>
            <div className="flex items-center gap-1 flex-wrap">
              {plugin.hooks.map(h => (
                <span key={h} className="flex items-center gap-1 text-xs text-accent-400 bg-accent-500/10 px-1.5 py-0.5 rounded">
                  <Tag size={10} aria-hidden="true" />
                  {h}
                </span>
              ))}
            </div>
            <p className="text-text-muted text-xs mt-1">by {plugin.author}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(plugin.id, !plugin.enabled)}
            className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded"
            aria-label={plugin.enabled ? `Disable ${plugin.name}` : `Enable ${plugin.name}`}
          >
            {plugin.enabled
              ? <ToggleRight size={22} aria-hidden="true" className="text-green-500" />
              : <ToggleLeft size={22} aria-hidden="true" className="text-text-muted" />
            }
          </button>
          <button
            onClick={() => onRemove(plugin.id)}
            className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            aria-label={`Remove ${plugin.name}`}
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
