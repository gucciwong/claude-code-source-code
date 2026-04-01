import { beforeEach, describe, expect, it } from 'vitest'
import { useVoiceStore, DEFAULT_VOICE_SETTINGS } from '../store/voiceStore'

describe('voiceStore', () => {
  beforeEach(() => {
    useVoiceStore.setState({
      transcriptions: [],
      currentTranscript: '',
      isRecording: false,
      isProcessing: false,
      recordingDuration: 0,
      settings: DEFAULT_VOICE_SETTINGS,
      isPanelOpen: false,
      serviceReady: false,
      transcriptionError: null,
    })
  })

  describe('transcription management', () => {
    it('should add a new transcription', () => {
      const { getState } = useVoiceStore
      const { addTranscription } = getState()

      addTranscription({
        text: 'Hello world',
        language: 'en',
        timestamp: Date.now(),
        confidence: 0.95,
        duration: 2.5,
      })

      const state = getState()
      expect(state.transcriptions).toHaveLength(1)
      expect(state.transcriptions[0].text).toBe('Hello world')
      expect(state.transcriptions[0].language).toBe('en')
    })

    it('should generate unique IDs for transcriptions', () => {
      const { getState } = useVoiceStore
      const { addTranscription } = getState()

      addTranscription({
        text: 'First',
        language: 'en',
        timestamp: Date.now(),
        confidence: 0.9,
        duration: 1,
      })
      addTranscription({
        text: 'Second',
        language: 'en',
        timestamp: Date.now(),
        confidence: 0.9,
        duration: 1,
      })

      const state = getState()
      const ids = state.transcriptions.map((t) => t.id)
      expect(new Set(ids).size).toBe(2)
    })

    it('should delete a transcription by ID', () => {
      const { getState } = useVoiceStore
      const { addTranscription, deleteTranscription } = getState()

      addTranscription({
        text: 'To delete',
        language: 'en',
        timestamp: Date.now(),
        confidence: 0.9,
        duration: 1,
      })

      const { id } = getState().transcriptions[0]
      deleteTranscription(id)

      expect(getState().transcriptions).toHaveLength(0)
    })

    it('should clear all transcriptions', () => {
      const { getState } = useVoiceStore
      const { addTranscription, clearTranscriptions } = getState()

      addTranscription({
        text: 'First',
        language: 'en',
        timestamp: Date.now(),
        confidence: 0.9,
        duration: 1,
      })
      addTranscription({
        text: 'Second',
        language: 'en',
        timestamp: Date.now(),
        confidence: 0.9,
        duration: 1,
      })

      clearTranscriptions()
      expect(getState().transcriptions).toHaveLength(0)
    })

    it('should set current transcript', () => {
      const { getState } = useVoiceStore
      const { setCurrentTranscript } = getState()

      setCurrentTranscript('New transcript')
      expect(getState().currentTranscript).toBe('New transcript')
    })
  })

  describe('recording state', () => {
    it('should set recording state', () => {
      const { getState } = useVoiceStore
      const { setIsRecording } = getState()

      setIsRecording(true)
      expect(getState().isRecording).toBe(true)

      setIsRecording(false)
      expect(getState().isRecording).toBe(false)
    })

    it('should set processing state', () => {
      const { getState } = useVoiceStore
      const { setIsProcessing } = getState()

      setIsProcessing(true)
      expect(getState().isProcessing).toBe(true)

      setIsProcessing(false)
      expect(getState().isProcessing).toBe(false)
    })

    it('should update recording duration', () => {
      const { getState } = useVoiceStore
      const { setRecordingDuration } = getState()

      setRecordingDuration(5)
      expect(getState().recordingDuration).toBe(5)
    })

    it('should increment recording duration', () => {
      const { getState } = useVoiceStore
      const { setRecordingDuration, incrementRecordingDuration } = getState()

      setRecordingDuration(0)
      incrementRecordingDuration()
      expect(getState().recordingDuration).toBe(1)

      incrementRecordingDuration()
      expect(getState().recordingDuration).toBe(2)
    })
  })

  describe('settings management', () => {
    it('should update settings', () => {
      const { getState } = useVoiceStore
      const { updateSettings } = getState()

      updateSettings({ modelSize: 'large', language: 'es' })

      const settings = getState().settings
      expect(settings.modelSize).toBe('large')
      expect(settings.language).toBe('es')
      expect(settings.autoInsert).toBe(DEFAULT_VOICE_SETTINGS.autoInsert)
    })

    it('should toggle autoInsert setting', () => {
      const { getState } = useVoiceStore
      const { updateSettings } = getState()

      const initial = getState().settings.autoInsert
      updateSettings({ autoInsert: !initial })

      expect(getState().settings.autoInsert).toBe(!initial)
    })

    it('should reset settings to defaults', () => {
      const { getState } = useVoiceStore
      const { updateSettings, resetSettings } = getState()

      updateSettings({ modelSize: 'large', language: 'de', playTTS: false })
      resetSettings()

      expect(getState().settings).toEqual(DEFAULT_VOICE_SETTINGS)
    })
  })

  describe('UI state', () => {
    it('should toggle panel open state', () => {
      const { getState } = useVoiceStore
      const { setPanelOpen } = getState()

      expect(getState().isPanelOpen).toBe(false)

      setPanelOpen(true)
      expect(getState().isPanelOpen).toBe(true)

      setPanelOpen(false)
      expect(getState().isPanelOpen).toBe(false)
    })

    it('should set service ready state', () => {
      const { getState } = useVoiceStore
      const { setServiceReady } = getState()

      setServiceReady(true)
      expect(getState().serviceReady).toBe(true)

      setServiceReady(false)
      expect(getState().serviceReady).toBe(false)
    })

    it('should set transcription error', () => {
      const { getState } = useVoiceStore
      const { setTranscriptionError } = getState()

      setTranscriptionError('An error occurred')
      expect(getState().transcriptionError).toBe('An error occurred')

      setTranscriptionError(null)
      expect(getState().transcriptionError).toBeNull()
    })
  })

  describe('default values', () => {
    it('should have correct default settings', () => {
      expect(DEFAULT_VOICE_SETTINGS).toEqual({
        modelSize: 'base',
        language: 'en',
        autoInsert: false,
        playTTS: true,
        recordAudio: true,
      })
    })
  })
})
