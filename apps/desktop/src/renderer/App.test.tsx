import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, test, expect, vi } from 'vitest'
import App from './App'
import { useSystemStore } from './store/systemStore'
import { useNavigationStore } from './store/navigationStore'
import { useModelsStore } from './store/modelsStore'

// Mock the ollamaClient object so no real HTTP calls happen
vi.mock('./services/ollamaClient', () => ({
  ollamaClient: {
    isOnline: vi.fn().mockResolvedValue(true),
    getModels: vi.fn().mockResolvedValue([
      {
        name: 'llama3.1:8b',
        size: 4_500_000_000,
        digest: 'abc123',
        modified_at: '2024-01-15T10:00:00Z',
      },
    ]),
    streamChat: async function* () {
      yield 'Hello'
    },
  },
}))

beforeEach(() => {
  useSystemStore.setState({
    activeModel: 'llama3.1:8b',
    tokensPerSec: 45,
    vramUsed: 5.2,
    vramTotal: 24,
    gpuTemp: 72,
    trainingStatus: 'idle',
    federationPeers: 0,
    ollamaOnline: true,
  })
  useNavigationStore.setState({ active: 'dashboard' })
  useModelsStore.setState({ installed: [], selected: null })
})

test('renders Running Locally badge in status bar', () => {
  render(<App />)
  expect(screen.getByText('Running Locally')).toBeInTheDocument()
})

test('renders Dashboard screen by default', () => {
  render(<App />)
  expect(screen.getByTestId('screen-dashboard')).toBeInTheDocument()
})

test('navigating to Models shows Models screen', async () => {
  const user = userEvent.setup()
  render(<App />)
  const nav = screen.getByRole('navigation', { name: 'Primary navigation' })
  await user.click(within(nav).getByRole('button', { name: 'Models' }))
  expect(screen.getByTestId('screen-models')).toBeInTheDocument()
})

test('navigating to Chat shows Chat screen', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: /^Chat$/i }))
  expect(screen.getByTestId('screen-chat')).toBeInTheDocument()
})

test('status bar is present in the document', () => {
  render(<App />)
  expect(screen.getByRole('status')).toBeInTheDocument()
})
