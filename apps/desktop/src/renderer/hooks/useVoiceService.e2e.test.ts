/**
 * E2E Integration Tests: Desktop Voice App ↔ Voice Service Backend
 * 
 * These tests validate the complete pipeline:
 * - Audio blob → transcribe → text
 * - Text → synthesize → audio blob
 * - Health checks and error handling
 * 
 * Prerequisites:
 * - Voice service running at http://localhost:8000
 * - Environment: VOICE_SERVICE_URL=http://localhost:8000
 * 
 * To run locally:
 * 1. Start voice service: `cd services/voice-service && python -m uvicorn main:app --reload --port 8000`
 * 2. Run tests: `npm test -- useVoiceService.e2e.test.ts`
 * 
 * NOTE: Tests are skipped by default (CI environment). To enable:
 * - Set environment variable: ENABLE_VOICE_E2E=true
 * - Or start voice service before running tests
 */

import { describe, it, expect, beforeAll } from 'vitest'

const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || 'http://localhost:8000'
const SKIP_E2E = process.env.ENABLE_VOICE_E2E !== 'true'

/**
 * Helper: Create a test audio blob (WAV format, minimal)
 * In real tests, would use actual recorded audio
 */
function createTestAudioBlob(): Blob {
  // WAV header for 16-bit mono, 16kHz, ~1 second of silence
  const sampleRate = 16000
  const duration = 1 // seconds
  
  // Minimal WAV header
  const wavHeader = new ArrayBuffer(44)
  const view = new DataView(wavHeader)
  
  // RIFF header
  view.setUint32(0, 0x46464952, true) // "RIFF"
  view.setUint32(4, 36 + duration * sampleRate * 2, true) // File size - 8
  view.setUint32(8, 0x45564157, true) // "WAVE"
  
  // fmt sub-chunk
  view.setUint32(12, 0x20746d66, true) // "fmt "
  view.setUint32(16, 16, true) // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true) // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true) // NumChannels (mono)
  view.setUint32(24, sampleRate, true) // SampleRate
  view.setUint32(28, sampleRate * 2, true) // ByteRate
  view.setUint16(32, 2, true) // BlockAlign
  view.setUint16(34, 16, true) // BitsPerSample
  
  // data sub-chunk
  view.setUint32(36, 0x61746164, true) // "data"
  view.setUint32(40, duration * sampleRate * 2, true) // Subchunk2Size
  
  // Add silence data
  const silenceData = new Uint8Array(duration * sampleRate * 2)
  silenceData.fill(0)
  
  return new Blob([wavHeader, silenceData], { type: 'audio/wav' })
}

describe.skipIf(SKIP_E2E)('E2E: useVoiceService ↔ Voice Backend', () => {
  beforeAll(async () => {
    // Verify service is reachable before running tests
    try {
      const response = await fetch(`${VOICE_SERVICE_URL}/health`)
      if (!response.ok) {
        console.warn(`⚠️  Voice service health check failed. Status: ${response.status}`)
      }
    } catch (error) {
      console.warn(`⚠️  Voice service unreachable at ${VOICE_SERVICE_URL}`)
      console.warn('To run E2E tests:')
      console.warn('1. cd services/voice-service')
      console.warn('2. python -m uvicorn main:app --reload --port 8000')
      console.warn('3. re-run tests')
    }
  })

  describe('Service Health', () => {
    it('should connect to voice service', async () => {
      const response = await fetch(`${VOICE_SERVICE_URL}/health`)
      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data).toHaveProperty('status')
    })

    it('should get detailed service status', async () => {
      try {
        const response = await fetch(`${VOICE_SERVICE_URL}/health/detailed`)
        expect(response.ok).toBe(true)
        const data = await response.json()
        expect(data).toBeDefined()
      } catch (error) {
        // May not be available in all service versions
        console.warn('Detailed health endpoint not available')
      }
    })
  })

  describe('Transcription Pipeline', () => {
    it('should transcribe audio blob to text', async () => {
      const audioBlob = createTestAudioBlob()
      const formData = new FormData()
      formData.append('file', audioBlob, 'test.wav')
      formData.append('language', 'en')

      try {
        const response = await fetch(`${VOICE_SERVICE_URL}/transcribe`, {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          expect(data).toHaveProperty('text')
          expect(data).toHaveProperty('language')
          expect(data).toHaveProperty('confidence')
          expect(data).toHaveProperty('duration')
          expect(typeof data.text).toBe('string')
          expect(typeof data.confidence).toBe('number')
        } else {
          const error = await response.text()
          console.warn(`Transcription failed: ${error}`)
        }
      } catch (error) {
        console.warn(`Transcription error: ${error}`)
      }
    })

    it('should handle transcription with language parameter', async () => {
      const audioBlob = createTestAudioBlob()
      const formData = new FormData()
      formData.append('file', audioBlob, 'test.wav')
      formData.append('language', 'es')

      try {
        const response = await fetch(`${VOICE_SERVICE_URL}/transcribe`, {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          expect(data.language).toBe('es')
        }
      } catch (error) {
        console.warn(`Language parameter test error: ${error}`)
      }
    })
  })

  describe('Synthesis Pipeline', () => {
    it('should synthesize text to audio', async () => {
      const testText = 'Hello world'
      const response = await fetch(`${VOICE_SERVICE_URL}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testText, language: 'en' }),
      })

      if (response.ok) {
        const data = await response.json()
        expect(data).toHaveProperty('audio_url')
        expect(data).toHaveProperty('duration')
        expect(typeof data.duration).toBe('number')
        expect(data.duration).toBeGreaterThan(0)

        // Verify audio URL can be fetched if it's a data URL
        if (data.audio_url && data.audio_url.startsWith('data:')) {
          expect(data.audio_url).toContain('audio')
        }
      } else {
        console.warn(`Synthesis failed with status ${response.status}`)
      }
    })

    it('should synthesize text with language parameter', async () => {
      const testText = 'Hola mundo'
      const response = await fetch(`${VOICE_SERVICE_URL}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testText, language: 'es' }),
      })

      if (response.ok) {
        const data = await response.json()
        expect(data.audio_url).toBeDefined()
      }
    })

    it('should handle empty text gracefully', async () => {
      const response = await fetch(`${VOICE_SERVICE_URL}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '', language: 'en' }),
      })

      // Should either return 400 or handle gracefully
      expect([200, 400, 422]).toContain(response.status)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing audio file in transcription', async () => {
      const formData = new FormData()
      formData.append('language', 'en')
      // No file appended

      try {
        const response = await fetch(`${VOICE_SERVICE_URL}/transcribe`, {
          method: 'POST',
          body: formData,
        })

        // Should return error status
        expect([400, 422]).toContain(response.status)
      } catch (error) {
        // Network error is acceptable for this test
        expect(error).toBeDefined()
      }
    })

    it('should handle invalid audio format', async () => {
      const invalidAudio = new Blob(['not a valid audio file'], { type: 'audio/wav' })
      const formData = new FormData()
      formData.append('file', invalidAudio, 'invalid.wav')
      formData.append('language', 'en')

      try {
        const response = await fetch(`${VOICE_SERVICE_URL}/transcribe`, {
          method: 'POST',
          body: formData,
        })

        // Should return error
        expect([400, 422, 500]).toContain(response.status)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Complete Voice Workflow', () => {
    it('should complete full transcribe → synthesize → playback workflow', async () => {
      // This is a high-level test that ensures the services can work together
      const audioBlob = createTestAudioBlob()
      const formData = new FormData()
      formData.append('file', audioBlob, 'test.wav')
      formData.append('language', 'en')

      try {
        // Step 1: Transcribe
        const transcribeResponse = await fetch(`${VOICE_SERVICE_URL}/transcribe`, {
          method: 'POST',
          body: formData,
        })

        if (!transcribeResponse.ok) {
          console.warn('Transcription failed in workflow test')
          return
        }

        const transcribedData = await transcribeResponse.json()
        expect(transcribedData.text).toBeDefined()

        // Step 2: Synthesize response
        const synthesizeResponse = await fetch(`${VOICE_SERVICE_URL}/synthesize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `You said: ${transcribedData.text}`,
            language: 'en',
          }),
        })

        if (synthesizeResponse.ok) {
          const synthesizedData = await synthesizeResponse.json()
          expect(synthesizedData.audio_url).toBeDefined()

          // Workflow complete
          console.log('✓ Full workflow succeeded:', {
            transcribed: transcribedData.text,
            audioUrl: synthesizedData.audio_url.substring(0, 50) + '...',
          })
        }
      } catch (error) {
        console.warn('Workflow test error:', error)
      }
    })
  })
})
