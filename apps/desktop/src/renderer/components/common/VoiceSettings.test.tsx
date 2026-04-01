import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VoiceSettings } from './VoiceSettings'
import { useVoiceStore, DEFAULT_VOICE_SETTINGS } from '../../store/voiceStore'

beforeEach(() => {
  useVoiceStore.setState({
    settings: DEFAULT_VOICE_SETTINGS,
  })
})

test('renders voice settings component', () => {
  render(<VoiceSettings />)
  expect(screen.getByText('Voice Settings')).toBeInTheDocument()
})

test('renders model size selector', () => {
  render(<VoiceSettings />)
  expect(screen.getByText('Speech Recognition Model')).toBeInTheDocument()
  expect(screen.getByDisplayValue('Base (80M) - Fast')).toBeInTheDocument()
})

test('renders all model size options', () => {
  render(<VoiceSettings />)
  expect(screen.getByText('Base (80M) - Fast')).toBeInTheDocument()
  expect(screen.getByText('Small (140M) - Balanced')).toBeInTheDocument()
  expect(screen.getByText('Medium (300M) - More Accurate')).toBeInTheDocument()
  expect(screen.getByText('Large (700M) - Most Accurate')).toBeInTheDocument()
})

test('renders language selector', () => {
  render(<VoiceSettings />)
  expect(screen.getByText('Language')).toBeInTheDocument()
  expect(screen.getByDisplayValue('English')).toBeInTheDocument()
})

test('renders all language options', () => {
  render(<VoiceSettings />)
  expect(screen.getByText('English')).toBeInTheDocument()
  expect(screen.getByText('Spanish')).toBeInTheDocument()
  expect(screen.getByText('French')).toBeInTheDocument()
  expect(screen.getByText('German')).toBeInTheDocument()
  expect(screen.getByText('Chinese')).toBeInTheDocument()
  expect(screen.getByText('Japanese')).toBeInTheDocument()
})

test('renders toggle checkboxes', () => {
  render(<VoiceSettings />)
  expect(screen.getByRole('checkbox', { name: /Auto-insert transcription/i })).toBeInTheDocument()
  expect(screen.getByRole('checkbox', { name: /Play text-to-speech/i })).toBeInTheDocument()
  expect(screen.getByRole('checkbox', { name: /Record audio locally/i })).toBeInTheDocument()
})

test('checkbox values match store settings', () => {
  useVoiceStore.setState({
    settings: {
      ...DEFAULT_VOICE_SETTINGS,
      autoInsert: true,
      playTTS: false,
      recordAudio: true,
    },
  })

  render(<VoiceSettings />)
  expect(screen.getByRole('checkbox', { name: /Auto-insert transcription/i })).toBeChecked()
  expect(screen.getByRole('checkbox', { name: /Play text-to-speech/i })).not.toBeChecked()
  expect(screen.getByRole('checkbox', { name: /Record audio locally/i })).toBeChecked()
})

test('updates model size when changed', async () => {
  const user = userEvent.setup()
  render(<VoiceSettings />)

  const modelSelect = screen.getByDisplayValue('Base (80M) - Fast') as HTMLSelectElement
  // Use fireEvent to directly change the select value, as userEvent.selectOption may not be available
  modelSelect.value = 'large'
  await user.click(modelSelect)
  fireEvent.change(modelSelect, { target: { value: 'large' } })

  expect(useVoiceStore.getState().settings.modelSize).toBe('large')
})

test('updates language when changed', async () => {
  const user = userEvent.setup()
  render(<VoiceSettings />)

  const langSelect = screen.getByDisplayValue('English') as HTMLSelectElement
  langSelect.value = 'es'
  await user.click(langSelect)
  fireEvent.change(langSelect, { target: { value: 'es' } })

  expect(useVoiceStore.getState().settings.language).toBe('es')
})

test('updates autoInsert setting when checkbox toggled', async () => {
  const user = userEvent.setup()
  render(<VoiceSettings />)

  const checkbox = screen.getByRole('checkbox', { name: /Auto-insert transcription/i })
  expect(checkbox).not.toBeChecked()

  await user.click(checkbox)
  expect(checkbox).toBeChecked()
})

test('selects have correct styling', () => {
  render(<VoiceSettings />)
  // In jsdom, select elements have role="combobox", not "listbox"
  const selects = screen.getAllByRole('combobox')
  expect(selects.length).toBe(2) // model size + language
  selects.forEach(select => {
    expect(select).toHaveClass('bg-bg-surface-1', 'border-border-default', 'rounded-md')
  })
})

test('checkboxes have correct styling', () => {
  render(<VoiceSettings />)
  const checkboxes = screen.getAllByRole('checkbox')
  checkboxes.forEach((checkbox) => {
    expect(checkbox).toHaveClass('w-4', 'h-4', 'rounded')
  })
})

test('shows helper text for model size', () => {
  render(<VoiceSettings />)
  expect(screen.getByText('Larger models are slower but more accurate')).toBeInTheDocument()
})
