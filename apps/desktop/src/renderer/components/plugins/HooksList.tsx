import React from 'react'
import { Zap } from 'lucide-react'
import { BUILTIN_HOOKS } from '../../../shared/pluginSystem'

export function HooksList() {
  return (
    <div className="space-y-2">
      <h3 className="text-text-secondary text-sm font-medium mb-3">Available Hooks</h3>
      {BUILTIN_HOOKS.map(hook => (
        <div key={hook} className="flex items-center gap-3 bg-bg-surface-3 rounded-md px-3 py-2">
          <Zap size={14} aria-hidden="true" className="text-accent-400" />
          <code className="text-text-code text-xs">{hook}</code>
        </div>
      ))}
    </div>
  )
}
