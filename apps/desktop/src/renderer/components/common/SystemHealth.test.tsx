import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { SystemHealth } from './SystemHealth'
import { useSystemStore } from '../../store/systemStore'
import { useModelsStore } from '../../store/modelsStore'
import { useModelManagerStore } from '../../store/modelManagerStore'

describe('SystemHealth', () => {
  beforeEach(() => {
    Object.defineProperty(window.navigator, 'hardwareConcurrency', {
      configurable: true,
      value: 12,
    })
    Object.defineProperty(window.navigator, 'deviceMemory', {
      configurable: true,
      value: 32,
    })
    Object.defineProperty(window.navigator, 'storage', {
      configurable: true,
      value: {
        estimate: vi.fn().mockResolvedValue({
          quota: 500 * 1024 * 1024 * 1024,
          usage: 120 * 1024 * 1024 * 1024,
        }),
      },
    })
    useSystemStore.setState({
      gpuTemp: 65,
      vramUsed: 12,
      vramTotal: 24,
      tokensPerSec: 45,
      activeModel: 'llama3.1:8b',
    })
    useModelsStore.setState({
      installed: [
        {
          name: 'llama3.1:8b',
          size: 4_500_000_000,
          digest: 'abc',
          modified_at: '2024-01-01T00:00:00Z',
          details: {
            parameter_size: '8B',
            format: 'gguf',
          },
        },
      ],
      selected: 'llama3.1:8b',
    })
    useModelManagerStore.setState({ models: [], selectedModel: null, last_error: null })
  })

  it('renders system health header', () => {
    render(<SystemHealth />)
    expect(screen.getByText('System Health')).toBeInTheDocument()
  })

  it('displays all health metrics', () => {
    render(<SystemHealth />)
    expect(screen.getByText('GPU Temperature')).toBeInTheDocument()
    expect(screen.getByText('VRAM Usage')).toBeInTheDocument()
    expect(screen.getByText('Inference Speed')).toBeInTheDocument()
    expect(screen.getByText('Model Status')).toBeInTheDocument()
  })

  it('displays GPU temperature metric', () => {
    render(<SystemHealth />)
    expect(screen.getByText('65°C')).toBeInTheDocument()
  })

  it('displays VRAM usage with percentage', () => {
    render(<SystemHealth />)
    expect(screen.getByText(/12\/24 GB/)).toBeInTheDocument()
    expect(screen.getByText(/50%/)).toBeInTheDocument()
  })

  it('displays tokens per second', () => {
    render(<SystemHealth />)
    expect(screen.getByText('45 tok/s')).toBeInTheDocument()
  })

  it('displays model status when loaded', () => {
    render(<SystemHealth />)
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })

  it('shows healthy status when all metrics are good', () => {
    render(<SystemHealth />)
    const okIndicators = screen.getAllByText('✓ OK')
    expect(okIndicators.length).toBeGreaterThan(0)
  })

  it('marks temperature as warning when >75C', () => {
    useSystemStore.setState({ gpuTemp: 78 })
    render(<SystemHealth />)
    expect(screen.getByText('⚠ Warning')).toBeInTheDocument()
  })

  it('marks temperature as critical when >85C', () => {
    useSystemStore.setState({ gpuTemp: 90 })
    render(<SystemHealth />)
    expect(screen.getByText('⚠ Critical')).toBeInTheDocument()
  })

  it('marks VRAM as warning when >75%', () => {
    useSystemStore.setState({ vramUsed: 19, vramTotal: 24 }) // ~79%
    render(<SystemHealth />)
    const warnings = screen.getAllByText('⚠ Warning')
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('marks VRAM as critical when >90%', () => {
    useSystemStore.setState({ vramUsed: 22, vramTotal: 24 }) // ~92%
    render(<SystemHealth />)
    expect(screen.getByText('⚠ Critical')).toBeInTheDocument()
  })

  it('shows warning badge for warning metrics', () => {
    useSystemStore.setState({ gpuTemp: 80 })
    render(<SystemHealth />)
    expect(screen.getByText(/1 warning/)).toBeInTheDocument()
  })

  it('shows critical badge when there are critical issues', () => {
    useSystemStore.setState({ gpuTemp: 90, vramUsed: 23, vramTotal: 24 })
    render(<SystemHealth />)
    expect(screen.getByText(/2 critical/)).toBeInTheDocument()
  })

  it('shows alert message when critical issues exist', () => {
    useSystemStore.setState({ gpuTemp: 90 })
    render(<SystemHealth />)
    expect(screen.getByText('System Issues Detected')).toBeInTheDocument()
    expect(screen.getByText(/GPU temperature and VRAM usage/)).toBeInTheDocument()
  })

  it('does not show alert when all metrics are healthy', () => {
    render(<SystemHealth />)
    expect(screen.queryByText('System Issues Detected')).not.toBeInTheDocument()
  })

  it('displays no model status when inactive', () => {
    useSystemStore.setState({ activeModel: '' })
    render(<SystemHealth />)
    expect(screen.getByText('No model')).toBeInTheDocument()
  })

  it('marks inference speed as warning when <10 tok/s', () => {
    useSystemStore.setState({ tokensPerSec: 5 })
    render(<SystemHealth />)
    const warnings = screen.getAllByText('⚠ Warning')
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('updates when system store changes', () => {
    const { rerender } = render(<SystemHealth />)
    expect(screen.getByText('65°C')).toBeInTheDocument()

    act(() => { useSystemStore.setState({ gpuTemp: 75 }) })
    rerender(<SystemHealth />)
    expect(screen.getByText('75°C')).toBeInTheDocument()
  })

  it('has accessible role attributes', () => {
    render(<SystemHealth />)
    const metrics = screen.getAllByRole('status')
    expect(metrics.length).toBe(4) // 4 metrics
  })

  it('has accessible aria-labels on metrics', () => {
    render(<SystemHealth />)
    expect(screen.getByLabelText(/GPU Temperature/)).toBeInTheDocument()
    expect(screen.getByLabelText(/VRAM Usage/)).toBeInTheDocument()
  })

  it('renders hardware fit details for the active model', async () => {
    render(<SystemHealth />)
    expect(await screen.findByText('Hardware Fit')).toBeInTheDocument()
    expect(screen.getByText('CPU Threads')).toBeInTheDocument()
    expect(screen.getByText('RAM')).toBeInTheDocument()
    expect(screen.getByText('GPU / VRAM')).toBeInTheDocument()
    expect(screen.getByText('SSD / Storage')).toBeInTheDocument()
  })
})
