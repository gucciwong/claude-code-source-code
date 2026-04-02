import React, { useState } from 'react'
import { Shield, Play } from 'lucide-react'
import { usePersonaCouncil } from '../hooks/usePersonaCouncil'
import { usePersonaCouncilStore } from '../store/personaCouncilStore'
import { PersonaCard, ConsensusPanel } from '../components/council'

const LANGUAGES = ['python', 'typescript', 'javascript', 'rust', 'go', 'java', 'cpp'] as const

export function PersonaCouncil() {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('python')
  const [context, setContext] = useState('')
  const { reviewCode } = usePersonaCouncil()
  const { activeReport, isReviewing, error } = usePersonaCouncilStore()

  const handleReview = async () => {
    if (!code.trim()) return
    await reviewCode({ code, language, context })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-border-subtle">
        <div className="flex items-center gap-3 mb-1">
          <Shield size={20} aria-hidden="true" className="text-accent-400" />
          <h1 className="text-text-primary text-xl font-semibold">Adversarial Persona Council</h1>
        </div>
        <p className="text-text-secondary text-sm">4 expert reviewers stress-test your code before you commit</p>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left: code input */}
        <div className="w-1/2 border-r border-border-subtle flex flex-col p-6 gap-4">
          <div className="flex items-center gap-3">
            <label htmlFor="council-lang" className="text-text-secondary text-sm shrink-0">Language:</label>
            <select
              id="council-lang"
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="bg-bg-surface-3 border border-border-default rounded-md px-3 py-1.5 text-text-primary text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 cursor-pointer"
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Paste code to review…"
            className="flex-1 bg-bg-surface-3 border border-border-default rounded-md p-3 text-text-primary text-sm font-mono placeholder-text-muted resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            aria-label="Code to review"
          />
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Optional context (e.g., 'this handles user auth')…"
            rows={3}
            className="bg-bg-surface-3 border border-border-default rounded-md p-3 text-text-primary text-sm placeholder-text-muted resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            aria-label="Optional context"
          />
          <button
            onClick={handleReview}
            disabled={isReviewing || !code.trim()}
            className="flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-400 active:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-text-primary text-sm font-medium px-4 py-2.5 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            <Play size={16} aria-hidden="true" />
            {isReviewing ? 'Reviewing…' : 'Review with Council'}
          </button>
          {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
        </div>

        {/* Right: review results */}
        <div className="w-1/2 overflow-y-auto p-6">
          {activeReport ? (
            <div>
              <ConsensusPanel report={activeReport} />
              <div className="space-y-3">
                {activeReport.reviews.map(review => (
                  <PersonaCard key={review.persona_name} review={review} />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Shield size={48} aria-hidden="true" className="text-text-muted mb-4" />
              <p className="text-text-primary text-lg font-medium mb-2">No review yet</p>
              <p className="text-text-secondary text-sm">
                Paste code on the left and click Review to get critiques from 4 expert personas
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
