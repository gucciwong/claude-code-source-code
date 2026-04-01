import { render, screen } from '@testing-library/react'
import { StatusBar } from './StatusBar'
import { useSystemStore } from '../../store/systemStore'

beforeEach(() => {
  useSystemStore.setState({
    activeModel: null,
    tokensPerSec: null,
    vramUsed: null,
    vramTotal: null,
    gpuTemp: null,
    trainingStatus: 'idle',
    federationPeers: 0,
    ollamaOnline: false,
  })
})

test('StatusBar has role="status"', () => {
  render(<StatusBar />)
  expect(screen.getByRole('status')).toBeInTheDocument()
})

test('StatusBar shows "Running Locally" badge', () => {
  render(<StatusBar />)
  expect(screen.getByText('Running Locally')).toBeInTheDocument()
})

test('StatusBar shows model name when model is loaded', () => {
  useSystemStore.setState({ activeModel: 'qwen2.5-coder:32b' })
  render(<StatusBar />)
  expect(screen.getByText('qwen2.5-coder:32b')).toBeInTheDocument()
})

test('StatusBar shows VRAM and temp when available', () => {
  useSystemStore.setState({ vramUsed: 18.2, vramTotal: 24, gpuTemp: 72 })
  render(<StatusBar />)
  expect(screen.getByText(/18\.2\/24/)).toBeInTheDocument()
  expect(screen.getByText(/72°C/)).toBeInTheDocument()
})

test('StatusBar shows tok/s when available', () => {
  useSystemStore.setState({ tokensPerSec: 45.3 })
  render(<StatusBar />)
  expect(screen.getByText(/45 tok\/s/)).toBeInTheDocument()
})

test('StatusBar shows Training status only when running', () => {
  useSystemStore.setState({ trainingStatus: 'idle' })
  const { rerender } = render(<StatusBar />)
  expect(screen.queryByText(/Training: Running/)).not.toBeInTheDocument()

  useSystemStore.setState({ trainingStatus: 'running' })
  rerender(<StatusBar />)
  expect(screen.getByText(/Training: Running/)).toBeInTheDocument()
})

test('StatusBar shows federation peers only when > 0', () => {
  useSystemStore.setState({ federationPeers: 0 })
  render(<StatusBar />)
  expect(screen.queryByText(/peers/)).not.toBeInTheDocument()
})
