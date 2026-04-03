import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { Developer } from './Developer'
import { useSystemStore } from '../store/systemStore'

let clipboardWriteMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  clipboardWriteMock = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: clipboardWriteMock },
    writable: true,
    configurable: true,
  })
  useSystemStore.setState({ activeModel: null })
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('renders "Local API" heading', () => {
  render(<Developer />)
  expect(screen.getByRole('heading', { name: 'Local API' })).toBeInTheDocument()
})

test('renders all three tab triggers', () => {
  render(<Developer />)
  expect(screen.getByRole('tab', { name: 'Ollama' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'OpenAI-compatible' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Messages API-compatible' })).toBeInTheDocument()
})

test('Ollama tab is active by default and shows copy buttons for each snippet', () => {
  render(<Developer />)
  expect(screen.getByRole('button', { name: 'Copy curl example' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Copy Python example' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Copy Node.js example' })).toBeInTheDocument()
})

test('active model name appears in the snippets', () => {
  useSystemStore.setState({ activeModel: 'mistral:7b' })
  render(<Developer />)
  expect(document.body.textContent).toContain('mistral:7b')
})

test('falls back to llama3.1:8b when no active model', () => {
  useSystemStore.setState({ activeModel: null })
  render(<Developer />)
  expect(document.body.textContent).toContain('llama3.1:8b')
})

test('copy button triggers clipboard write', async () => {
  render(<Developer />)
  const copyBtn = screen.getByRole('button', { name: 'Copy curl example' })
  fireEvent.click(copyBtn)
  await waitFor(() => {
    expect(clipboardWriteMock).toHaveBeenCalled()
  })
})
