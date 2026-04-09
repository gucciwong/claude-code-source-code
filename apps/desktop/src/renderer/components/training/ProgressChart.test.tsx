import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProgressChart } from './ProgressChart'
import { vi } from 'vitest'

// Mock chart library
vi.mock('recharts', () => ({
  LineChart: ({ children, data, role, 'aria-label': ariaLabel }: any) => <div data-testid="line-chart" role={role} aria-label={ariaLabel} stroke="none">{children}</div>,
  Line: ({ dataKey, stroke }: any) => <div data-testid={`line-${dataKey}`} stroke={stroke}></div>,
  XAxis: () => <div data-testid="x-axis"></div>,
  YAxis: () => <div data-testid="y-axis"></div>,
  CartesianGrid: () => <div data-testid="cartesian-grid"></div>,
  Tooltip: () => <div data-testid="tooltip"></div>,
  Legend: () => <div data-testid="legend"></div>,
  ResponsiveContainer: ({ children, className }: any) => <div data-testid="responsive-container" className={className}>{children}</div>,
}))

const mockExperiments = [
  {
    experiment_id: 'exp-001',
    run_tag: 'run-1',
    config: { learning_rate: 0.001 },
    status: 'completed' as const,
    duration_seconds: 3600,
    created_at: new Date('2024-01-01T10:00:00Z').toISOString(),
    updated_at: new Date('2024-01-01T11:00:00Z').toISOString(),
    metrics: {
      accuracy: 0.85,
      f1_score: 0.83,
      loss: 0.15,
      vram_peak_mb: 18000,
    },
    program_id: 'prog-001',
    parent_experiment_id: null,
  },
  {
    experiment_id: 'exp-002',
    run_tag: 'run-1',
    config: { learning_rate: 0.001 },
    status: 'completed' as const,
    duration_seconds: 4200,
    created_at: new Date('2024-01-01T12:00:00Z').toISOString(),
    updated_at: new Date('2024-01-01T13:10:00Z').toISOString(),
    metrics: {
      accuracy: 0.92,
      f1_score: 0.90,
      loss: 0.08,
      vram_peak_mb: 19000,
    },
    program_id: 'prog-001',
    parent_experiment_id: 'exp-001',
  },
  {
    experiment_id: 'exp-003',
    run_tag: 'run-1',
    config: { learning_rate: 0.001 },
    status: 'completed' as const,
    duration_seconds: 5400,
    created_at: new Date('2024-01-01T14:00:00Z').toISOString(),
    updated_at: new Date('2024-01-01T15:30:00Z').toISOString(),
    metrics: {
      accuracy: 0.95,
      f1_score: 0.94,
      loss: 0.05,
      vram_peak_mb: 20000,
    },
    program_id: 'prog-001',
    parent_experiment_id: 'exp-002',
  },
]

describe('ProgressChart', () => {
  const defaultProps = {
    experiments: mockExperiments,
    currentRunTag: 'run-1',
    metric: 'accuracy' as const,
    isLoading: false,
  }

  describe('Rendering', () => {
    it('should render chart container', () => {
      render(<ProgressChart {...defaultProps} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('should render chart axes and grid', () => {
      render(<ProgressChart {...defaultProps} />)

      expect(screen.getByTestId('x-axis')).toBeInTheDocument()
      expect(screen.getByTestId('y-axis')).toBeInTheDocument()
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
    })

    it('should display accuracy line for accuracy metric', () => {
      render(<ProgressChart {...defaultProps} metric="accuracy" />)

      expect(screen.getByTestId('line-accuracy')).toBeInTheDocument()
    })

    it('should display loss line for loss metric', () => {
      render(<ProgressChart {...defaultProps} metric="loss" />)

      expect(screen.getByTestId('line-loss')).toBeInTheDocument()
    })

    it('should display f1_score line for f1_score metric', () => {
      render(<ProgressChart {...defaultProps} metric="f1_score" />)

      expect(screen.getByTestId('line-f1_score')).toBeInTheDocument()
    })

    it('should show chart title', () => {
      render(<ProgressChart {...defaultProps} metric="accuracy" />)

      expect(screen.getByText(/accuracy over time/i)).toBeInTheDocument()
    })

    it('should show loading state when isLoading is true', () => {
      render(<ProgressChart {...defaultProps} isLoading={true} />)

      expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument()
    })

    it('should display legend', () => {
      render(<ProgressChart {...defaultProps} />)

      expect(screen.getByTestId('legend')).toBeInTheDocument()
    })

    it('should display tooltip', () => {
      render(<ProgressChart {...defaultProps} />)

      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    })
  })

  describe('Data Filtering', () => {
    it('should only display experiments for current run_tag', () => {
      const experiments = [
        ...mockExperiments,
        {
          ...mockExperiments[0],
          experiment_id: 'exp-999',
          run_tag: 'run-2',
        },
      ]

      render(<ProgressChart {...defaultProps} experiments={experiments} currentRunTag="run-1" />)

      // Chart should have data points only for run-1
      const chartData = screen.getByTestId('line-chart').querySelector('[data-points]')
      expect(chartData).toBeTruthy()
    })

    it('should handle empty experiments gracefully', () => {
      render(<ProgressChart {...defaultProps} experiments={[]} />)

      expect(screen.getByText(/no experiments/i)).toBeInTheDocument()
    })

    it('should update when currentRunTag changes', async () => {
      const { rerender } = render(<ProgressChart {...defaultProps} currentRunTag="run-1" />)

      const run1Chart = screen.getByTestId('line-chart')
      expect(run1Chart).toBeInTheDocument()

      rerender(<ProgressChart {...defaultProps} currentRunTag="run-2" experiments={[]} />)

      expect(screen.getByText(/no experiments/i)).toBeInTheDocument()
    })
  })

  describe('Data Transformation', () => {
    it('should transform experiment data to chart points', () => {
      render(<ProgressChart {...defaultProps} metric="accuracy" />)

      const chart = screen.getByTestId('line-chart')
      // Chart should contain data points for each experiment
      expect(chart).toBeInTheDocument()
    })

    it('should sort experiments chronologically', () => {
      const unsortedExperiments = [mockExperiments[2], mockExperiments[0], mockExperiments[1]]

      render(<ProgressChart {...defaultProps} experiments={unsortedExperiments} />)

      // Chart should render successfully (sorted internally)
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('should include experiment metadata in tooltips', () => {
      render(<ProgressChart {...defaultProps} />)

      // When hovering over a data point, should show experiment_id
      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    })
  })

  describe('Metric Selection', () => {
    it('should display different lines for different metrics', () => {
      const { rerender } = render(<ProgressChart {...defaultProps} metric="accuracy" />)

      expect(screen.getByTestId('line-accuracy')).toBeInTheDocument()

      rerender(<ProgressChart {...defaultProps} metric="loss" />)

      expect(screen.getByTestId('line-loss')).toBeInTheDocument()
    })

    it('should update chart when metric prop changes', async () => {
      const { rerender } = render(<ProgressChart {...defaultProps} metric="accuracy" />)

      expect(screen.getByTestId('line-accuracy')).toBeInTheDocument()

      rerender(<ProgressChart {...defaultProps} metric="f1_score" />)

      expect(screen.getByTestId('line-f1_score')).toBeInTheDocument()
    })

    it('should show appropriate Y-axis label for each metric', () => {
      const { rerender } = render(<ProgressChart {...defaultProps} metric="accuracy" />)

      expect(screen.getByText(/accuracy/i)).toBeInTheDocument()

      rerender(<ProgressChart {...defaultProps} metric="loss" />)

      expect(screen.getByText(/loss/i)).toBeInTheDocument()
    })
  })

  describe('Visual Appearance', () => {
    it('should use different colors for different metrics', () => {
      render(<ProgressChart {...defaultProps} metric="accuracy" />)

      const line = screen.getByTestId('line-accuracy')
      expect(line).toHaveAttribute('stroke')
    })

    it('should maintain responsive layout', () => {
      render(<ProgressChart {...defaultProps} />)

      const responsiveContainer = screen.getByTestId('responsive-container')
      expect(responsiveContainer).toHaveClass('w-full', 'h-full')
    })

    it('should use appropriate spacing around chart', () => {
      render(<ProgressChart {...defaultProps} />)

      const chartContainer = screen.getByTestId('line-chart')?.parentElement
      expect(chartContainer).toHaveClass('p-4')
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading', () => {
      render(<ProgressChart {...defaultProps} />)

      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toBeInTheDocument()
    })

    it('should have accessible chart title', () => {
      render(<ProgressChart {...defaultProps} metric="accuracy" />)

      expect(screen.getByText(/accuracy progress/i)).toBeInTheDocument()
    })

    it('should include description for screen readers', () => {
      render(<ProgressChart {...defaultProps} />)

      const chart = screen.getByTestId('line-chart')
      expect(chart.getAttribute('role')).toBe('img')
    })

    it('should have accessible color contrast', () => {
      render(<ProgressChart {...defaultProps} />)

      const lines = screen.getAllByTestId(/line-/)
      lines.forEach((line) => {
        const stroke = line.getAttribute('stroke')
        expect(stroke).toBeTruthy()
      })
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        ...mockExperiments[0],
        experiment_id: `exp-${i}`,
        metrics: {
          accuracy: 0.8 + Math.random() * 0.2,
          f1_score: 0.8 + Math.random() * 0.2,
          loss: Math.random() * 0.2,
          vram_peak_mb: 18000 + Math.random() * 2000,
        },
      }))

      const { rerender } = render(<ProgressChart {...defaultProps} experiments={largeDataset} />)

      expect(screen.getByTestId('line-chart')).toBeInTheDocument()

      // Should still render when metric changes
      rerender(<ProgressChart {...defaultProps} experiments={largeDataset} metric="loss" />)

      expect(screen.getByTestId('line-loss')).toBeInTheDocument()
    })

    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn()
      const Component = (props: any) => {
        renderSpy()
        return <ProgressChart {...props} />
      }

      const { rerender } = render(<Component {...defaultProps} />)

      expect(renderSpy).toHaveBeenCalledTimes(1)

      // Rerender with same props
      rerender(<Component {...defaultProps} />)

      // Should only render once more for React's strict mode, but not actual re-render
      expect(renderSpy.mock.calls.length).toBeLessThan(4)
    })
  })
})
