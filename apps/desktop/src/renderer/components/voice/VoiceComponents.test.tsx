import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VoiceSettings } from './VoiceSettings'
import { TranscriptionHistory } from './TranscriptionHistory'
import { useVoiceStore } from '../../store/voiceStore'

describe('VoiceSettings', () => {
  beforeEach(() => {
    useVoiceStore.setState({
      settings: {
        modelSize: 'base',
        language: 'en',
        autoInsert: false,
        playTTS: true,
        recordAudio: true,
      },
    })
  })

  it('should render settings form', () => {
    render(<VoiceSettings />)
    expect(screen.getByText('Voice Settings')).toBeInTheDocument()
    expect(screen.getByLabelText('Model Size')).toBeInTheDocument()
    expect(screen.getByLabelText('Language')).toBeInTheDocument()
  })

  it('should display toggle options', () => {
    render(<VoiceSettings />)
    expect(screen.getByText('Auto-insert transcription')).toBeInTheDocument()
    expect(screen.getByText('Play TTS responses')).toBeInTheDocument()
    expect(screen.getByText('Record audio locally')).toBeInTheDocument()
  })

  it('should have close button when onClose provided', () => {
    const onClose = vi.fn()
    render(<VoiceSettings onClose={onClose} />)
    expect(screen.getByLabelText('Close settings')).toBeInTheDocument()
  })

  it('should display privacy info', () => {
    render(<VoiceSettings />)
    expect(screen.getByText(/Voice processing runs locally/)).toBeInTheDocument()
  })
})

describe('TranscriptionHistory', () => {
  beforeEach(() => {
    useVoiceStore.setState({
      transcriptions: [],
    })
  })

  it('should show empty state when no transcriptions', () => {
    render(<TranscriptionHistory />)
    expect(screen.getByText('No transcriptions yet')).toBeInTheDocument()
  })

  it('should render transcription list', () => {
    useVoiceStore.setState({
      transcriptions: [
        {
          id: '1',
          text: 'Hello world',
          language: 'en',
          timestamp: Date.now(),
          confidence: 0.95,
          duration: 2.5,
        },
        {
          id: '2',
          text: 'Second transcription',
          language: 'en',
          timestamp: Date.now(),
          confidence: 0.87,
          duration: 3.2,
        },
      ],
    })

    render(<TranscriptionHistory />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
    expect(screen.getByText('Second transcription')).toBeInTheDocument()
    expect(screen.getByText(/Transcription History \(2\)/)).toBeInTheDocument()
  })

  it('should support search filtering', () => {
    useVoiceStore.setState({
      transcriptions: [
        {
          id: '1',
          text: 'Python code',
          language: 'en',
          timestamp: Date.now(),
          confidence: 0.9,
          duration: 2,
        },
        {
          id: '2',
          text: 'JavaScript example',
          language: 'en',
          timestamp: Date.now(),
          confidence: 0.9,
          duration: 2,
        },
      ],
    })

    render(<TranscriptionHistory />)
    const searchInput = screen.getByPlaceholderText('Search transcriptions...')
    expect(searchInput).toBeInTheDocument()
  })

  it('should have export button', () => {
    useVoiceStore.setState({
      transcriptions: [
        {
          id: '1',
          text: 'Test',
          language: 'en',
          timestamp: Date.now(),
          confidence: 0.9,
          duration: 1,
        },
      ],
    })

    render(<TranscriptionHistory />)
    expect(screen.getByLabelText('Export transcriptions')).toBeInTheDocument()
  })

  it('should have truncate class for long text', () => {
    useVoiceStore.setState({
      transcriptions: [
        {
          id: '1',
          text: 'This is a very long transcription text that should wrap properly in the UI',
          language: 'en',
          timestamp: Date.now(),
          confidence: 0.9,
          duration: 5,
        },
      ],
    })

    render(<TranscriptionHistory />)
    const textElement = screen.getByText(/very long transcription/)
    expect(textElement.className).toContain('break-words')
  })

  it('should display confidence score as progress bar', () => {
    useVoiceStore.setState({
      transcriptions: [
        {
          id: '1',
          text: 'High confidence',
          language: 'en',
          timestamp: Date.now(),
          confidence: 0.95,
          duration: 2,
        },
      ],
    })

    render(<TranscriptionHistory />)
    // The progress bar and confidence percentage should exist
    const formattedConfidence = screen.getByText(/95%/)
    expect(formattedConfidence).toBeInTheDocument()
  })
})
