import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResearchProgramEditor } from './ResearchProgramEditor'
import { vi } from 'vitest'

const mockPresets = [
  {
    preset_id: 'preset-basic',
    name: 'Basic Training',
    description: 'Standard hyperparameters for quick iteration',
    config: {
      learning_rate: 0.001,
      batch_size: 32,
      epochs: 10,
      warmup_steps: 100,
    },
  },
  {
    preset_id: 'preset-aggressive',
    name: 'Aggressive Training',
    description: 'Higher learning rate for faster convergence',
    config: {
      learning_rate: 0.01,
      batch_size: 64,
      epochs: 20,
      warmup_steps: 500,
    },
  },
  {
    preset_id: 'preset-conservative',
    name: 'Conservative Training',
    description: 'Lower learning rate for stability',
    config: {
      learning_rate: 0.0001,
      batch_size: 16,
      epochs: 30,
      warmup_steps: 50,
    },
  },
]

describe('ResearchProgramEditor', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    presetsLoading: false,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render form with title', () => {
      render(<ResearchProgramEditor {...defaultProps} />)

      expect(screen.getByText('Create Research Program')).toBeInTheDocument()
    })

    it('should render all form fields', () => {
      render(<ResearchProgramEditor {...defaultProps} />)

      expect(screen.getByLabelText(/program name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/model/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/dataset/i)).toBeInTheDocument()
    })

    it('should render preset selector', () => {
      render(<ResearchProgramEditor {...defaultProps} />)

      expect(screen.getByText(/select preset/i)).toBeInTheDocument()
    })

    it('should render config editor with JSON view', () => {
      render(<ResearchProgramEditor {...defaultProps} />)

      expect(screen.getByText(/hyperparameters/i)).toBeInTheDocument()
      expect(screen.getByTestId('config-editor')).toBeInTheDocument()
    })

    it('should render submit and cancel buttons', () => {
      render(<ResearchProgramEditor {...defaultProps} />)

      expect(screen.getByRole('button', { name: /create program/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should show loading skeleton when presetsLoading is true', () => {
      render(<ResearchProgramEditor {...defaultProps} presetsLoading={true} />)

      expect(screen.getByTestId('preset-skeleton')).toBeInTheDocument()
    })
  })

  describe('Preset Loading', () => {
    it('should display available presets in dropdown', () => {
      render(<ResearchProgramEditor {...defaultProps} presets={mockPresets} />)

      const presetDropdown = screen.getByLabelText(/select preset/i)
      expect(presetDropdown).toBeInTheDocument()
    })

    it('should populate config from selected preset', async () => {
      const user = userEvent.setup()
      render(<ResearchProgramEditor {...defaultProps} presets={mockPresets} />)

      const presetSelect = screen.getByLabelText(/select preset/i)
      await user.selectOptions(presetSelect, 'preset-basic')

      await waitFor(() => {
        expect(screen.getByDisplayValue('0.001')).toBeInTheDocument() // learning_rate
      })
    })

    it('should show preset description', async () => {
      const user = userEvent.setup()
      render(<ResearchProgramEditor {...defaultProps} presets={mockPresets} />)

      const presetSelect = screen.getByLabelText(/select preset/i)
      await user.selectOptions(presetSelect, 'preset-aggressive')

      expect(screen.getByText(/faster convergence/i)).toBeInTheDocument()
    })

    it('should update description when preset changes', async () => {
      const user = userEvent.setup()
      render(<ResearchProgramEditor {...defaultProps} presets={mockPresets} />)

      const presetSelect = screen.getByLabelText(/select preset/i)

      await user.selectOptions(presetSelect, 'preset-basic')
      expect(screen.getByText(/quick iteration/i)).toBeInTheDocument()

      await user.selectOptions(presetSelect, 'preset-aggressive')
      expect(screen.getByText(/faster convergence/i)).toBeInTheDocument()
    })

    it('should allow manual config override after preset selection', async () => {
      const user = userEvent.setup()
      render(<ResearchProgramEditor {...defaultProps} presets={mockPresets} />)

      const presetSelect = screen.getByLabelText(/select preset/i)
      await user.selectOptions(presetSelect, 'preset-basic')

      await waitFor(() => {
        expect(screen.getByDisplayValue('0.001')).toBeInTheDocument()
      })

      const lrInput = screen.getByDisplayValue('0.001')
      await user.clear(lrInput)
      await user.type(lrInput, '0.005')

      await waitFor(() => {
        expect(screen.getByDisplayValue('0.005')).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('should require program name', async () => {
      const user = userEvent.setup()
      render(<ResearchProgramEditor {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /create program/i })
      await user.click(submitButton)

      expect(screen.getByText(/program name is required/i)).toBeInTheDocument()
    })

    it('should require model selection', async () => {
      const user = userEvent.setup()
      render(<ResearchProgramEditor {...defaultProps} />)

      const nameInput = screen.getByLabelText(/program name/i)
      await user.type(nameInput, 'Test Program')

      const submitButton = screen.getByRole('button', { name: /create program/i })
      await user.click(submitButton)

      expect(screen.getByText(/model is required/i)).toBeInTheDocument()
    })

    it('should require dataset selection', async () => {
      const user = userEvent.setup()
      render(<ResearchProgramEditor {...defaultProps} />)

      const nameInput = screen.getByLabelText(/program name/i)
      await user.type(nameInput, 'Test Program')

      const submitButton = screen.getByRole('button', { name: /create program/i })
      await user.click(submitButton)

      expect(screen.getByText(/dataset is required/i)).toBeInTheDocument()
    })

    it('should validate learning rate is positive', async () => {
      const user = userEvent.setup()
      render(<ResearchProgramEditor {...defaultProps} presets={mockPresets} />)

      const lrInput = screen.getByLabelText(/learning rate/i)
      await user.clear(lrInput)
      await user.type(lrInput, '0')

      const submitButton = screen.getByRole('button', { name: /create program/i })
      await user.click(submitButton)

      expect(screen.getByText(/learning rate must be positive/i)).toBeInTheDocument()
    })

    it('should validate batch size is positive integer', async () => {
      const user = userEvent.setup()
      render(<ResearchProgramEditor {...defaultProps} presets={mockPresets} />)

      const batchInput = screen.getByLabelText(/batch size/i)
      await user.clear(batchInput)
      await user.type(batchInput, '0')

      const submitButton = screen.getByRole('button', { name: /create program/i })
      await user.click(submitButton)

      expect(screen.getByText(/batch size must be at least 1/i)).toBeInTheDocument()
    })

    it('should validate JSON format in config editor', async () => {
      const user = userEvent.setup()
      render(<ResearchProgramEditor {...defaultProps} />)

      const configEditor = screen.getByTestId('config-editor')
      const textarea = configEditor.querySelector('textarea')!
      await user.clear(textarea)
      await user.type(textarea, 'not valid json text')

      const submitButton = screen.getByRole('button', { name: /create program/i })
      await user.click(submitButton)

      expect(screen.getByText(/invalid json/i)).toBeInTheDocument()
    })

    it('should clear error messages when corrected', async () => {
      const user = userEvent.setup()
      render(<ResearchProgramEditor {...defaultProps} />)

      const nameInput = screen.getByLabelText(/program name/i)
      await user.type(nameInput, 'x')
      await user.clear(nameInput)

      const submitButton = screen.getByRole('button', { name: /create program/i })
      await user.click(submitButton)

      expect(screen.getByText(/program name is required/i)).toBeInTheDocument()

      await user.type(nameInput, 'Valid Name')
      expect(screen.queryByText(/program name is required/i)).not.toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should call onSubmit with form data when submitted', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      render(<ResearchProgramEditor {...defaultProps} onSubmit={onSubmit} presets={mockPresets} />)

      const nameInput = screen.getByLabelText(/program name/i)
      await user.type(nameInput, 'My Research')

      const descInput = screen.getByLabelText(/description/i)
      await user.type(descInput, 'Testing research')

      const modelInput = screen.getByLabelText(/model/i)
      await user.selectOptions(modelInput, 'qwen-7b')

      const datasetInput = screen.getByLabelText(/dataset/i)
      await user.selectOptions(datasetInput, 'dataset-1')

      const presetSelect = screen.getByLabelText(/select preset/i)
      await user.selectOptions(presetSelect, 'preset-basic')

      const submitButton = screen.getByRole('button', { name: /create program/i })
      await user.click(submitButton)

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My Research',
          description: 'Testing research',
          model_id: 'qwen-7b',
          dataset_id: 'dataset-1',
          config: expect.objectContaining({
            learning_rate: 0.001,
            batch_size: 32,
          }),
        })
      )
    })

    it('should disable submit button while submitting', async () => {
      const user = userEvent.setup()
      let submitPromise: Promise<void>
      const onSubmit = vi.fn(() => {
        submitPromise = new Promise((resolve) => setTimeout(resolve, 1000))
        return submitPromise
      })

      render(<ResearchProgramEditor {...defaultProps} onSubmit={onSubmit} presets={mockPresets} />)

      const nameInput = screen.getByLabelText(/program name/i)
      await user.type(nameInput, 'My Research')

      const modelInput = screen.getByLabelText(/model/i)
      await user.selectOptions(modelInput, 'qwen-7b')

      const datasetInput = screen.getByLabelText(/dataset/i)
      await user.selectOptions(datasetInput, 'dataset-1')

      const submitButton = screen.getByRole('button', { name: /create program/i })
      await user.click(submitButton)

      expect(submitButton).toBeDisabled()
    })

    it('should call onClose when cancel is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<ResearchProgramEditor {...defaultProps} onClose={onClose} />)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Config Editor', () => {
    it('should display JSON config', () => {
      render(<ResearchProgramEditor {...defaultProps} presets={mockPresets} />)

      expect(screen.getByTestId('config-editor')).toBeInTheDocument()
    })

    it('should allow manual JSON editing', async () => {
      const user = userEvent.setup()
      render(<ResearchProgramEditor {...defaultProps} />)

      const configEditor = screen.getByTestId('config-editor')
      await user.click(configEditor)

      const textarea = configEditor.querySelector('textarea')
      expect(textarea).toBeInTheDocument()
    })

    it('should provide copy-to-clipboard for config', async () => {
      const user = userEvent.setup()
      const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText')

      render(<ResearchProgramEditor {...defaultProps} />)

      const copyButton = screen.getByRole('button', { name: /copy config/i })
      await user.click(copyButton)

      expect(clipboardSpy).toHaveBeenCalled()
    })

    it('should show validation error for invalid JSON', async () => {
      const user = userEvent.setup()
      render(<ResearchProgramEditor {...defaultProps} />)

      const configEditor = screen.getByTestId('config-editor')
      const textarea = configEditor.querySelector('textarea')

      if (textarea) {
        await user.clear(textarea)
        await user.type(textarea, 'not valid json text')

        await waitFor(() => {
          expect(screen.getByText(/invalid json/i)).toBeInTheDocument()
        })
      }
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<ResearchProgramEditor {...defaultProps} />)

      expect(screen.getByLabelText(/program name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/model/i)).toBeInTheDocument()
    })

    it('should have accessible form validation messages', async () => {
      const user = userEvent.setup()
      render(<ResearchProgramEditor {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /create program/i })
      await user.click(submitButton)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<ResearchProgramEditor {...defaultProps} />)

      const firstInput = screen.getByLabelText(/program name/i)
      firstInput.focus()
      expect(firstInput).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText(/description/i)).toHaveFocus()
    })

    it('should announce loading state', () => {
      render(<ResearchProgramEditor {...defaultProps} presetsLoading={true} />)

      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })
})
