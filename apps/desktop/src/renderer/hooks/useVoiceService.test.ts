import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useVoiceService } from './useVoiceService'
import { useVoiceStore } from '../store/voiceStore'

// Mock fetch
let mockFetch = vi.fn()
global.fetch = mockFetch

describe('useVoiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch = vi.fn()
    global.fetch = mockFetch
    useVoiceStore.setState({
      serviceReady: false,
      transcriptionError: null,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('service health checks', () => {
    it('should check service health on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'ok',
          asr_loaded: true,
          tts_loaded: true,
        }),
      })

      renderHook(() => useVoiceService())

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/health')
      })
    })

    it('should set serviceReady to true when both ASR and TTS loaded', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'ok',
          asr_loaded: true,
          tts_loaded: true,
        }),
      })

      renderHook(() => useVoiceService())

      await waitFor(() => {
        expect(useVoiceStore.getState().serviceReady).toBe(true)
      })
    })

    it('should set serviceReady to false when either ASR or TTS not loaded', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'ok',
          asr_loaded: true,
          tts_loaded: false,
        }),
      })

      renderHook(() => useVoiceService())

      await waitFor(() => {
        expect(useVoiceStore.getState().serviceReady).toBe(false)
      })
    })

    it('should handle service unreachable error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      renderHook(() => useVoiceService())

      await waitFor(() => {
        expect(useVoiceStore.getState().serviceReady).toBe(false)
        expect(useVoiceStore.getState().transcriptionError).toBe('Voice service unreachable')
      })
    })
  })

  describe('transcribeAudio', () => {
    it('should transcribe audio blob', async () => {
      // Mock health check on mount
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          status: 'ok',
          asr_loaded: true,
          tts_loaded: true,
        }),
      })

      // Mock transcribe call
      const mockData = {
        text: 'Hello world',
        language: 'en',
        confidence: 0.95,
        duration: 2.5,
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockData),
      })

      const { result } = renderHook(() => useVoiceService())
      const audioBlob = new Blob(['audio data'], { type: 'audio/wav' })

      let response
      await act(async () => {
        response = await result.current.transcribeAudio(audioBlob, 'en')
      })

      expect(response).toEqual(mockData)
    })

    it('should handle transcription errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Bad request',
      })

      const { result } = renderHook(() => useVoiceService())
      const audioBlob = new Blob(['audio data'], { type: 'audio/wav' })

      let response
      await act(async () => {
        response = await result.current.transcribeAudio(audioBlob)
      })

      expect(response).toBeNull()
      expect(useVoiceStore.getState().transcriptionError).toContain('Transcription')
    })

    it('should clear error on successful transcription', async () => {
      useVoiceStore.setState({
        transcriptionError: 'Previous error',
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: 'Success',
          language: 'en',
          confidence: 0.9,
          duration: 2,
        }),
      })

      const { result } = renderHook(() => useVoiceService())
      const audioBlob = new Blob(['audio'], { type: 'audio/wav' })

      await act(async () => {
        await result.current.transcribeAudio(audioBlob)
      })

      expect(useVoiceStore.getState().transcriptionError).toBeNull()
    })
  })

  describe('synthesizeText', () => {
    it('should synthesize text to speech', async () => {
      // Mock health check on mount
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          status: 'ok',
          asr_loaded: true,
          tts_loaded: true,
        }),
      })

      // Mock synthesize call
      const mockData = {
        audio_url: 'data:audio/wav;base64,UklGRi4A',
        duration: 1.5,
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockData),
      })

      const { result } = renderHook(() => useVoiceService())
      let response
      await act(async () => {
        response = await result.current.synthesizeText('Hello', 'en')
      })

      expect(response).toEqual(mockData)
    })

    it('should handle synthesis errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Synthesis failed',
      })

      const { result } = renderHook(() => useVoiceService())
      let response
      await act(async () => {
        response = await result.current.synthesizeText('Test')
      })

      expect(response).toBeNull()
      expect(useVoiceStore.getState().transcriptionError).toContain('Synthesis')
    })
  })

  describe('getServiceDetails', () => {
    it('should fetch detailed service status', async () => {
      // Mock health check on mount
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({
          status: 'ok',
          asr_loaded: true,
          tts_loaded: true,
        }),
      })

      // Mock getServiceDetails call
      const mockData = {
        status: 'healthy',
        uptime: 12345,
        requests: 1000,
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockData),
      })

      const { result } = renderHook(() => useVoiceService())
      let details
      await act(async () => {
        details = await result.current.getServiceDetails()
      })

      expect(details).toEqual(mockData)
    })

    it('should return null if detailed service fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request failed'))

      const { result } = renderHook(() => useVoiceService())
      let details
      await act(async () => {
        details = await result.current.getServiceDetails()
      })

      expect(details).toBeNull()
    })
  })
})
