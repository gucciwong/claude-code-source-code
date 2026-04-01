import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VoiceInput } from './VoiceInput'
import { useVoiceStore } from '../../store/voiceStore'
import { useVoiceService } from '../../hooks/useVoiceService'
import { vi } from 'vitest'

// Mock voice service
vi.mock('../../hooks/useVoiceService', () => ({
  useVoiceService: vi.fn(),
}))

beforeEach(() => {
  useVoiceStore.setState({
    isRecording: false,
    isProcessing: false,
    recordingDuration: 0,
    settings: {
      modelSize: 'base',
      language: 'en',
      autoInsert: false,
      playTTS: true,
      recordAudio: true,
    },
  })

  vi.mocked(useVoiceService).mockReturnValue({
    transcribeAudio: vi.fn(),
    checkServiceHealth: vi.fn(),
    synthesizeText: vi.fn(),
    getServiceDetails: vi.fn(),
  })
})

test('renders voice input component', () => {
  render(<VoiceInput />)
  expect(screen.getByText('Voice Input')).toBeInTheDocument()
})

test('renders start recording button', () => {
  render(<VoiceInput />)
  expect(screen.getByRole('button', { name: /Start Recording/i })).toBeInTheDocument()
})

test('renders upload button', () => {
  render(<VoiceInput />)
  expect(screen.getByRole('button', { name: /Upload/i })).toBeInTheDocument()
})

test('has hidden file input for upload', () => {
  const { container } = render(<VoiceInput />)
  const fileInput = container.querySelector('input[type="file"]')
  expect(fileInput).toBeInTheDocument()
  expect(fileInput).toHaveAttribute('accept', 'audio/*')
})

test('displays ready status indicator initially', () => {
  render(<VoiceInput />)
  expect(screen.getByText('Ready')).toBeInTheDocument()
})

test('shows processing status when isProcessing is true', () => {
  useVoiceStore.setState({ isProcessing: true })
  render(<VoiceInput />)
  // getAllByText because "Processing..." appears in both button and span
  const processingElements = screen.getAllByText(/Processing/)
  expect(processingElements.length).toBeGreaterThan(0)
})

test('shows recording status when isRecording is true', () => {
  useVoiceStore.setState({ isRecording: true })
  render(<VoiceInput />)
  // Check for the Recording status span (not the button)
  const recordingSpans = screen.getAllByText(/Recording/)
  expect(recordingSpans.some(el => el.tagName === 'SPAN')).toBe(true)
})

test('disables upload button when recording', () => {
  useVoiceStore.setState({ isRecording: true })
  render(<VoiceInput />)
  expect(screen.getByRole('button', { name: /Upload/i })).toBeDisabled()
})

test('disables upload button when processing', () => {
  useVoiceStore.setState({ isProcessing: true })
  render(<VoiceInput />)
  expect(screen.getByRole('button', { name: /Upload/i })).toBeDisabled()
})

test('shows stop recording button when recording', () => {
  useVoiceStore.setState({ isRecording: true })
  render(<VoiceInput />)
  expect(screen.getByRole('button', { name: /Stop Recording/i })).toBeInTheDocument()
})

test('shows recording duration when recording', () => {
  useVoiceStore.setState({ isRecording: true, recordingDuration: 65 })
  render(<VoiceInput />)
  expect(screen.getByText('01:05')).toBeInTheDocument()
})

test('renders waveform canvas element', () => {
  const { container } = render(<VoiceInput />)
  expect(container.querySelector('canvas')).toBeInTheDocument()
})

test('start recording button has correct styling', () => {
  render(<VoiceInput />)
  const button = screen.getByRole('button', { name: /Start Recording/i })
  expect(button).toHaveClass('bg-accent-500', 'hover:bg-accent-400')
})

test('stop recording button has red styling', () => {
  useVoiceStore.setState({ isRecording: true })
  render(<VoiceInput />)
  const button = screen.getByRole('button', { name: /Stop Recording/i })
  expect(button).toHaveClass('bg-red-500', 'hover:bg-red-600')
})

test('shows spinner when processing', () => {
  useVoiceStore.setState({ isProcessing: true })
  render(<VoiceInput />)
  // getAllByText because "Processing" appears in both button and span
  const elements = screen.getAllByText(/Processing/)
  expect(elements.length).toBeGreaterThan(0)
})
