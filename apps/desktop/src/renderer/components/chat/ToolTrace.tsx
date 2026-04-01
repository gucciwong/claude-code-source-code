import React from 'react'
import { useAgentStore, type ToolCall } from '../../store/agentStore'
import { Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface ToolTraceProps {
  expanded?: boolean
}

export function ToolTrace({ expanded = true }: ToolTraceProps) {
  const { toolCalls } = useAgentStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (toolCalls.length === 0) {
    return null
  }

  const statusIcon = (call: ToolCall) => {
    switch (call.status) {
      case 'thinking':
      case 'executing':
        return <Loader2 size={14} className="animate-spin text-blue-400" aria-hidden="true" />
      case 'done':
        return <CheckCircle2 size={14} className="text-green-500" aria-hidden="true" />
      case 'error':
        return <AlertCircle size={14} className="text-red-400" aria-hidden="true" />
    }
  }

  const statusLabel = (call: ToolCall) => {
    return {
      thinking: 'Thinking',
      executing: 'Running',
      done: 'Done',
      error: 'Error',
    }[call.status]
  }

  return (
    <div className="bg-bg-surface-2 border-t border-border-default p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Tool Calls</h3>
      <div className="space-y-2">
        {toolCalls.map((call) => (
          <div
            key={call.id}
            className="bg-bg-surface-3 border border-border-subtle rounded-md overflow-hidden"
          >
            <button
              onClick={() => setExpandedId(expandedId === call.id ? null : call.id)}
              className="w-full px-3 py-2 flex items-center gap-2 hover:bg-bg-elevated cursor-pointer transition-colors"
              aria-expanded={expandedId === call.id}
              aria-label={`Tool call: ${call.name}`}
            >
              <span className="flex-shrink-0">
                {statusIcon(call)}
              </span>
              <span className="flex-1 text-left text-sm text-text-secondary">{call.name}</span>
              <span className="text-xs text-text-muted">{statusLabel(call)}</span>
              <ChevronDown
                size={14}
                className={`flex-shrink-0 transition-transform ${expandedId === call.id ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {expandedId === call.id && (
              <div className="px-3 py-2 bg-bg-base border-t border-border-subtle space-y-2 text-xs">
                {Object.entries(call.inputs).length > 0 && (
                  <div>
                    <p className="text-text-muted font-medium mb-1">Inputs:</p>
                    <pre className="bg-bg-surface-2 p-2 rounded text-text-code overflow-auto max-h-40 font-mono text-xs">
                      {JSON.stringify(call.inputs, null, 2)}
                    </pre>
                  </div>
                )}
                {call.output && (
                  <div>
                    <p className="text-text-muted font-medium mb-1">Output:</p>
                    <pre className="bg-bg-surface-2 p-2 rounded text-text-code overflow-auto max-h-40 font-mono text-xs">
                      {call.output}
                    </pre>
                  </div>
                )}
                {call.error && (
                  <div>
                    <p className="text-red-400 font-medium mb-1">Error:</p>
                    <pre className="bg-red-500/10 p-2 rounded text-red-300 overflow-auto max-h-40 font-mono text-xs">
                      {call.error}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
