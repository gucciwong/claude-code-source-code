import { render, screen, act } from '@testing-library/react'
import { vi } from 'vitest'
import { StatusBar } from './StatusBar'
import { useSystemStore } from '../../store/systemStore'
import { useDownloadStore } from '../../store/downloadStore'
import { useModelsStore } from '../../store/modelsStore'
import { useModelManagerStore } from '../../store/modelManagerStore'
import { useHealthStore } from '../../store/healthStore'

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
  useDownloadStore.setState({
    downloadStatuses: new Map(),
    downloadDetails: {},
  })
  useModelsStore.setState({
    installed: [],
    selected: null,
  })
  useModelManagerStore.setState({
    models: [],
    selectedModel: null,
    trainingJobs: [],
    activeTrainingJob: null,
    isLoading: false,
    error: null,
    loadModels: vi.fn().mockResolvedValue(undefined),
    selectModel: vi.fn(),
    setActiveModel: vi.fn().mockResolvedValue(undefined),
    deleteModel: vi.fn().mockResolvedValue(undefined),
    startTraining: vi.fn().mockResolvedValue(undefined),
    startOneClickTraining: vi.fn().mockResolvedValue(undefined),
    getTrainingStatus: vi.fn(),
    exportModel: vi.fn().mockResolvedValue(undefined),
    refreshModels: vi.fn().mockResolvedValue(undefined),
    isServiceAvailable: true,
    checkServiceAvailable: vi.fn().mockResolvedValue(true),
    last_error: null,
    cleanup_polls: vi.fn(),
  })
  // Reset health to "never checked" so tests that don't opt in to
  // populated services don't see the Services Online pill.
  useHealthStore.setState({
    services: [
      { name: 'Voice', url: 'x', status: 'unknown', latencyMs: null, lastChecked: null, error: null },
      { name: 'Training', url: 'x', status: 'unknown', latencyMs: null, lastChecked: null, error: null },
    ],
    polling: false,
    pollInterval: null,
  })
})

afterEach(() => {
  vi.useRealTimers()
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

test('StatusBar shows model size when it can resolve the active model', () => {
  useSystemStore.setState({ activeModel: 'qwen2.5-coder:32b' })
  useModelManagerStore.setState({
    models: [
      {
        id: 'qwen2.5-coder:32b',
        name: 'qwen2.5-coder:32b',
        cached: true,
        size_bytes: 19_800_000_000,
        local_path: 'C:/models/qwen2.5-coder-32b.gguf',
        format: 'gguf',
        source: 'local',
        status: 'ready',
      },
    ],
  })

  render(<StatusBar />)
  expect(screen.getByText('qwen2.5-coder:32b · 19.80 GB')).toBeInTheDocument()
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

  act(() => { useSystemStore.setState({ trainingStatus: 'running' }) })
  rerender(<StatusBar />)
  expect(screen.getByText(/Training: Running/)).toBeInTheDocument()
})

test('StatusBar shows federation peers only when > 0', () => {
  useSystemStore.setState({ federationPeers: 0 })
  render(<StatusBar />)
  expect(screen.queryByText(/peers/)).not.toBeInTheDocument()
})

test('StatusBar shows active download speed when a model is downloading', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-04-06T12:00:10Z'))

  useDownloadStore.setState({
    downloadStatuses: new Map([['qwen/model', 'downloading']]),
    downloadDetails: {
      'qwen/model': {
        status: 'downloading',
        progress: 25,
        total_size_gb: 10,
        downloaded_gb: 0.5,
        model_name: 'Qwen',
        started_at: new Date('2026-04-06T12:00:00Z').getTime() / 1000,
      },
    },
  })

  render(<StatusBar />)
  expect(screen.getByText(/DL 51\.2 MB\/s/i)).toBeInTheDocument()
})

// ── Services Online pill (v1.0 sovereign redesign) ─────────────────────

test('StatusBar hides Services Online pill until health has been checked at least once', () => {
  // Default beforeEach() state: services array populated but lastChecked
  // is null on every entry. Pill should not render.
  render(<StatusBar />)
  expect(screen.queryByText(/Services Online/)).not.toBeInTheDocument()
})

test('StatusBar shows "N/N Services Online" with green dot when all healthy', () => {
  useHealthStore.setState({
    services: [
      { name: 'Voice', url: 'x', status: 'healthy', latencyMs: 12, lastChecked: new Date(), error: null },
      { name: 'Training', url: 'x', status: 'healthy', latencyMs: 8, lastChecked: new Date(), error: null },
      { name: 'Model Manager', url: 'x', status: 'healthy', latencyMs: 5, lastChecked: new Date(), error: null },
    ],
    polling: false,
    pollInterval: null,
  })
  render(<StatusBar />)
  expect(screen.getByText('3/3 Services Online')).toBeInTheDocument()
  expect(screen.getByLabelText('3 of 3 services online')).toBeInTheDocument()
})

test('StatusBar shows amber state when some services are down', () => {
  useHealthStore.setState({
    services: [
      { name: 'Voice', url: 'x', status: 'healthy', latencyMs: 12, lastChecked: new Date(), error: null },
      { name: 'Training', url: 'x', status: 'unhealthy', latencyMs: null, lastChecked: new Date(), error: 'ECONNREFUSED' },
      { name: 'Model Manager', url: 'x', status: 'healthy', latencyMs: 5, lastChecked: new Date(), error: null },
    ],
    polling: false,
    pollInterval: null,
  })
  render(<StatusBar />)
  const label = screen.getByText('2/3 Services Online')
  expect(label).toBeInTheDocument()
  expect(label.className).toMatch(/text-yellow-400/)
})

test('StatusBar shows red state when no services are healthy', () => {
  useHealthStore.setState({
    services: [
      { name: 'Voice', url: 'x', status: 'unhealthy', latencyMs: null, lastChecked: new Date(), error: 'down' },
      { name: 'Training', url: 'x', status: 'unhealthy', latencyMs: null, lastChecked: new Date(), error: 'down' },
    ],
    polling: false,
    pollInterval: null,
  })
  render(<StatusBar />)
  const label = screen.getByText('0/2 Services Online')
  expect(label).toBeInTheDocument()
  expect(label.className).toMatch(/text-red-400/)
})
