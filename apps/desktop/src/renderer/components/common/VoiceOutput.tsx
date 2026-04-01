import React, { useCallback, useState } from 'react'
import { Volume2, Loader2, Square } from 'lucide-react'
import { useVoiceStore } from '../../store/voiceStore'
import { useVoiceService } from '../../hooks/useVoiceService'

interface VoiceOutputProps {
  text?: string
  onPlaybackComplete?: () => void
}

/**
 * Voice output component for TTS (Text-to-Speech) synthesis and playback
 */
export function VoiceOutput({ text = '', onPlaybackComplete }: VoiceOutputProps) {
  const { settings, currentTranscript } = useVoiceStore()
  const { synthesizeText } = useVoiceService()

  const [isSynthesizing, setSynthesizing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = React.useRef<HTMLAudioElement>(null)

  const textToSpeak = text || currentTranscript

  // Synthesize and play text
  const handleSpeak = useCallback(async () => {
    if (!textToSpeak.trim()) return

    setSynthesizing(true)
    const result = await synthesizeText(textToSpeak, settings.language)

    if (result?.audio_url) {
      if (audioRef.current) {
        audioRef.current.src = result.audio_url
        audioRef.current.play()
        setIsPlaying(true)
      }
    }

    setSynthesizing(false)
  }, [textToSpeak, settings.language, synthesizeText])

  // Stop playback
  const handleStop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
  }, [])

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false)
    onPlaybackComplete?.()
  }, [onPlaybackComplete])

  return (
    <div className="space-y-3 p-4 bg-bg-surface-2 border border-border-default rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Voice Output</h3>
        {isPlaying && <span className="text-xs text-accent-500 animate-pulse">Playing...</span>}
      </div>

      {/* Text input/display */}
      <div className="p-3 bg-bg-surface-1 border border-border-subtle rounded-md">
        <p className="text-sm text-text-secondary break-words max-h-32 overflow-y-auto">{textToSpeak || '—'}</p>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={isPlaying ? handleStop : handleSpeak}
          disabled={isSynthesizing || !textToSpeak.trim()}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors ${
            isPlaying
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-accent-500 hover:bg-accent-400 text-text-primary'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSynthesizing ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Synthesizing...
            </>
          ) : isPlaying ? (
            <>
              <Square size={16} aria-hidden="true" />
              Stop
            </>
          ) : (
            <>
              <Volume2 size={16} aria-hidden="true" />
              Speak
            </>
          )}
        </button>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
        aria-label="TTS audio playback"
      />

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-xs">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            isSynthesizing ? 'bg-yellow-400' : isPlaying ? 'bg-blue-400 animate-pulse' : 'bg-green-500'
          }`}
          aria-hidden="true"
        />
        <span className="text-text-secondary">
          {isSynthesizing ? 'Synthesizing...' : isPlaying ? 'Playing...' : textToSpeak.trim() ? 'Ready' : 'No text'}
        </span>
      </div>
    </div>
  )
}
