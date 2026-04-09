import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HuggingFacePanel } from './HuggingFacePanel'
import { useModelManager } from '../../hooks/useModelManager'
import * as modelManagerAPI from '../../services/modelManagerAPI'
import { useDownloadStore } from '../../store/downloadStore'

vi.mock('../../hooks/useModelManager')
vi.mock('../../services/modelManagerAPI', () => ({
  getDownloadStatus: vi.fn().mockResolvedValue({}),
  downloadFromHuggingFace: vi.fn().mockResolvedValue({ status: 'queued' }),
  cancelDownload: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('./ModelFilePickerDialog', () => ({
  ModelFilePickerDialog: ({ modelId, onClose, onConfirm }: { modelId: string; onClose: () => void; onConfirm: (id: string, path: string) => void }) => (
    <div data-testid="file-picker-dialog">
      <span data-testid="picker-model-id">{modelId}</span>
      <button onClick={onClose}>Close picker</button>
      <button onClick={() => onConfirm(modelId, 'model.Q4_K_M.gguf')}>Confirm download</button>
    </div>
  ),
}))

const mockUseModelManager = {
  loading: false,
  error: null,
  checkHealth: vi.fn().mockResolvedValue({ status: 'ok', version: '1.0', device: 'cpu', cache_path: '/tmp', cache_limit_gb: 10, mirror: 'hf', huggingface_endpoint: 'https://huggingface.co', api_endpoint: 'https://huggingface.co' }),
  listModels: vi.fn().mockResolvedValue({ cached_models: [], active_model: null }),
  downloadModel: vi.fn().mockResolvedValue({ status: 'started' }),
  getDownloadStatus: vi.fn().mockResolvedValue({}),
  setActiveModel: vi.fn().mockResolvedValue({}),
  getMirrorInfo: vi.fn().mockResolvedValue(null),
  getSwitchMirrorInstructions: vi.fn().mockResolvedValue(null),
  searchModels: vi.fn().mockResolvedValue([]),
  cancelDownload: vi.fn().mockResolvedValue(undefined),
  pauseDownload: vi.fn().mockResolvedValue(undefined),
  resumeDownload: vi.fn().mockResolvedValue(undefined),
  fetchModelFiles: vi.fn().mockResolvedValue([]),
}

beforeEach(() => {
  vi.mocked(useModelManager).mockReturnValue(mockUseModelManager)
  useDownloadStore.setState({
    downloadStatuses: new Map(),
    downloadDetails: {},
  })
})

test('renders "Download from HuggingFace" heading', async () => {
  render(<HuggingFacePanel />)
  await act(async () => {})
  expect(screen.getByText('Download from HuggingFace')).toBeInTheDocument()
})

test('renders "Staff Picks" section by default', async () => {
  render(<HuggingFacePanel />)
  await act(async () => {})
  expect(screen.getByText('Staff Picks')).toBeInTheDocument()
})

test('renders all 8 staff pick model names', async () => {
  render(<HuggingFacePanel />)
  await act(async () => {})
  expect(screen.getByText('Llama 3.1 8B Instruct')).toBeInTheDocument()
  expect(screen.getByText('Mistral 7B Instruct v0.3')).toBeInTheDocument()
  expect(screen.getByText('Qwen 2.5 Coder 7B')).toBeInTheDocument()
  expect(screen.getByText('Phi-3.5 Mini Instruct')).toBeInTheDocument()
  expect(screen.getByText('Gemma 2 9B Instruct')).toBeInTheDocument()
  expect(screen.getByText('DeepSeek Coder V2 Lite')).toBeInTheDocument()
  expect(screen.getByText('Hermes 3 Llama 3.1 8B')).toBeInTheDocument()
  expect(screen.getByText('Code Llama 13B Instruct')).toBeInTheDocument()
})

test('renders ModelCard for each staff pick (8 Download buttons)', async () => {
  render(<HuggingFacePanel />)
  await act(async () => {})
  const downloadButtons = screen.getAllByText('Download')
  expect(downloadButtons).toHaveLength(9)
})

test('shows a search input', async () => {
  render(<HuggingFacePanel />)
  await act(async () => {})
  expect(
    screen.getByPlaceholderText(/Search HuggingFace models/)
  ).toBeInTheDocument()
})

test('shows offline warning when service is offline', async () => {
  vi.mocked(useModelManager).mockReturnValue({
    ...mockUseModelManager,
    checkHealth: vi.fn().mockResolvedValue(null),
  })
  render(<HuggingFacePanel />)
  expect(
    await screen.findByText(/Model Manager service is offline \(port 8002\)/)
  ).toBeInTheDocument()
})

test('direct model ID downloads are tracked in the sidebar store', async () => {
  const user = userEvent.setup()
  render(<HuggingFacePanel />)
  await act(async () => {})

  await user.type(screen.getByRole('textbox', { name: /HuggingFace model ID/i }), 'Qwen/Qwen2.5-3B-Instruct-GGUF')
  await user.click(screen.getByRole('button', { name: /^Download$/i }))

  expect(modelManagerAPI.downloadFromHuggingFace).toHaveBeenCalledWith('Qwen/Qwen2.5-3B-Instruct-GGUF', '')
  expect(useDownloadStore.getState().downloadStatuses.get('Qwen/Qwen2.5-3B-Instruct-GGUF')).toBe('downloading')
})

test('clicking Download on a staff pick card opens the file picker dialog', async () => {
  const user = userEvent.setup()
  render(<HuggingFacePanel />)
  await act(async () => {})

  // No dialog before interaction
  expect(screen.queryByTestId('file-picker-dialog')).not.toBeInTheDocument()

  // Click the first staff-pick Download button.
  // ModelCard buttons have aria-label="Download {name}" so we match by prefix "Download ".
  const staffPickDownloadButtons = screen.getAllByRole('button', { name: /^Download /i })
  await user.click(staffPickDownloadButtons[0])

  expect(screen.getByTestId('file-picker-dialog')).toBeInTheDocument()
  expect(screen.getByTestId('picker-model-id').textContent).toBe('bartowski/Meta-Llama-3.1-8B-Instruct-GGUF')
})

test('confirming a file in the dialog calls downloadFromHuggingFace with the file path', async () => {
  const user = userEvent.setup()
  render(<HuggingFacePanel />)
  await act(async () => {})

  const staffPickDownloadButtons = screen.getAllByRole('button', { name: /^Download /i })
  await user.click(staffPickDownloadButtons[0])

  await user.click(screen.getByRole('button', { name: /Confirm download/i }))

  expect(modelManagerAPI.downloadFromHuggingFace).toHaveBeenCalledWith(
    'bartowski/Meta-Llama-3.1-8B-Instruct-GGUF',
    'model.Q4_K_M.gguf',
  )
  // Dialog closes after confirm
  expect(screen.queryByTestId('file-picker-dialog')).not.toBeInTheDocument()
})
