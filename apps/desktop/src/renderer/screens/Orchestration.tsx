import React, { useState } from 'react'
import { Workflow, Plus } from 'lucide-react'
import { useOrchestration } from '../hooks/useOrchestration'
import { useOrchestrationStore } from '../store/orchestrationStore'
import { AgentCard } from '../components/orchestration/AgentCard'
import { ProgressFeed } from '../components/orchestration/ProgressFeed'

export function Orchestration() {
  const [goal, setGoal] = useState('')
  const [context, setContext] = useState('')
  const { createSession } = useOrchestration()
  const { sessions, activeSessionId, setActiveSession, isLoading } = useOrchestrationStore()
  const activeSession = sessions.find(s => s.id === activeSessionId) ?? null

  const handleCreate = async () => {
    if (!goal.trim()) return
    const session = await createSession({ goal, context })
    if (session) {
      setActiveSession(session.id)
      setGoal('')
      setContext('')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-border-subtle">
        <div className="flex items-center gap-3 mb-1">
          <Workflow size={20} aria-hidden="true" className="text-accent-400" />
          <h1 className="text-text-primary text-xl font-semibold">Multi-Agent Orchestration</h1>
        </div>
        <p className="text-text-secondary text-sm">Decompose complex goals into parallel sub-agent tasks</p>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left: session list + new session form */}
        <div className="w-72 border-r border-border-subtle flex flex-col">
          <div className="p-4 border-b border-border-subtle">
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="Enter a goal to orchestrate…"
              rows={3}
              className="w-full bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm placeholder-text-muted resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              aria-label="Orchestration goal"
            />
            <textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Optional context…"
              rows={2}
              className="w-full mt-2 bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm placeholder-text-muted resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              aria-label="Orchestration context"
            />
            <button
              onClick={handleCreate}
              disabled={isLoading || !goal.trim()}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-400 active:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <Plus size={16} aria-hidden="true" />
              {isLoading ? 'Creating…' : 'Create Session'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {sessions.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-8">No sessions yet</p>
            ) : (
              sessions.map(session => (
                <AgentCard
                  key={session.id}
                  session={session}
                  isActive={session.id === activeSessionId}
                  onClick={() => setActiveSession(session.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: active session detail */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSession ? (
            <div>
              <div className="mb-6">
                <h2 className="text-text-primary text-lg font-semibold mb-1">{activeSession.goal}</h2>
                {activeSession.context && (
                  <p className="text-text-secondary text-sm">{activeSession.context}</p>
                )}
              </div>
              <ProgressFeed session={activeSession} />
              {activeSession.merged_result && (
                <div className="mt-6 bg-bg-surface-2 border border-border-default rounded-lg p-4">
                  <h3 className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-3">Merged Result</h3>
                  <pre className="text-text-primary text-sm whitespace-pre-wrap">{activeSession.merged_result}</pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Workflow size={48} aria-hidden="true" className="text-text-muted mb-4" />
              <p className="text-text-primary text-lg font-medium mb-2">No session selected</p>
              <p className="text-text-secondary text-sm">Create a session to decompose a goal into parallel tasks</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
