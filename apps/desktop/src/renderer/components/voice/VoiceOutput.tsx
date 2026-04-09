// React Voice Output component for text-to-speech.

import React, { useState, useRef, useCallback } from 'react'
import { Volume2, Square, AlertCircle, Loader } from 'lucide-react'

interface VoiceOutputProps {
  text: string
  isLoading?: boolean
  disabled?: boolean
  onPlay?: () => void
  onStop?: () => void
}

export const VoiceOutput: React.FC<VoiceOutputProps> = ({
  text,
  isLoading = false,
  disabled = false,
  onPlay,
  onStop,
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [selectedLanguage, setSelectedLanguage] = useState('en')

  const synthesizeSpeech = useCallback(async () => {
    if (!text.trim()) {
      setError('No text to synthesize')
      return
    }

    try {
      setError(null)
      onPlay?.()

      const formData = new FormData()
      formData.append('text', text)
      formData.append('language', selectedLanguage)

      const response = await fetch(`${import.meta.env.VITE_VOICE_SERVICE_URL ?? 'http://localhost:8000'}/speak`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`TTS failed: ${response.statusText}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'TTS failed')
      }

      // Fetch the audio file from the server
      const audioResponse = await fetch(data.path)
      const audioBlob = await audioResponse.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.onended = () => {
          URL.revokeObjectURL(audioUrl)
          setIsPlaying(false)
          onStop?.()
        }
        audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speech synthesis failed')
      onStop?.()
    }
  }, [text, selectedLanguage, onPlay, onStop])

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
    onStop?.()
  }, [onStop])

  return (
    <div className="flex flex-col gap-3 p-4 bg-bg-surface-2 rounded-lg border border-border-default">
      {/* Language Selector for TTS */}
      <select
        value={selectedLanguage}
        onChange={(e) => setSelectedLanguage(e.target.value)}
        disabled={disabled || isPlaying}
        className="px-3 py-2 rounded-md border border-border-default bg-bg-surface-1 text-text-primary text-sm"
      >
        <option value="en">English</option>
        <option value="zh-CN">Chinese (Simplified)</option>
        <option value="zh-TW">Chinese (Traditional)</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
        <option value="ja">Japanese</option>
        <option value="ko">Korean</option>
      </select>

      {/* Play/Stop Controls */}
      <div className="flex gap-2">
        <button
          onClick={isPlaying ? stopPlayback : synthesizeSpeech}
          disabled={disabled || isLoading || !text.trim()}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium cursor-pointer
            ${isPlaying
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-accent-500 hover:bg-accent-400 text-text-primary'
            }
            ${(disabled || isLoading || !text.trim()) && 'opacity-50 cursor-not-allowed'}
          `}
          aria-label={isPlaying ? 'Stop playback' : 'Play speech'}
        >
          {isLoading ? (
            <Loader size={18} className="animate-spin" aria-hidden="true" />
          ) : isPlaying ? (
            <Square size={18} aria-hidden="true" />
          ) : (
            <Volume2 size={18} aria-hidden="true" />
          )}
          {isLoading ? 'Synthesizing...' : isPlaying ? 'Stop' : 'Speak'}
        </button>

        {/* Text Preview */}
        <div className="flex-1 px-3 py-2 rounded-md bg-bg-surface-1 text-text-secondary text-sm truncate">
          {text.substring(0, 50)}
          {text.length > 50 ? '...' : ''}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-red-500/10 border border-red-400/20">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Playback Status */}
      {isPlaying && (
        <div className="flex items-center gap-2 text-sm text-blue-400">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" aria-hidden="true" />
          Playing...
        </div>
      )}

      {/* Audio Element (hidden) */}
      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPlaying(false)
          onStop?.()
        }}
        onError={() => {
          setError('Audio playback error')
          setIsPlaying(false)
        }}
        aria-hidden="true"
      />
    </div>
  )
}
