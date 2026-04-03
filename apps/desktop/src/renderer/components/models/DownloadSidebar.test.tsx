import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DownloadSidebar } from './DownloadSidebar'
import { DownloadQueueEntry } from '../../hooks/useModelManager'

const activeDownload: DownloadQueueEntry = {
  status: 'downloading',
  progress: 42,
  total_size_gb: 4.5,
  downloaded_gb: 1.9,
  model_name: 'Llama 3.1 8B',
  started_at: Date.now() / 1000 - 10,
}

const errorDownload: DownloadQueueEntry = {
  status: 'error',
  progress: 12,
  total_size_gb: 4.5,
  downloaded_gb: 0.5,
  model_name: 'Mistral 7B',
  started_at: Date.now() / 1000 - 60,
  error: 'Connection timeout',
}

test('renders null when downloads object is empty', () => {
  const { container } = render(<DownloadSidebar downloads={{}} onCancel={vi.fn()} />)
  expect(container.firstChild).toBeNull()
})

test('renders active download entry with model name and progress bar', () => {
  render(
    <DownloadSidebar
      downloads={{ 'meta-llama/llama-3.1-8b': activeDownload }}
      onCancel={vi.fn()}
    />
  )
  expect(screen.getByText('Llama 3.1 8B')).toBeInTheDocument()
  expect(
    screen.getByRole('progressbar', { name: /Llama 3.1 8B download progress/ })
  ).toBeInTheDocument()
})

test('renders error entry with model name and error message', () => {
  render(
    <DownloadSidebar
      downloads={{ 'mistral/7b': errorDownload }}
      onCancel={vi.fn()}
    />
  )
  expect(screen.getByText('Mistral 7B')).toBeInTheDocument()
  expect(screen.getByText('Connection timeout')).toBeInTheDocument()
})

test('header shows failed count when error entries exist', () => {
  render(
    <DownloadSidebar
      downloads={{
        'meta-llama/llama-3.1-8b': activeDownload,
        'mistral/7b': errorDownload,
      }}
      onCancel={vi.fn()}
    />
  )
  expect(screen.getByText(/1 failed/)).toBeInTheDocument()
})

test('calls onCancel with model ID when cancel button clicked for active entry', async () => {
  const user = userEvent.setup()
  const onCancel = vi.fn()
  render(
    <DownloadSidebar
      downloads={{ 'meta-llama/llama-3.1-8b': activeDownload }}
      onCancel={onCancel}
    />
  )
  const cancelBtn = screen.getByRole('button', { name: /Cancel download of Llama 3.1 8B/ })
  await user.click(cancelBtn)
  expect(onCancel).toHaveBeenCalledWith('meta-llama/llama-3.1-8b')
})

test('calls onCancel with model ID when dismiss button clicked on error entry', async () => {
  const user = userEvent.setup()
  const onCancel = vi.fn()
  render(
    <DownloadSidebar
      downloads={{ 'mistral/7b': errorDownload }}
      onCancel={onCancel}
    />
  )
  const dismissBtn = screen.getByRole('button', { name: /Dismiss failed download of Mistral 7B/ })
  await user.click(dismissBtn)
  expect(onCancel).toHaveBeenCalledWith('mistral/7b')
})

test('summary footer is not shown when only error entries exist', () => {
  render(
    <DownloadSidebar
      downloads={{ 'mistral/7b': errorDownload }}
      onCancel={vi.fn()}
    />
  )
  expect(
    screen.queryByRole('progressbar', { name: /Overall download progress/ })
  ).not.toBeInTheDocument()
})

test('summary footer is shown when active downloads exist', () => {
  render(
    <DownloadSidebar
      downloads={{ 'meta-llama/llama-3.1-8b': activeDownload }}
      onCancel={vi.fn()}
    />
  )
  expect(
    screen.getByRole('progressbar', { name: /Overall download progress/ })
  ).toBeInTheDocument()
})

test('shows default error message when error entry has no error text', () => {
  const noMessageError: DownloadQueueEntry = {
    ...errorDownload,
    error: undefined,
  }
  render(
    <DownloadSidebar
      downloads={{ 'some/model': noMessageError }}
      onCancel={vi.fn()}
    />
  )
  expect(screen.getByText('Download failed')).toBeInTheDocument()
})
