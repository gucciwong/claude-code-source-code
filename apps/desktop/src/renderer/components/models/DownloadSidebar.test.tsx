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

const pausedDownload: DownloadQueueEntry = {
  status: 'paused',
  progress: 35,
  total_size_gb: 4.5,
  downloaded_gb: 1.6,
  model_name: 'Llama 3.1 8B',
  started_at: Date.now() / 1000 - 30,
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

const defaultHandlers = {
  onCancel: vi.fn(),
  onPause: vi.fn(),
  onResume: vi.fn(),
}

test('renders null when downloads object is empty', () => {
  const { container } = render(<DownloadSidebar downloads={{}} {...defaultHandlers} />)
  expect(container.firstChild).toBeNull()
})

test('renders active download entry with model name and progress bar', () => {
  render(
    <DownloadSidebar
      downloads={{ 'meta-llama/llama-3.1-8b': activeDownload }}
      {...defaultHandlers}
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
      {...defaultHandlers}
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
      {...defaultHandlers}
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
      onPause={vi.fn()}
      onResume={vi.fn()}
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
      onPause={vi.fn()}
      onResume={vi.fn()}
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
      {...defaultHandlers}
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
      {...defaultHandlers}
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
      {...defaultHandlers}
    />
  )
  expect(screen.getByText('Download failed')).toBeInTheDocument()
})

// Pause / Resume tests

test('pause button is shown for an active (downloading) entry', () => {
  render(
    <DownloadSidebar
      downloads={{ 'meta-llama/llama-3.1-8b': activeDownload }}
      {...defaultHandlers}
    />
  )
  expect(
    screen.getByRole('button', { name: /Pause download of Llama 3.1 8B/ })
  ).toBeInTheDocument()
})

test('resume button is shown for a paused entry', () => {
  render(
    <DownloadSidebar
      downloads={{ 'meta-llama/llama-3.1-8b': pausedDownload }}
      {...defaultHandlers}
    />
  )
  expect(
    screen.getByRole('button', { name: /Resume download of Llama 3.1 8B/ })
  ).toBeInTheDocument()
})

test('calls onPause with model ID when pause button clicked', async () => {
  const user = userEvent.setup()
  const onPause = vi.fn()
  render(
    <DownloadSidebar
      downloads={{ 'meta-llama/llama-3.1-8b': activeDownload }}
      onCancel={vi.fn()}
      onPause={onPause}
      onResume={vi.fn()}
    />
  )
  await user.click(screen.getByRole('button', { name: /Pause download of Llama 3.1 8B/ }))
  expect(onPause).toHaveBeenCalledWith('meta-llama/llama-3.1-8b')
})

test('calls onResume with model ID when resume button clicked', async () => {
  const user = userEvent.setup()
  const onResume = vi.fn()
  render(
    <DownloadSidebar
      downloads={{ 'meta-llama/llama-3.1-8b': pausedDownload }}
      onCancel={vi.fn()}
      onPause={vi.fn()}
      onResume={onResume}
    />
  )
  await user.click(screen.getByRole('button', { name: /Resume download of Llama 3.1 8B/ }))
  expect(onResume).toHaveBeenCalledWith('meta-llama/llama-3.1-8b')
})

test('paused entry still appears in the download list', () => {
  render(
    <DownloadSidebar
      downloads={{ 'meta-llama/llama-3.1-8b': pausedDownload }}
      {...defaultHandlers}
    />
  )
  expect(screen.getByText('Llama 3.1 8B')).toBeInTheDocument()
})

test('paused entry shows Paused label in stats row', () => {
  render(
    <DownloadSidebar
      downloads={{ 'meta-llama/llama-3.1-8b': pausedDownload }}
      {...defaultHandlers}
    />
  )
  expect(screen.getByText(/Paused/)).toBeInTheDocument()
})

test('summary footer counts paused entry as active', () => {
  render(
    <DownloadSidebar
      downloads={{ 'meta-llama/llama-3.1-8b': pausedDownload }}
      {...defaultHandlers}
    />
  )
  expect(
    screen.getByRole('progressbar', { name: /Overall download progress/ })
  ).toBeInTheDocument()
})
