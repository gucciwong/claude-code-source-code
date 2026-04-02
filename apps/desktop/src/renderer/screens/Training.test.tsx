import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Training } from './Training'
import * as trainingHook from '../hooks/useTrainingService'
import { vi } from 'vitest'

// Mock the training service
vi.mock('../hooks/useTrainingService', () => ({
  useTrainingService: vi.fn(),
}))

describe('Training Screen', () => {
  beforeEach(() => {
    // Mock training service as available
    vi.mocked(trainingHook.useTrainingService).mockReturnValue({
      trainingStatus: {
        is_training: false,
        uptime_seconds: 3600,
      },
      eventCount: 500,
      isServiceAvailable: true,
    } as any)
  })

  test('renders training console header', () => {
    render(<Training />)
    expect(screen.getByText('Training Console')).toBeInTheDocument()
  })

  test('displays idle state by default', () => {
    render(<Training />)
    expect(screen.getByText('IDLE')).toBeInTheDocument()
  })

  test('shows data collection stats', () => {
    render(<Training />)
    expect(screen.getByText(/847 completion pairs/)).toBeInTheDocument()
    expect(screen.getByText(/12 agent trajectories/)).toBeInTheDocument()
    expect(screen.getByText(/203 correction pairs/)).toBeInTheDocument()
  })

  test('displays version history', () => {
    render(<Training />)
    expect(screen.getByText('v1.4')).toBeInTheDocument()
    expect(screen.getByText('v1.3')).toBeInTheDocument()
    expect(screen.getByText('v1.2')).toBeInTheDocument()
  })

  test('has schedule options', () => {
    render(<Training />)
    expect(screen.getByLabelText('Manual (start manually)')).toBeInTheDocument()
    expect(screen.getByLabelText('Auto (train when GPU idle > 10 min)')).toBeInTheDocument()
    expect(screen.getByLabelText('Scheduled — Set Time...')).toBeInTheDocument()
  })

  test('start training button toggles running state', async () => {
    const user = userEvent.setup()
    render(<Training />)

    const startButton = screen.getByText('Start Training')
    await user.click(startButton)

    expect(screen.getByText('RUNNING')).toBeInTheDocument()
  })

  test('has data collection action buttons', () => {
    render(<Training />)
    expect(screen.getByText('Clear Dataset')).toBeInTheDocument()
    expect(screen.getByText('Preview Samples')).toBeInTheDocument()
    expect(screen.getByText('Export Dataset')).toBeInTheDocument()
  })

  test('displays test file id', () => {
    render(<Training />)
    expect(screen.getByTestId('screen-training')).toBeInTheDocument()
  })
})
