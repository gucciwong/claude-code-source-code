import React from 'react'
import { AVAILABLE_COMMANDS } from '../../../shared/messaging'

export function CommandReference() {
  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border-subtle">
        <h3 className="text-text-primary text-sm font-semibold">Available Commands</h3>
        <p className="text-text-muted text-xs mt-0.5">Send these commands from your IM platform</p>
      </div>
      <table className="w-full" aria-label="Available IM commands">
        <thead>
          <tr className="bg-bg-surface-3">
            <th className="px-4 py-2 text-left text-text-muted text-xs font-medium uppercase tracking-wide">
              Command
            </th>
            <th className="px-4 py-2 text-left text-text-muted text-xs font-medium uppercase tracking-wide">
              Usage
            </th>
            <th className="px-4 py-2 text-left text-text-muted text-xs font-medium uppercase tracking-wide">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {AVAILABLE_COMMANDS.map(cmd => (
            <tr key={cmd.name} className="border-t border-border-subtle">
              <td className="px-4 py-2">
                <code className="text-accent-400 text-xs">{cmd.name}</code>
              </td>
              <td className="px-4 py-2">
                <code className="text-text-secondary text-xs">{cmd.usage}</code>
              </td>
              <td className="px-4 py-2 text-text-secondary text-sm">{cmd.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
