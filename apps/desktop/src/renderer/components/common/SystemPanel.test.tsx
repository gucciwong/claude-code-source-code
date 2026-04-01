import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SystemPanel } from './SystemPanel'
import { useSystemStore } from '../../store/systemStore'

describe('SystemPanel', () => {
  beforeEach(() => {
    useSystemStore.setState({
      gpuTemp: 65,
      vramUsed: 12,
      vramTotal: 24,
      tokensPerSec: 45,
      activeModel: 'llama3.1:8b',
    })
  })

  it('renders system panel header', () => {
    render(<SystemPanel />)
    expect(screen.getByText('System Information')).toBeInTheDocument()
  })

  it('renders health and benchmark tabs', () => {
    render(<SystemPanel />)
    expect(screen.getByRole('tab', { name: 'Health' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Benchmark' })).toBeInTheDocument()
  })

  it('shows health tab content by default', () => {
    render(<SystemPanel />)
    expect(screen.getByText('System Health')).toBeInTheDocument()
  })

  it('hides benchmark content by default', () => {
    render(<SystemPanel />)
    expect(screen.queryByText('Performance Benchmark')).not.toBeInTheDocument()
  })

  it('switches to benchmark tab when clicked', async () => {
    const user = userEvent.setup()
    render(<SystemPanel />)

    const benchmarkTab = screen.getByRole('tab', { name: 'Benchmark' })
    await user.click(benchmarkTab)

    expect(screen.getByText('Performance Benchmark')).toBeInTheDocument()
    expect(screen.queryByText('System Health')).not.toBeInTheDocument()
  })

  it('switches back to health tab', async () => {
    const user = userEvent.setup()
    render(<SystemPanel />)

    const benchmarkTab = screen.getByRole('tab', { name: 'Benchmark' })
    await user.click(benchmarkTab)
    expect(screen.getByText('Performance Benchmark')).toBeInTheDocument()

    const healthTab = screen.getByRole('tab', { name: 'Health' })
    await user.click(healthTab)
    expect(screen.getByText('System Health')).toBeInTheDocument()
  })

  it('marks active tab with aria-selected', async () => {
    const user = userEvent.setup()
    render(<SystemPanel />)

    const healthTab = screen.getByRole('tab', { name: 'Health' })
    const benchmarkTab = screen.getByRole('tab', { name: 'Benchmark' })

    expect(healthTab).toHaveAttribute('aria-selected', 'true')
    expect(benchmarkTab).toHaveAttribute('aria-selected', 'false')

    await user.click(benchmarkTab)

    expect(healthTab).toHaveAttribute('aria-selected', 'false')
    expect(benchmarkTab).toHaveAttribute('aria-selected', 'true')
  })

  it('has toggle button for expand/collapse', () => {
    render(<SystemPanel />)
    const toggleButton = screen.getByRole('button', { name: /system panel/i })
    expect(toggleButton).toBeInTheDocument()
  })

  it('collapses panel when toggle clicked', async () => {
    const user = userEvent.setup()
    render(<SystemPanel />)

    expect(screen.getByText('System Health')).toBeInTheDocument()

    const toggleButton = screen.getByRole('button', { name: /system panel/i })
    await user.click(toggleButton)

    expect(screen.queryByText('System Health')).not.toBeInTheDocument()
  })

  it('expands panel back when toggle clicked again', async () => {
    const user = userEvent.setup()
    render(<SystemPanel />)

    const toggleButton = screen.getByRole('button', { name: /system panel/i })
    await user.click(toggleButton)
    expect(screen.queryByText('System Health')).not.toBeInTheDocument()

    await user.click(toggleButton)
    expect(screen.getByText('System Health')).toBeInTheDocument()
  })

  it('updates aria-expanded on toggle', async () => {
    const user = userEvent.setup()
    render(<SystemPanel />)

    const toggleButton = screen.getByRole('button', { name: /system panel/i })
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

    await user.click(toggleButton)
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggleButton)
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
  })

  it('displays health metrics when health tab active', () => {
    render(<SystemPanel />)
    expect(screen.getByText('GPU Temperature')).toBeInTheDocument()
    expect(screen.getByText('VRAM Usage')).toBeInTheDocument()
  })

  it('displays benchmark results when benchmark tab active', async () => {
    const user = userEvent.setup()
    render(<SystemPanel />)

    const benchmarkTab = screen.getByRole('tab', { name: 'Benchmark' })
    await user.click(benchmarkTab)

    expect(screen.getByText('Inference Speed')).toBeInTheDocument()
    expect(screen.getByText('Memory Efficiency')).toBeInTheDocument()
  })

  it('uses correct tabpanel roles', () => {
    render(<SystemPanel />)
    const tabpanel = screen.getByRole('tabpanel', { name: 'Health' })
    expect(tabpanel).toBeInTheDocument()
  })

  it('maintains tab selection when panel collapses and expands', async () => {
    const user = userEvent.setup()
    render(<SystemPanel />)

    const benchmarkTab = screen.getByRole('tab', { name: 'Benchmark' })
    await user.click(benchmarkTab)

    const toggleButton = screen.getByRole('button', { name: /system panel/i })
    await user.click(toggleButton)
    await user.click(toggleButton)

    expect(screen.getByRole('tabpanel', { name: 'Benchmark' })).toBeInTheDocument()
  })

  it('has accessible header structure', () => {
    render(<SystemPanel />)
    expect(screen.getByText('System Information')).toBeInTheDocument()
  })
})
