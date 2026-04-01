import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TranscriptionHistory } from './TranscriptionHistory'
import { useVoiceStore } from '../../store/voiceStore'
import { vi } from 'vitest'

beforeEach(() => {
  useVoiceStore.setState({
    transcriptions: [],
  })
})

test('renders transcription history component', () => {
  render(<TranscriptionHistory />)
  expect(screen.getByText('Transcription History')).toBeInTheDocument()
})

test('shows 0 items when no transcriptions', () => {
  render(<TranscriptionHistory />)
  expect(screen.getByText(/0 items/)).toBeInTheDocument()
})

test('shows no transcriptions message when empty', () => {
  render(<TranscriptionHistory />)
  expect(screen.getByText('No transcriptions yet')).toBeInTheDocument()
})

test('displays transcriptions in list', () => {
  const now = Date.now()
  useVoiceStore.setState({
    transcriptions: [
      {
        id: '1',
        text: 'Hello world',
        language: 'en',
        confidence: 0.95,
        duration: 2.5,
        timestamp: now,
      },
      {
        id: '2',
        text: 'Test message',
        language: 'en',
        confidence: 0.88,
        duration: 3.2,
        timestamp: now - 60000,
      },
    ],
  })

  render(<TranscriptionHistory />)
  expect(screen.getByText(/2 items/)).toBeInTheDocument()
  expect(screen.getByText('Hello world')).toBeInTheDocument()
  expect(screen.getByText('Test message')).toBeInTheDocument()
})

test('renders search box when transcriptions exist', () => {
  useVoiceStore.setState({
    transcriptions: [
      {
        id: '1',
        text: 'Hello world',
        language: 'en',
        confidence: 0.95,
        duration: 2.5,
        timestamp: Date.now(),
      },
    ],
  })

  render(<TranscriptionHistory />)
  expect(screen.getByPlaceholderText('Search transcriptions...')).toBeInTheDocument()
})

test('filters transcriptions by search query', async () => {
  const user = userEvent.setup()
  useVoiceStore.setState({
    transcriptions: [
      {
        id: '1',
        text: 'Hello world',
        language: 'en',
        confidence: 0.95,
        duration: 2.5,
        timestamp: Date.now(),
      },
      {
        id: '2',
        text: 'Test message',
        language: 'en',
        confidence: 0.88,
        duration: 3.2,
        timestamp: Date.now(),
      },
    ],
  })

  render(<TranscriptionHistory />)

  const searchInput = screen.getByPlaceholderText('Search transcriptions...')
  await user.type(searchInput, 'Hello')

  expect(screen.getByText('Hello world')).toBeInTheDocument()
  expect(screen.queryByText('Test message')).not.toBeInTheDocument()
})

test('shows no matches message when search has no results', async () => {
  const user = userEvent.setup()
  useVoiceStore.setState({
    transcriptions: [
      {
        id: '1',
        text: 'Hello world',
        language: 'en',
        confidence: 0.95,
        duration: 2.5,
        timestamp: Date.now(),
      },
    ],
  })

  render(<TranscriptionHistory />)

  const searchInput = screen.getByPlaceholderText('Search transcriptions...')
  await user.type(searchInput, 'xyz')

  expect(screen.getByText('No matches found')).toBeInTheDocument()
})

test('displays export button when transcriptions exist', () => {
  useVoiceStore.setState({
    transcriptions: [
      {
        id: '1',
        text: 'Hello world',
        language: 'en',
        confidence: 0.95,
        duration: 2.5,
        timestamp: Date.now(),
      },
    ],
  })

  render(<TranscriptionHistory />)
  expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument()
})

test('displays clear all button when transcriptions exist', () => {
  useVoiceStore.setState({
    transcriptions: [
      {
        id: '1',
        text: 'Hello world',
        language: 'en',
        confidence: 0.95,
        duration: 2.5,
        timestamp: Date.now(),
      },
    ],
  })

  render(<TranscriptionHistory />)
  expect(screen.getByRole('button', { name: /Clear All/i })).toBeInTheDocument()
})

test('clears all transcriptions when clear button clicked', async () => {
  const user = userEvent.setup()
  useVoiceStore.setState({
    transcriptions: [
      {
        id: '1',
        text: 'Hello world',
        language: 'en',
        confidence: 0.95,
        duration: 2.5,
        timestamp: Date.now(),
      },
    ],
  })

  render(<TranscriptionHistory />)

  const clearButton = screen.getByRole('button', { name: /Clear All/i })
  await user.click(clearButton)

  expect(useVoiceStore.getState().transcriptions).toHaveLength(0)
})

test('shows language code for each transcription', () => {
  useVoiceStore.setState({
    transcriptions: [
      {
        id: '1',
        text: 'Hello',
        language: 'en',
        confidence: 0.95,
        duration: 2.5,
        timestamp: Date.now(),
      },
    ],
  })

  render(<TranscriptionHistory />)
  expect(screen.getByText('EN')).toBeInTheDocument()
})

test('shows confidence percentage for each transcription', () => {
  useVoiceStore.setState({
    transcriptions: [
      {
        id: '1',
        text: 'Hello',
        language: 'en',
        confidence: 0.95,
        duration: 2.5,
        timestamp: Date.now(),
      },
    ],
  })

  render(<TranscriptionHistory />)
  expect(screen.getByText(/Confidence: 95%/)).toBeInTheDocument()
})

test('shows duration for each transcription', () => {
  useVoiceStore.setState({
    transcriptions: [
      {
        id: '1',
        text: 'Hello',
        language: 'en',
        confidence: 0.95,
        duration: 2.5,
        timestamp: Date.now(),
      },
    ],
  })

  render(<TranscriptionHistory />)
  expect(screen.getByText(/2\.5s/)).toBeInTheDocument()
})

test('displays delete button for each transcription', () => {
  useVoiceStore.setState({
    transcriptions: [
      {
        id: '1',
        text: 'Hello world',
        language: 'en',
        confidence: 0.95,
        duration: 2.5,
        timestamp: Date.now(),
      },
    ],
  })

  render(<TranscriptionHistory />)
  expect(screen.getByLabelText(/Delete "Hello world"/)).toBeInTheDocument()
})
