import React from 'react'
import { useAgentStore } from '../../store/agentStore'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useState } from 'react'

export function DiffViewer() {
  const { fileChanges, updateFileChange } = useAgentStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (fileChanges.length === 0) {
    return null
  }

  const pendingChanges = fileChanges.filter(fc => fc.accepted === null)
  const acceptedChanges = fileChanges.filter(fc => fc.accepted === true)
  const rejectedChanges = fileChanges.filter(fc => fc.accepted === false)

  const renderChangeItem = (change: any) => (
    <div key={change.id} className="bg-bg-surface-3 border border-border-subtle rounded-md overflow-hidden">
      <div className="px-3 py-2 bg-bg-surface-2 flex items-center gap-3">
        <span className="text-xs font-mono text-text-muted">{change.file}</span>
        <span className={`text-xs px-2 py-1 rounded ${
          change.type === 'create' ? 'bg-green-500/20 text-green-400' :
          change.type === 'modify' ? 'bg-blue-500/20 text-blue-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {change.type === 'create' ? 'Create' : change.type === 'modify' ? 'Modify' : 'Delete'}
        </span>
      </div>

      {change.accepted === null && (
        <div className="px-3 py-2 flex gap-2 bg-bg-base border-b border-border-subtle">
          <button
            onClick={() => updateFileChange(change.id, true)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-400 text-white text-xs font-medium rounded cursor-pointer transition-colors"
            aria-label="Accept change"
          >
            <CheckCircle2 size={14} aria-hidden="true" />
            Accept
          </button>
          <button
            onClick={() => updateFileChange(change.id, false)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-400 text-white text-xs font-medium rounded cursor-pointer transition-colors"
            aria-label="Reject change"
          >
            <XCircle size={14} aria-hidden="true" />
            Reject
          </button>
        </div>
      )}

      {change.accepted !== null && (
        <div className={`px-3 py-2 flex items-center gap-2 ${
          change.accepted ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {change.accepted ? (
            <CheckCircle2 size={14} aria-hidden="true" />
          ) : (
            <XCircle size={14} aria-hidden="true" />
          )}
          <span className="text-xs font-medium">
            {change.accepted ? 'Accepted' : 'Rejected'}
          </span>
        </div>
      )}

      {expandedId === change.id && (
        <pre className="px-3 py-2 bg-bg-base border-t border-border-subtle text-text-code font-mono text-xs overflow-auto max-h-60">
          {change.diff}
        </pre>
      )}

      <button
        onClick={() => setExpandedId(expandedId === change.id ? null : change.id)}
        className="w-full px-3 py-2 text-xs text-text-secondary hover:text-text-primary cursor-pointer transition-colors border-t border-border-subtle"
        aria-label={`${expandedId === change.id ? 'Hide' : 'Show'} diff for ${change.file}`}
      >
        {expandedId === change.id ? 'Hide diff' : 'View diff'}
      </button>
    </div>
  )

  return (
    <div className="bg-bg-surface-2 border-t border-border-default p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">File Changes</h3>

      {pendingChanges.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs text-text-secondary font-medium mb-2 flex items-center gap-2">
            <AlertCircle size={12} aria-hidden="true" />
            Pending Review ({pendingChanges.length})
          </h4>
          <div className="space-y-2">
            {pendingChanges.map(renderChangeItem)}
          </div>
        </div>
      )}

      {acceptedChanges.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs text-green-400 font-medium mb-2 flex items-center gap-2">
            <CheckCircle2 size={12} aria-hidden="true" />
            Accepted ({acceptedChanges.length})
          </h4>
          <div className="space-y-2">
            {acceptedChanges.map(renderChangeItem)}
          </div>
        </div>
      )}

      {rejectedChanges.length > 0 && (
        <div>
          <h4 className="text-xs text-red-400 font-medium mb-2 flex items-center gap-2">
            <XCircle size={12} aria-hidden="true" />
            Rejected ({rejectedChanges.length})
          </h4>
          <div className="space-y-2">
            {rejectedChanges.map(renderChangeItem)}
          </div>
        </div>
      )}
    </div>
  )
}
