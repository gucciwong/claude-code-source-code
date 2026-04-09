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

test('renders "Downloading…" with spinner when status is downloading (button disabled)', () => {
  render(<ModelCard {...defaultProps} downloadStatus="downloading" />)
  const button = screen.getByRole('button', { name: /Downloading/ })
  expect(button).toBeDisabled()
  expect(screen.getByText('Downloading…')).toBeInTheDocument()
})

test('renders "Downloaded" when status is done', () => {
  render(<ModelCard {...defaultProps} downloadStatus="done" />)
  expect(screen.getByText('Downloaded')).toBeInTheDocument()
})

test('renders "Retry" button when status is error', () => {
  render(<ModelCard {...defaultProps} downloadStatus="error" />)
  expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument()
  expect(screen.getByText('Retry')).toBeInTheDocument()
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
