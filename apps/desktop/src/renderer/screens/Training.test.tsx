import { render, screen, waitFor, act } from '@testing-library/react'
import { Training } from './Training'
import * as trainingHook from '../hooks/useTrainingService'
import { useSystemStore } from '../store/systemStore'
import { vi } from 'vitest'

// Mock the training service
vi.mock('../hooks/useTrainingService', () => ({
  useTrainingService: vi.fn(),
}))

const mockStats = {
  total_events: 500,
  completion_accepted: 350,
  completion_rejected: 80,
  completion_edited: 70,
  task_completed_total: 12,
  task_success_rate: 0.87,
  recent_events_24h: 45,
}

function mockServiceIdle() {
  vi.mocked(trainingHook.useTrainingService).mockReturnValue({
    trainingStatus: {
      model_id: 'test-model',
      active_cycle: 'quick' as const,
      quick_train_count: 3,
      next_full_train_in: 10,
      is_training: false,
    },
    isTraining: false,
    eventCount: 500,
    isServiceAvailable: true,
    getStats: vi.fn().mockResolvedValue(mockStats),
    getStatus: vi.fn().mockResolvedValue(null),
    logCompletion: vi.fn(),
    logInference: vi.fn(),
  } as any)
}

describe('Training Screen', () => {
  beforeEach(() => {
    mockServiceIdle()
    useSystemStore.setState({
      vramUsed: 18.2,
      vramTotal: 24,
      gpuTemp: 72,
    })
  })

  test('renders training console header', async () => {
    render(<Training />)
    await act(async () => {})
    expect(screen.getByText('Training Console')).toBeInTheDocument()
  })

  test('displays idle state when service reports not training', async () => {
    render(<Training />)
    await act(async () => {})
    expect(screen.getByText('IDLE')).toBeInTheDocument()
  })

  test('shows RUNNING when service reports is_training true', async () => {
    vi.mocked(trainingHook.useTrainingService).mockReturnValue({
      trainingStatus: {
        model_id: 'test-model',
        active_cycle: 'quick' as const,
        quick_train_count: 5,
        next_full_train_in: 5,
        is_training: true,
      },
      isTraining: true,
      eventCount: 500,
      isServiceAvailable: true,
      getStats: vi.fn().mockResolvedValue(mockStats),
      getStatus: vi.fn().mockResolvedValue(null),
      logCompletion: vi.fn(),
      logInference: vi.fn(),
    } as any)
    render(<Training />)
    await act(async () => {})
    expect(screen.getByText('RUNNING')).toBeInTheDocument()
  })

  test('shows progress percentage from trainingStatus when training', async () => {
    vi.mocked(trainingHook.useTrainingService).mockReturnValue({
      trainingStatus: {
        model_id: 'test-model',
        active_cycle: 'quick' as const,
        quick_train_count: 5,
        next_full_train_in: 5,
        is_training: true,
      },
      isTraining: true,
      eventCount: 500,
      isServiceAvailable: true,
      getStats: vi.fn().mockResolvedValue(mockStats),
      getStatus: vi.fn().mockResolvedValue(null),
      logCompletion: vi.fn(),
      logInference: vi.fn(),
    } as any)
    render(<Training />)
    await act(async () => {})
    // quick_train_count=5, next_full_train_in=5 => 5/(5+5)*100 = 50%
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  test('shows GPU temp from system store when training', async () => {
    vi.mocked(trainingHook.useTrainingService).mockReturnValue({
      trainingStatus: {
        model_id: 'test-model',
        active_cycle: 'quick' as const,
        quick_train_count: 5,
        next_full_train_in: 5,
        is_training: true,
      },
      isTraining: true,
      eventCount: 500,
      isServiceAvailable: true,
      getStats: vi.fn().mockResolvedValue(mockStats),
      getStatus: vi.fn().mockResolvedValue(null),
      logCompletion: vi.fn(),
      logInference: vi.fn(),
    } as any)
    render(<Training />)
    await act(async () => {})
    expect(screen.getByText(/72°C/)).toBeInTheDocument()
  })

  test('shows VRAM from system store when training', async () => {
    vi.mocked(trainingHook.useTrainingService).mockReturnValue({
      trainingStatus: {
        model_id: 'test-model',
        active_cycle: 'quick' as const,
        quick_train_count: 5,
        next_full_train_in: 5,
        is_training: true,
      },
      isTraining: true,
      eventCount: 500,
      isServiceAvailable: true,
      getStats: vi.fn().mockResolvedValue(mockStats),
      getStatus: vi.fn().mockResolvedValue(null),
      logCompletion: vi.fn(),
      logInference: vi.fn(),
    } as any)
    render(<Training />)
    await act(async () => {})
    expect(screen.getByText(/18\.2\/24 GB/)).toBeInTheDocument()
  })

  test('shows data collection completion pairs from service stats', async () => {
    await act(async () => { render(<Training />) })
    await waitFor(() => {
      expect(screen.getByText('350')).toBeInTheDocument()
    })
  })

  test('shows training service offline message when unavailable', async () => {
    vi.mocked(trainingHook.useTrainingService).mockReturnValue({
      trainingStatus: null,
      isTraining: false,
      eventCount: 0,
      isServiceAvailable: false,
      getStats: vi.fn().mockResolvedValue(null),
      getStatus: vi.fn().mockResolvedValue(null),
      logCompletion: vi.fn(),
      logInference: vi.fn(),
    } as any)
    render(<Training />)
    await act(async () => {})
    expect(screen.getByText(/Training service unavailable/)).toBeInTheDocument()
  })

  test('shows version history section', async () => {
    render(<Training />)
    await act(async () => {})
    expect(screen.getByText('Version History')).toBeInTheDocument()
  })

  test('shows no history message when runs list is empty', async () => {
    render(<Training />)
    await act(async () => {})
    expect(screen.getByText(/No training history available/)).toBeInTheDocument()
  })

  test('has schedule options', async () => {
    render(<Training />)
    await act(async () => {})
    expect(screen.getByLabelText('Manual (start manually)')).toBeInTheDocument()
    expect(screen.getByLabelText('Auto (train when GPU idle > 10 min)')).toBeInTheDocument()
    expect(screen.getByLabelText('Scheduled — Set Time...')).toBeInTheDocument()
  })

  test('has data collection action buttons', async () => {
    render(<Training />)
    await act(async () => {})
    expect(screen.getByText('Clear Dataset')).toBeInTheDocument()
    expect(screen.getByText('Preview Samples')).toBeInTheDocument()
    expect(screen.getByText('Export Dataset')).toBeInTheDocument()
  })

  test('renders screen testid', async () => {
    render(<Training />)
    await act(async () => {})
    expect(screen.getByTestId('screen-training')).toBeInTheDocument()
  })
})
