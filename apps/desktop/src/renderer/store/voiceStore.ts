import { create } from 'zustand'

export interface TranscriptionEntry {
  id: string
  text: string
  language: string
  timestamp: number
  confidence: number
  duration: number
}

export interface VoiceSettings {
  modelSize: 'base' | 'small' | 'medium' | 'large'
  language: 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja'
  autoInsert: boolean
  playTTS: boolean
  recordAudio: boolean
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  modelSize: 'base',
  language: 'en',
  autoInsert: false,
  playTTS: true,
  recordAudio: true,
}

interface VoiceStore {
  // Transcription state
  transcriptions: TranscriptionEntry[]
  currentTranscript: string
  isRecording: boolean
  isProcessing: boolean
  recordingDuration: number

  // Settings state
  settings: VoiceSettings
  isPanelOpen: boolean

  // Service state
  serviceReady: boolean
  transcriptionError: string | null

  // Actions: Transcription
  addTranscription: (entry: Omit<TranscriptionEntry, 'id'>) => void
  clearTranscriptions: () => void
  deleteTranscription: (id: string) => void
  setCurrentTranscript: (text: string) => void

  // Actions: Recording state
  setIsRecording: (recording: boolean) => void
  setIsProcessing: (processing: boolean) => void
  setRecordingDuration: (duration: number) => void
  incrementRecordingDuration: () => void

  // Actions: Settings
  updateSettings: (settings: Partial<VoiceSettings>) => void
  resetSettings: () => void

  // Actions: UI
  setPanelOpen: (open: boolean) => void
  setServiceReady: (ready: boolean) => void
  setTranscriptionError: (error: string | null) => void
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  // Initial state
  transcriptions: [],
  currentTranscript: '',
  isRecording: false,
  isProcessing: false,
  recordingDuration: 0,
  settings: DEFAULT_VOICE_SETTINGS,
  isPanelOpen: false,
  serviceReady: false,
  transcriptionError: null,

  // Transcription actions
  addTranscription: (entry) =>
    set((state) => ({
      transcriptions: [
        {
          id: `tr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...entry,
        },
        ...state.transcriptions,
      ],
    })),

  clearTranscriptions: () => set({ transcriptions: [] }),

  deleteTranscription: (id) =>
    set((state) => ({
      transcriptions: state.transcriptions.filter((t) => t.id !== id),
    })),

  setCurrentTranscript: (text) => set({ currentTranscript: text }),

  // Recording state actions
  setIsRecording: (recording) => set({ isRecording: recording }),

  setIsProcessing: (processing) => set({ isProcessing: processing }),

  setRecordingDuration: (duration) => set({ recordingDuration: duration }),

  incrementRecordingDuration: () =>
    set((state) => ({
      recordingDuration: state.recordingDuration + 1,
    })),

  // Settings actions
  updateSettings: (updates) =>
    set((state) => ({
      settings: { ...state.settings, ...updates },
    })),

  resetSettings: () => set({ settings: DEFAULT_VOICE_SETTINGS }),

  // UI actions
  setPanelOpen: (open) => set({ isPanelOpen: open }),

  setServiceReady: (ready) => set({ serviceReady: ready }),

  setTranscriptionError: (error) => set({ transcriptionError: error }),
}))
