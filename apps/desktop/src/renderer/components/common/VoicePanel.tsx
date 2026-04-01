import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { VoiceInput } from './VoiceInput'
import { VoiceOutput } from './VoiceOutput'
import { VoiceSettings } from './VoiceSettings'
import { TranscriptionHistory } from './TranscriptionHistory'

type ActiveTab = 'input' | 'output' | 'settings' | 'history'

interface VoicePanelProps {
  onTranscriptionComplete?: (text: string) => void
}

/**
 * Unified voice panel combining input, output, settings, and history
 */
export function VoicePanel({ onTranscriptionComplete }: VoicePanelProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('input')
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-bg-surface-1 border-b border-border-default">
      {/* Header */}
      <button
        className="w-full px-6 py-3 flex items-center justify-between hover:bg-bg-surface-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-accent-500"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label="Voice controls"
      >
        <h2 className="text-sm font-semibold text-text-primary">Voice Controls</h2>
        {isExpanded ? (
          <ChevronUp size={18} aria-hidden="true" />
        ) : (
          <ChevronDown size={18} aria-hidden="true" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 py-4 border-t border-border-default space-y-4">
          {/* Tab navigation */}
          <div className="flex gap-2 border-b border-border-subtle overflow-x-auto">
            {(
              [
                { id: 'input', label: 'Input' },
                { id: 'output', label: 'Output' },
                { id: 'settings', label: 'Settings' },
                { id: 'history', label: 'History' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-t whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-accent-500 border-b-2 border-accent-500'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                aria-selected={activeTab === tab.id}
                role="tab"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div role="tabpanel" className="space-y-4">
            {activeTab === 'input' && <VoiceInput onTranscriptionComplete={onTranscriptionComplete} />}
            {activeTab === 'output' && <VoiceOutput onPlaybackComplete={undefined} />}
            {activeTab === 'settings' && <VoiceSettings />}
            {activeTab === 'history' && <TranscriptionHistory />}
          </div>
        </div>
      )}
    </div>
  )
}
