import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dashboard } from './Dashboard'
import { useSystemStore } from '../store/systemStore'
import { useNavigationStore } from '../store/navigationStore'

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
})

test('renders active model name', () => {
  render(<Dashboard />)
  expect(screen.getByText('llama3.1:8b')).toBeInTheDocument()
})

test('renders tok/s', () => {
  render(<Dashboard />)
  expect(screen.getByText('45 tok/s')).toBeInTheDocument()
})

test('renders VRAM bar with aria role', () => {
  render(<Dashboard />)
  const bar = screen.getByRole('progressbar', { name: /VRAM/i })
  expect(bar).toBeInTheDocument()
})

test('shows inference ready when online', () => {
  render(<Dashboard />)
  expect(screen.getByText(/Inference: Ready/i)).toBeInTheDocument()
})

test('shows inference offline when ollamaOnline is false', () => {
  useSystemStore.setState({ ollamaOnline: false })
  render(<Dashboard />)
  expect(screen.getByText(/Inference: Offline/i)).toBeInTheDocument()
})

test('Open Chat button navigates to chat', async () => {
  const user = userEvent.setup()
  render(<Dashboard />)
  const chatButtons = screen.getAllByRole('button', { name: /Open Chat/i })
  await user.click(chatButtons[0])
  expect(useNavigationStore.getState().active).toBe('chat')
})

test('Browse Models button navigates to models', async () => {
  const user = userEvent.setup()
  render(<Dashboard />)
  await user.click(screen.getByRole('button', { name: /Browse Models/i }))
  expect(useNavigationStore.getState().active).toBe('models')
})
