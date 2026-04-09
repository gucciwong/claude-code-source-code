import React, { useRef, useCallback, useEffect, useState } from 'react'
import { Mic, Square, Upload, Loader2 } from 'lucide-react'
import { useVoiceStore } from '../../store/voiceStore'
import { useVoiceService } from '../../hooks/useVoiceService'
import { Waveform } from './Waveform'

interface VoiceInputProps {
  onTranscriptionComplete?: (text: string) => void
}

/**
 * Voice input component with mic recording and file upload
 * Captures audio, sends to backend for transcription, stores results
 */
export function VoiceInput({ onTranscriptionComplete }: VoiceInputProps) {
  const {
    isRecording,
    isProcessing,
    recordingDuration,
    settings,
    setIsRecording,
    setIsProcessing,
    setRecordingDuration,
    addTranscription,
    setCurrentTranscript,
  } = useVoiceStore()

  const { transcribeAudio } = useVoiceService()

  // Audio recording state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Create AudioContext for visualization
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext!)()
      }

      const source = audioContextRef.current.createMediaStreamSource(stream)
      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser()
      }
      source.connect(analyserRef.current)

      // Create MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setAudioBlob(blob)
        setIsProcessing(true)

        const result = await transcribeAudio(blob, settings.language)
        if (result) {
          setCurrentTranscript(result.text)
          addTranscription({
            text: result.text,
            language: result.language,
            confidence: result.confidence,
            duration: result.duration,
            timestamp: Date.now(),
          })
          onTranscriptionComplete?.(result.text)
        }

        setIsProcessing(false)

        // Cleanup
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingDuration(0)

      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }, [transcribeAudio, settings.language, setIsRecording, setRecordingDuration, addTranscription, setCurrentTranscript, onTranscriptionComplete])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [isRecording, setIsRecording])

  // Handle file upload
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      setIsProcessing(true)
      const result = await transcribeAudio(file, settings.language)

      if (result) {
        setCurrentTranscript(result.text)
        addTranscription({
          text: result.text,
          language: result.language,
          confidence: result.confidence,
          duration: result.duration,
          timestamp: Date.now(),
        })
        onTranscriptionComplete?.(result.text)
      }

      setIsProcessing(false)
      event.target.value = '' // Reset input
    },
    [transcribeAudio, settings.language, addTranscription, setCurrentTranscript, setIsProcessing, onTranscriptionComplete],
  )

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-3 p-4 bg-bg-surface-2 border border-border-default rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Voice Input</h3>
        {isRecording && <span className="text-xs text-red-400">{formatDuration(recordingDuration)}</span>}
      </div>

      {/* Waveform visualization */}
      <Waveform isRecording={isRecording} audioContext={audioContextRef.current || undefined} analyser={analyserRef.current || undefined} />

      {/* Recording controls */}
      <div className="flex gap-2">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-accent-500 hover:bg-accent-400 text-text-primary'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isProcessing ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Processing...
            </>
          ) : isRecording ? (
            <>
              <Square size={16} aria-hidden="true" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic size={16} aria-hidden="true" />
              Start Recording
            </>
          )}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing || isRecording}
          className="px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center gap-2 border border-border-default text-text-secondary hover:bg-bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload size={16} aria-hidden="true" />
          Upload
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
          aria-label="Upload audio file"
        />
      </div>

      {/* Current transcript display */}
      {/* Status indicator */}
      <div className="flex items-center gap-2 text-xs">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            isProcessing ? 'bg-yellow-400' : isRecording ? 'bg-red-400 animate-pulse' : 'bg-green-500'
          }`}
          aria-hidden="true"
        />
        <span className="text-text-secondary">
          {isProcessing ? 'Processing...' : isRecording ? 'Recording...' : 'Ready'}
        </span>
      </div>
    </div>
  )
}
