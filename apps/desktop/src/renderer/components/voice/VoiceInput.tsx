// React Voice Input component for Sovereign Coder desktop.

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Square, Upload, AlertCircle, Loader } from 'lucide-react'
import { Waveform } from './Waveform'

interface VoiceInputProps {
  onTranscribe: (text: string, language: string) => void
  isLoading?: boolean
  disabled?: boolean
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscribe,
  isLoading = false,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState('en')

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      chunksRef.current = []
      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' })
        await uploadAndTranscribe(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone access denied')
      setIsRecording(false)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const uploadAndTranscribe = useCallback(async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'audio.wav')
      if (selectedLanguage !== 'auto') {
        formData.append('language', selectedLanguage)
      }

      const response = await fetch('http://localhost:8000/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.text) {
        onTranscribe(data.text, data.language)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed')
    }
  }, [selectedLanguage, onTranscribe])

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadAndTranscribe(file as Blob)
    }
  }, [uploadAndTranscribe])

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Language Selector */}
      <select
        value={selectedLanguage}
        onChange={(e) => setSelectedLanguage(e.target.value)}
        disabled={disabled || isRecording}
        className="px-3 py-2 rounded-md border border-border-default bg-bg-surface-2 text-text-primary text-sm"
      >
        <option value="auto">Auto-detect</option>
        <option value="en">English</option>
        <option value="zh">Chinese</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
        <option value="ja">Japanese</option>
      </select>

      {/* Recording Controls */}
      <div className="flex gap-2">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium cursor-pointer
            ${isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-accent-500 hover:bg-accent-400 text-text-primary'
            }
            ${(disabled || isLoading) && 'opacity-50 cursor-not-allowed'}
          `}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isLoading ? (
            <Loader size={18} className="animate-spin" aria-hidden="true" />
          ) : isRecording ? (
            <Square size={18} aria-hidden="true" />
          ) : (
            <Mic size={18} aria-hidden="true" />
          )}
          {isLoading ? 'Processing...' : isRecording ? 'Stop' : 'Record'}
        </button>

        {/* File Upload */}
        <label className="flex items-center gap-2 px-4 py-2 rounded-md border border-border-default hover:bg-bg-surface-3 text-text-secondary cursor-pointer">
          <Upload size={18} aria-hidden="true" />
          <span className="text-sm">Upload</span>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            disabled={disabled || isRecording}
            className="hidden"
            aria-label="Upload audio file"
          />
        </label>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-red-500/10 border border-red-400/20">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <>
          <div className="flex items-center gap-2 text-sm text-yellow-400">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" aria-hidden="true" />
            Recording...
          </div>
          <Waveform isRecording={isRecording} className="mx-auto" />
        </>
      )}
    </div>
  )
}
