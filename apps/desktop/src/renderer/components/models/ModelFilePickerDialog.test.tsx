import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModelFilePickerDialog, ModelFile } from './ModelFilePickerDialog'

const mockFiles: ModelFile[] = [
  { path: 'model.Q4_K_M.gguf', size_bytes: 4_000_000_000, is_gguf: true },
  { path: 'model.Q8_0.gguf', size_bytes: 7_500_000_000, is_gguf: true },
  { path: 'README.md', size_bytes: 1024, is_gguf: false },
]

function makeProps(overrides?: {
  onFetchFiles?: (modelId: string) => Promise<ModelFile[] | null>
  onConfirm?: (modelId: string, filePath: string) => void
  onClose?: () => void
}) {
  return {
    modelId: 'user/test-repo',
    onFetchFiles: vi.fn().mockResolvedValue(mockFiles),
    onConfirm: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  }
}

test('shows loading spinner while onFetchFiles is pending', async () => {
  let resolve: (v: ModelFile[]) => void
  const onFetchFiles = vi.fn().mockReturnValue(new Promise<ModelFile[]>(r => { resolve = r }))
  render(<ModelFilePickerDialog {...makeProps({ onFetchFiles })} />)
  expect(screen.getByText(/Loading file list for/i)).toBeInTheDocument()
  await act(async () => { resolve!(mockFiles) })
})

test('renders file list after loading completes', async () => {
  render(<ModelFilePickerDialog {...makeProps()} />)
  expect(await screen.findByText('model.Q4_K_M.gguf')).toBeInTheDocument()
  expect(screen.getByText('model.Q8_0.gguf')).toBeInTheDocument()
  expect(screen.getByText('README.md')).toBeInTheDocument()
})

test('shows file sizes after loading', async () => {
  render(<ModelFilePickerDialog {...makeProps()} />)
  expect(await screen.findByText('3.7 GB')).toBeInTheDocument()
  expect(screen.getByText('7.0 GB')).toBeInTheDocument()
  expect(screen.getByText('1 KB')).toBeInTheDocument()
})

test('pre-selects the first GGUF file', async () => {
  render(<ModelFilePickerDialog {...makeProps()} />)
  await screen.findByText('model.Q4_K_M.gguf')
  const firstOption = screen.getByRole('option', { name: /model\.Q4_K_M\.gguf/i })
  expect(firstOption).toHaveAttribute('aria-selected', 'true')
})

test('filter input narrows the displayed file list', async () => {
  const user = userEvent.setup()
  render(<ModelFilePickerDialog {...makeProps()} />)
  await screen.findByText('model.Q4_K_M.gguf')

  await user.type(screen.getByPlaceholderText('Filter files…'), 'Q8')
  expect(screen.getByText('model.Q8_0.gguf')).toBeInTheDocument()
  expect(screen.queryByText('model.Q4_K_M.gguf')).not.toBeInTheDocument()
  expect(screen.queryByText('README.md')).not.toBeInTheDocument()
})

test('Download button is enabled when a file is selected', async () => {
  render(<ModelFilePickerDialog {...makeProps()} />)
  await screen.findByText('model.Q4_K_M.gguf')
  const downloadBtn = screen.getAllByRole('button', { name: /Download/i }).find(
    b => !b.hasAttribute('aria-label'),
  )!
  expect(downloadBtn).not.toBeDisabled()
})

test('clicking Download calls onConfirm with correct modelId and filePath', async () => {
  const user = userEvent.setup()
  const onConfirm = vi.fn()
  render(<ModelFilePickerDialog {...makeProps({ onConfirm })} />)
  await screen.findByText('model.Q4_K_M.gguf')

  const downloadBtn = screen.getAllByRole('button', { name: /Download/i }).find(
    b => !b.hasAttribute('aria-label'),
  )!
  await user.click(downloadBtn)
  expect(onConfirm).toHaveBeenCalledWith('user/test-repo', 'model.Q4_K_M.gguf')
})

test('close button (×) calls onClose', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(<ModelFilePickerDialog {...makeProps({ onClose })} />)
  await screen.findByText('model.Q4_K_M.gguf')

  await user.click(screen.getByRole('button', { name: /Close/i }))
  expect(onClose).toHaveBeenCalledTimes(1)
})

test('Cancel button calls onClose', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(<ModelFilePickerDialog {...makeProps({ onClose })} />)
  await screen.findByText('model.Q4_K_M.gguf')

  await user.click(screen.getByRole('button', { name: /Cancel/i }))
  expect(onClose).toHaveBeenCalledTimes(1)
})

test('clicking the backdrop calls onClose', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(<ModelFilePickerDialog {...makeProps({ onClose })} />)
  await screen.findByText('model.Q4_K_M.gguf')

  const backdrop = screen.getByRole('dialog')
  await user.click(backdrop)
  expect(onClose).toHaveBeenCalledTimes(1)
})

test('shows error state when onFetchFiles returns null', async () => {
  const onFetchFiles = vi.fn().mockResolvedValue(null)
  render(<ModelFilePickerDialog {...makeProps({ onFetchFiles })} />)
  expect(
    await screen.findByText(/Could not fetch file list/i),
  ).toBeInTheDocument()
})

test('selecting a different file updates the selection', async () => {
  const user = userEvent.setup()
  render(<ModelFilePickerDialog {...makeProps()} />)
  await screen.findByText('model.Q4_K_M.gguf')

  // Click Q8 file
  await user.click(screen.getByRole('option', { name: /model\.Q8_0\.gguf/i }))
  expect(screen.getByRole('option', { name: /model\.Q8_0\.gguf/i })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('option', { name: /model\.Q4_K_M\.gguf/i })).toHaveAttribute('aria-selected', 'false')
})
