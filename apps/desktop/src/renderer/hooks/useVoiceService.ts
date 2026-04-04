import { useEffect, useCallback, useRef } from 'react'
import { useVoiceStore } from '../store/voiceStore'

const VOICE_SERVICE_URL = 'http://localhost:8000'
const HEALTH_CHECK_INTERVAL = 5000

interface HealthResponse {
  status: string
  asr_loaded: boolean
  tts_loaded: boolean
}

interface TranscribeResponse {
  text: string
  language: string
  confidence: number
  duration: number
}

interface SynthesizeResponse {
  audio_url: string
  duration: number
}

export const useVoiceService = () => {
  const { setServiceReady, setTranscriptionError } = useVoiceStore()
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Check service health
  const checkServiceHealth = useCallback(async () => {
    try {
      const response = await fetch(`${VOICE_SERVICE_URL}/health`, { signal: AbortSignal.timeout(5_000) })
      if (response.ok) {
        const data = (await response.json()) as HealthResponse
        setServiceReady(data.asr_loaded && data.tts_loaded)
        setTranscriptionError(null)
        return true
      } else {
        setServiceReady(false)
        setTranscriptionError(`Health check failed: ${response.status}`)
        return false
      }
    } catch (error) {
      setServiceReady(false)
      setTranscriptionError('Voice service unreachable')
      return false
    }
  }, [setServiceReady, setTranscriptionError])

  // Setup health check on mount
  useEffect(() => {
    checkServiceHealth()
    healthCheckIntervalRef.current = setInterval(checkServiceHealth, HEALTH_CHECK_INTERVAL)

    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current)
      }
    }
  }, [checkServiceHealth])

  // Transcribe audio
  const transcribeAudio = useCallback(
    async (audioData: Blob, language: string = 'en'): Promise<TranscribeResponse | null> => {
      try {
        const formData = new FormData()
        formData.append('file', audioData, 'audio.wav')
        formData.append('language', language)

        const response = await fetch(`${VOICE_SERVICE_URL}/transcribe`, {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(30_000),
        })

        if (response.ok) {
          const data = (await response.json()) as TranscribeResponse
          setTranscriptionError(null)
          return data
        } else {
          const error = await response.text()
          setTranscriptionError(`Transcription failed: ${error}`)
          return null
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setTranscriptionError(`Transcription error: ${errorMessage}`)
        return null
      }
    },
    [setTranscriptionError],
  )

  // Synthesize text to speech
  const synthesizeText = useCallback(
    async (text: string, language: string = 'en'): Promise<SynthesizeResponse | null> => {
      try {
        const response = await fetch(`${VOICE_SERVICE_URL}/synthesize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, language }),
          signal: AbortSignal.timeout(30_000),
        })

        if (response.ok) {
          const data = (await response.json()) as SynthesizeResponse
          setTranscriptionError(null)
          return data
        } else {
          const error = await response.text()
          setTranscriptionError(`Synthesis failed: ${error}`)
          return null
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setTranscriptionError(`Synthesis error: ${errorMessage}`)
        return null
      }
    },
    [setTranscriptionError],
  )

  // Get detailed service status
  const getServiceDetails = useCallback(async () => {
    try {
      const response = await fetch(`${VOICE_SERVICE_URL}/health/detailed`, { signal: AbortSignal.timeout(5_000) })
      if (response.ok) {
        return await response.json()
      }
      return null
    } catch {
      return null
    }
  }, [])

  return {
    checkServiceHealth,
    transcribeAudio,
    synthesizeText,
    getServiceDetails,
  }
}
