import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExperimentTable } from './ExperimentTable'
import { vi } from 'vitest'

// Mock experiment data
const mockExperiments = [
  {
    experiment_id: 'exp-001',
    program_id: 'prog-001',
    run_tag: 'run-1',
    config: { learning_rate: 0.001, batch_size: 32 },
    status: 'completed' as const,
    duration_seconds: 3600,
    created_at: new Date('2024-01-01T10:00:00Z').toISOString(),
    updated_at: new Date('2024-01-01T11:00:00Z').toISOString(),
    metrics: {
      accuracy: 0.95,
      f1_score: 0.93,
      loss: 0.05,
      vram_peak_mb: 18000,
    },
    parent_experiment_id: null,
  },
  {
    experiment_id: 'exp-002',
    program_id: 'prog-001',
    run_tag: 'run-1',
    config: { learning_rate: 0.0005, batch_size: 64 },
    status: 'completed' as const,
    duration_seconds: 4200,
    created_at: new Date('2024-01-01T12:00:00Z').toISOString(),
    updated_at: new Date('2024-01-01T13:10:00Z').toISOString(),
    metrics: {
      accuracy: 0.96,
      f1_score: 0.94,
      loss: 0.04,
      vram_peak_mb: 19000,
    },
    parent_experiment_id: 'exp-001',
  },
  {
    experiment_id: 'exp-003',
    program_id: 'prog-001',
    run_tag: 'run-2',
    config: { learning_rate: 0.001, batch_size: 128 },
    status: 'running' as const,
    duration_seconds: 1800,
    created_at: new Date('2024-01-02T10:00:00Z').toISOString(),
    updated_at: new Date('2024-01-02T10:30:00Z').toISOString(),
    metrics: {
      accuracy: 0.92,
      f1_score: 0.90,
      loss: 0.08,
      vram_peak_mb: 20000,
    },
    parent_experiment_id: null,
  },
]

describe('ExperimentTable', () => {
  const defaultProps = {
    experiments: mockExperiments,
    currentRunTag: 'run-1',
    onSelectExperiment: vi.fn(),
    isLoading: false,
  }

  describe('Rendering', () => {
    it('should render table headers', () => {
      render(<ExperimentTable {...defaultProps} />)

      expect(screen.getByText('Experiment ID')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Duration')).toBeInTheDocument()
      expect(screen.getByText('Accuracy')).toBeInTheDocument()
      expect(screen.getByText('Loss')).toBeInTheDocument()
      expect(screen.getByText('VRAM')).toBeInTheDocument()
    })

    it('should render all experiments for current run_tag', () => {
      render(<ExperimentTable {...defaultProps} />)

      // Should show exp-001 and exp-002 (run-1)
      expect(screen.getByText('exp-001')).toBeInTheDocument()
      expect(screen.getByText('exp-002')).toBeInTheDocument()
      // Should NOT show exp-003 (run-2)
      expect(screen.queryByText('exp-003')).not.toBeInTheDocument()
    })

    it('should show loading skeleton when isLoading is true', () => {
      render(<ExperimentTable {...defaultProps} isLoading={true} />)

      const skeletons = screen.getAllByTestId('skeleton-row')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should display status badge with correct styling', () => {
      render(<ExperimentTable {...defaultProps} />)

      const completedBadge = screen.getByText('completed')
      expect(completedBadge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('should format duration in hh:mm:ss format', () => {
      render(<ExperimentTable {...defaultProps} />)

      // exp-001: 3600 seconds = 01:00:00
      expect(screen.getByText('01:00:00')).toBeInTheDocument()
      // exp-002: 4200 seconds = 01:10:00
      expect(screen.getByText('01:10:00')).toBeInTheDocument()
    })

    it('should format metrics with appropriate precision', () => {
      render(<ExperimentTable {...defaultProps} />)

      // Accuracy should show as 0.95 or 95%
      expect(screen.getByText(/95/)).toBeInTheDocument()
      // Loss should show as 0.05
      expect(screen.getByText('0.05')).toBeInTheDocument()
    })

    it('should show VRAM in GB format', () => {
      render(<ExperimentTable {...defaultProps} />)

      // 18000 MB = 17.6 GB
      expect(screen.getByText('17.6 GB')).toBeInTheDocument()
    })
  })

  describe('Filtering', () => {
    it('should only show experiments matching currentRunTag', () => {
      const { rerender } = render(<ExperimentTable {...defaultProps} currentRunTag="run-1" />)

      expect(screen.getByText('exp-001')).toBeInTheDocument()
      expect(screen.getByText('exp-002')).toBeInTheDocument()
      expect(screen.queryByText('exp-003')).not.toBeInTheDocument()

      // Switch to run-2
      rerender(<ExperimentTable {...defaultProps} currentRunTag="run-2" />)

      expect(screen.queryByText('exp-001')).not.toBeInTheDocument()
      expect(screen.queryByText('exp-002')).not.toBeInTheDocument()
      expect(screen.getByText('exp-003')).toBeInTheDocument()
    })

    it('should show empty state when no experiments match filter', () => {
      render(<ExperimentTable {...defaultProps} currentRunTag="run-99" experiments={mockExperiments} />)

      expect(screen.getByText(/no experiments/i)).toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('should sort by accuracy descending when accuracy column is clicked', async () => {
      const user = userEvent.setup()
      render(<ExperimentTable {...defaultProps} />)

      const accuracyHeader = screen.getByText('Accuracy')
      await user.click(accuracyHeader)

      const rows = screen.getAllByTestId('experiment-row')
      const accuracies = rows.map((row) => parseFloat(row.textContent || '0'))

      // Check descending order
      for (let i = 0; i < accuracies.length - 1; i++) {
        expect(accuracies[i]).toBeGreaterThanOrEqual(accuracies[i + 1])
      }
    })

    it('should toggle sort direction on subsequent clicks', async () => {
      const user = userEvent.setup()
      render(<ExperimentTable {...defaultProps} />)

      const accuracyHeader = screen.getByText('Accuracy')

      // First click - descending
      await user.click(accuracyHeader)
      let rows = screen.getAllByTestId('experiment-row')
      const firstOrder = rows.map((row) => row.textContent)

      // Second click - ascending
      await user.click(accuracyHeader)
      rows = screen.getAllByTestId('experiment-row')
      const secondOrder = rows.map((row) => row.textContent)

      expect(firstOrder).not.toEqual(secondOrder)
    })

    it('should sort by duration when duration column is clicked', async () => {
      const user = userEvent.setup()
      render(<ExperimentTable {...defaultProps} />)

      const durationHeader = screen.getByText('Duration')
      await user.click(durationHeader)

      expect(screen.getByTestId('sort-indicator-duration')).toHaveAttribute('data-direction', 'desc')
    })

    it('should display sort indicator on active column', async () => {
      const user = userEvent.setup()
      render(<ExperimentTable {...defaultProps} />)

      const lossHeader = screen.getByText('Loss')
      await user.click(lossHeader)

      const indicator = screen.getByTestId('sort-indicator-loss')
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveAttribute('data-direction', 'desc')
    })
  })

  describe('Pagination', () => {
    it('should paginate results when more than 10 experiments', () => {
      const manyExperiments = Array.from({ length: 25 }, (_, i) => ({
        ...mockExperiments[0],
        experiment_id: `exp-${String(i).padStart(3, '0')}`,
        run_tag: 'run-1',
      }))

      render(<ExperimentTable {...defaultProps} experiments={manyExperiments} />)

      // Should show first 10
      expect(screen.getByText('exp-000')).toBeInTheDocument()
      expect(screen.queryByText('exp-010')).not.toBeInTheDocument()

      // Should show pagination controls
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    })

    it('should navigate to next page when next button clicked', async () => {
      const user = userEvent.setup()
      const manyExperiments = Array.from({ length: 25 }, (_, i) => ({
        ...mockExperiments[0],
        experiment_id: `exp-${String(i).padStart(3, '0')}`,
        run_tag: 'run-1',
      }))

      render(<ExperimentTable {...defaultProps} experiments={manyExperiments} />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      expect(screen.queryByText('exp-000')).not.toBeInTheDocument()
      expect(screen.getByText('exp-010')).toBeInTheDocument()
    })

    it('should disable prev button on first page', () => {
      render(<ExperimentTable {...defaultProps} />)

      const prevButton = screen.getByRole('button', { name: /previous/i })
      expect(prevButton).toBeDisabled()
    })

    it('should disable next button on last page', async () => {
      const user = userEvent.setup()
      render(<ExperimentTable {...defaultProps} />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
    })
  })

  describe('Row Selection', () => {
    it('should call onSelectExperiment when row is clicked', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(<ExperimentTable {...defaultProps} onSelectExperiment={onSelect} />)

      const firstRow = screen.getByTestId('experiment-row-0')
      await user.click(firstRow)

      expect(onSelect).toHaveBeenCalledWith(mockExperiments[0])
    })

    it('should highlight selected row', async () => {
      const user = userEvent.setup()
      render(<ExperimentTable {...defaultProps} />)

      const firstRow = screen.getByTestId('experiment-row-0')
      await user.click(firstRow)

      expect(firstRow).toHaveClass('bg-blue-50')
    })

    it('should deselect row when clicking selected row again', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(<ExperimentTable {...defaultProps} onSelectExperiment={onSelect} />)

      const firstRow = screen.getByTestId('experiment-row-0')
      await user.click(firstRow)
      expect(firstRow).toHaveClass('bg-blue-50')

      await user.click(firstRow)
      expect(onSelect).toHaveBeenCalledWith(null)
    })
  })

  describe('Accessibility', () => {
    it('should have proper table semantics', () => {
      render(<ExperimentTable {...defaultProps} />)

      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })

    it('should have column headers with proper scope', () => {
      render(<ExperimentTable {...defaultProps} />)

      const headers = screen.getAllByRole('columnheader')
      expect(headers.length).toBeGreaterThan(0)
    })

    it('should have sortable columns announced', () => {
      render(<ExperimentTable {...defaultProps} />)

      const sortableHeaders = screen.getAllByRole('button', { name: /sort/i })
      expect(sortableHeaders.length).toBeGreaterThan(0)
    })

    it('should have proper ARIA labels for status badges', () => {
      render(<ExperimentTable {...defaultProps} />)

      const statusBadges = screen.getAllByRole('status')
      expect(statusBadges.length).toBeGreaterThan(0)
    })
  })
})
