"""Voice Panel component combining input and output."""

import React, { useState, useCallback } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { VoiceInput } from './VoiceInput'
import { VoiceOutput } from './VoiceOutput'

interface VoicePanelProps {
  onClose?: () => void
  onTranscriptChange?: (text: string) => void
}

export const VoicePanel: React.FC<VoicePanelProps> = ({
  onClose,
  onTranscriptChange,
}) => {
  const [transcript, setTranscript] = useState('')
  const [transcribedText, setTranscribedText] = useState('')
  const [serviceHealth, setServiceHealth] = useState({
    connected: false,
    asrReady: false,
    ttsReady: false,
  })
  const [isCheckingHealth, setIsCheckingHealth] = useState(true)

  // Check service health on mount
  React.useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:8000/health')
        if (response.ok) {
          const data = await response.json()
          setServiceHealth({
            connected: true,
            asrReady: data.asr_loaded,
            ttsReady: data.tts_loaded,
          })
        }
      } catch {
        setServiceHealth({ connected: false, asrReady: false, ttsReady: false })
      } finally {
        setIsCheckingHealth(false)
      }
    }

    checkHealth()
    // Poll for health every 5 seconds
    const interval = setInterval(checkHealth, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleTranscribe = useCallback((text: string, language: string) => {
    setTranscribedText(text)
    setTranscript(text)
    onTranscriptChange?.(text)
  }, [onTranscriptChange])

  const handleClearTranscript = useCallback(() => {
    setTranscript('')
    setTranscribedText('')
    onTranscriptChange?.('')
  }, [onTranscriptChange])

  return (
    <div className="flex flex-col h-full bg-bg-surface-1 border-l border-border-subtle">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-subtle">
        <h2 className="text-lg font-semibold text-text-primary">Voice I/O</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-surface-2 rounded cursor-pointer"
            aria-label="Close voice panel"
          >
            <X size={18} className="text-text-secondary" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Service Status */}
      {isCheckingHealth ? (
        <div className="p-4 text-sm text-text-muted">Checking service health...</div>
      ) : !serviceHealth.connected ? (
        <div className="p-4 flex gap-2 bg-red-500/10 border-b border-red-400/20">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-red-400">Voice service unavailable</p>
            <p className="text-xs text-red-400/70">Make sure the Python voice service is running</p>
          </div>
        </div>
      ) : (
        <div className="px-4 py-2 flex gap-2 text-xs text-text-secondary border-b border-border-subtle">
          <span className={`${serviceHealth.asrReady ? 'text-green-400' : 'text-red-400'}`}>
            • ASR {serviceHealth.asrReady ? 'Ready' : 'Offline'}
          </span>
          <span className={`${serviceHealth.ttsReady ? 'text-green-400' : 'text-red-400'}`}>
            • TTS {serviceHealth.ttsReady ? 'Ready' : 'Offline'}
          </span>
        </div>
      )}

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Voice Input */}
        <div className="border-b border-border-subtle">
          <div className="p-4 text-sm font-medium text-text-secondary">Speech to Text</div>
          <VoiceInput
            onTranscribe={handleTranscribe}
            disabled={!serviceHealth.connected || !serviceHealth.asrReady}
          />
        </div>

        {/* Transcript Display */}
        {transcribedText && (
          <div className="border-b border-border-subtle">
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Transcribed Text</span>
              <button
                onClick={handleClearTranscript}
                className="text-xs px-2 py-1 rounded hover:bg-bg-surface-2 text-text-muted cursor-pointer"
                aria-label="Clear transcript"
              >
                Clear
              </button>
            </div>
            <div className="px-4 pb-4 p-3 bg-bg-surface-2 rounded-md border border-border-default text-text-primary text-sm max-h-32 overflow-y-auto">
              {transcribedText}
            </div>
          </div>
        )}

        {/* Voice Output */}
        <div className="p-4 border-b border-border-subtle">
          <div className="mb-3 text-sm font-medium text-text-secondary">Text to Speech</div>
          <VoiceOutput
            text={transcribedText}
            disabled={!serviceHealth.connected || !serviceHealth.ttsReady}
          />
        </div>

        {/* Editor Text Input (optional) */}
        <div className="p-4">
          <label className="block mb-2 text-sm font-medium text-text-secondary">
            Or type to synthesize:
          </label>
          <textarea
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value)
              onTranscriptChange?.(e.target.value)
            }}
            placeholder="Enter text to speak..."
            className="w-full px-3 py-2 rounded-md border border-border-default bg-bg-surface-2 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
            rows={4}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 text-xs text-text-muted border-t border-border-subtle">
        <p>Powered by OpenAI Whisper + Google TTS</p>
      </div>
    </div>
  )
}
