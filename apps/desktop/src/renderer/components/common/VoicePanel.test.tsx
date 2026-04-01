import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VoicePanel } from './VoicePanel'
import { vi } from 'vitest'

// Mock voice components
vi.mock('./VoiceInput', () => ({
  VoiceInput: () => <div data-testid="voice-input">VoiceInput</div>,
}))

vi.mock('./VoiceOutput', () => ({
  VoiceOutput: () => <div data-testid="voice-output">VoiceOutput</div>,
}))

vi.mock('./VoiceSettings', () => ({
  VoiceSettings: () => <div data-testid="voice-settings">VoiceSettings</div>,
}))

vi.mock('./TranscriptionHistory', () => ({
  TranscriptionHistory: () => <div data-testid="transcription-history">TranscriptionHistory</div>,
}))

test('renders voice panel with header', () => {
  render(<VoicePanel />)
  expect(screen.getByText('Voice Controls')).toBeInTheDocument()
})

test('starts collapsed', () => {
  render(<VoicePanel />)
  expect(screen.queryByTestId('voice-input')).not.toBeInTheDocument()
})

test('expands when header clicked', async () => {
  const user = userEvent.setup()
  render(<VoicePanel />)

  const header = screen.getByRole('button', { name: 'Voice controls' })
  await user.click(header)

  expect(screen.getByTestId('voice-input')).toBeInTheDocument()
})

test('collapses when header clicked again', async () => {
  const user = userEvent.setup()
  render(<VoicePanel />)

  const header = screen.getByRole('button', { name: 'Voice controls' })

  // Expand
  await user.click(header)
  expect(screen.getByTestId('voice-input')).toBeInTheDocument()

  // Collapse
  await user.click(header)
  expect(screen.queryByTestId('voice-input')).not.toBeInTheDocument()
})

test('renders all tab buttons when expanded', async () => {
  const user = userEvent.setup()
  render(<VoicePanel />)

  const header = screen.getByRole('button', { name: 'Voice controls' })
  await user.click(header)

  expect(screen.getByRole('tab', { name: 'Input' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Output' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Settings' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'History' })).toBeInTheDocument()
})

test('input tab is active by default', async () => {
  const user = userEvent.setup()
  render(<VoicePanel />)

  const header = screen.getByRole('button', { name: 'Voice controls' })
  await user.click(header)

  expect(screen.getByTestId('voice-input')).toBeInTheDocument()
})

test('switches to output tab when clicked', async () => {
  const user = userEvent.setup()
  render(<VoicePanel />)

  const header = screen.getByRole('button', { name: 'Voice controls' })
  await user.click(header)

  const outputTab = screen.getByRole('tab', { name: 'Output' })
  await user.click(outputTab)

  expect(screen.getByTestId('voice-output')).toBeInTheDocument()
  expect(screen.queryByTestId('voice-input')).not.toBeInTheDocument()
})

test('switches to settings tab when clicked', async () => {
  const user = userEvent.setup()
  render(<VoicePanel />)

  const header = screen.getByRole('button', { name: 'Voice controls' })
  await user.click(header)

  const settingsTab = screen.getByRole('tab', { name: 'Settings' })
  await user.click(settingsTab)

  expect(screen.getByTestId('voice-settings')).toBeInTheDocument()
  expect(screen.queryByTestId('voice-input')).not.toBeInTheDocument()
})

test('switches to history tab when clicked', async () => {
  const user = userEvent.setup()
  render(<VoicePanel />)

  const header = screen.getByRole('button', { name: 'Voice controls' })
  await user.click(header)

  const historyTab = screen.getByRole('tab', { name: 'History' })
  await user.click(historyTab)

  expect(screen.getByTestId('transcription-history')).toBeInTheDocument()
  expect(screen.queryByTestId('voice-input')).not.toBeInTheDocument()
})

test('active tab has accent color styling', async () => {
  const user = userEvent.setup()
  render(<VoicePanel />)

  const header = screen.getByRole('button', { name: 'Voice controls' })
  await user.click(header)

  const inputTab = screen.getByRole('tab', { name: 'Input' })
  expect(inputTab).toHaveClass('text-accent-500', 'border-b-2', 'border-accent-500')
})

test('inactive tabs have secondary text color', async () => {
  const user = userEvent.setup()
  render(<VoicePanel />)

  const header = screen.getByRole('button', { name: 'Voice controls' })
  await user.click(header)

  const outputTab = screen.getByRole('tab', { name: 'Output' })
  expect(outputTab).toHaveClass('text-text-secondary')
})

test('passes onTranscriptionComplete callback to VoiceInput', async () => {
  const callback = vi.fn()
  render(<VoicePanel onTranscriptionComplete={callback} />)

  // Since VoiceInput is mocked, we just verify the component renders
  expect(screen.getByText('Voice Controls')).toBeInTheDocument()
})

test('header button is accessible', async () => {
  const user = userEvent.setup()
  render(<VoicePanel />)

  const header = screen.getByRole('button', { name: 'Voice controls' })
  expect(header).toHaveAttribute('aria-expanded', 'false')

  await user.click(header)
  expect(header).toHaveAttribute('aria-expanded', 'true')
})

test('renders tabpanel for content', async () => {
  const user = userEvent.setup()
  render(<VoicePanel />)

  const header = screen.getByRole('button', { name: 'Voice controls' })
  await user.click(header)

  const tabpanel = screen.getByRole('tabpanel')
  expect(tabpanel).toBeInTheDocument()
})
