import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModelCard } from './ModelCard'

const defaultProps = {
  id: 'meta-llama/Llama-3.1-8B-Instruct',
  name: 'Llama 3.1 8B Instruct',
  params: '8B',
  sizeLabel: '4.9 GB',
  arch: 'llama',
  format: 'GGUF',
  description: 'Test description for the model',
  downloadStatus: 'idle' as const,
  onPickFiles: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('renders model name, params, arch, format', () => {
  render(<ModelCard {...defaultProps} />)
  expect(screen.getByText('Llama 3.1 8B Instruct')).toBeInTheDocument()
  expect(screen.getByText('8B')).toBeInTheDocument()
  expect(screen.getByText('4.9 GB')).toBeInTheDocument()
  expect(screen.getByText('llama')).toBeInTheDocument()
  expect(screen.getByText('GGUF')).toBeInTheDocument()
})

test('renders "Download" button when status is idle', () => {
  render(<ModelCard {...defaultProps} downloadStatus="idle" />)
  expect(screen.getByRole('button', { name: /Download/ })).toBeInTheDocument()
  expect(screen.getByText('Download')).toBeInTheDocument()
})

test('renders "Downloading" status chip when status is downloading', () => {
  render(<ModelCard {...defaultProps} downloadStatus="downloading" />)
  // The chip carries role="status" — the button-with-spinner from
  // pre-W4-b is gone; downloading state is now expressed as a chip
  // in the footer plus an inline progressbar at the top of the card.
  const chip = screen.getByRole('status', { name: /Downloading/i })
  expect(chip).toBeInTheDocument()
  // No download button while in flight.
  expect(screen.queryByRole('button', { name: /^Download$/i })).not.toBeInTheDocument()
})

test('shows inline progressbar with percentage when progressPct is set', () => {
  render(<ModelCard {...defaultProps} downloadStatus="downloading" progressPct={47.3} />)
  const bar = screen.getByRole('progressbar', { name: /Downloading Llama 3.1 8B Instruct/i })
  expect(bar).toHaveAttribute('aria-valuenow', '47')
  // Percentage label appears in mono next to the bar AND inside the chip.
  expect(screen.getAllByText(/47%/).length).toBeGreaterThan(0)
})

test('progressbar is indeterminate when progressPct is undefined', () => {
  render(<ModelCard {...defaultProps} downloadStatus="downloading" />)
  const bar = screen.getByRole('progressbar')
  expect(bar).not.toHaveAttribute('aria-valuenow')
})

test('renders "Downloaded" chip when status is done', () => {
  render(<ModelCard {...defaultProps} downloadStatus="done" />)
  expect(screen.getByRole('status', { name: /Downloaded/i })).toBeInTheDocument()
})

test('renders "Queued" chip when status is pending', () => {
  render(<ModelCard {...defaultProps} downloadStatus="pending" />)
  expect(screen.getByRole('status', { name: /Queued/i })).toBeInTheDocument()
})

test('renders "Retry" button when status is error', () => {
  render(<ModelCard {...defaultProps} downloadStatus="error" />)
  expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument()
  expect(screen.getByText('Retry')).toBeInTheDocument()
})

test('error status renders BOTH the Error chip and the Retry button', () => {
  render(<ModelCard {...defaultProps} downloadStatus="error" />)
  expect(screen.getByRole('status', { name: /Error/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument()
})

test('calls onDownload with correct model ID when Download button clicked', async () => {
  const user = userEvent.setup()
  const onPickFiles = vi.fn()
  render(<ModelCard {...defaultProps} downloadStatus="idle" onPickFiles={onPickFiles} />)
  await user.click(screen.getByRole('button', { name: /Download/ }))
  expect(onPickFiles).toHaveBeenCalledWith('meta-llama/Llama-3.1-8B-Instruct')
})

test('calls onDownload when Retry button clicked', async () => {
  const user = userEvent.setup()
  const onPickFiles = vi.fn()
  render(<ModelCard {...defaultProps} downloadStatus="error" onPickFiles={onPickFiles} />)
  await user.click(screen.getByRole('button', { name: /Retry/ }))
  expect(onPickFiles).toHaveBeenCalledWith('meta-llama/Llama-3.1-8B-Instruct')
})
