import { render, screen, act } from '@testing-library/react'
import { HuggingFacePanel } from './HuggingFacePanel'
import { useModelManager } from '../../hooks/useModelManager'

vi.mock('../../hooks/useModelManager')

const mockUseModelManager = {
  loading: false,
  error: null,
  checkHealth: vi.fn().mockResolvedValue({ status: 'ok', version: '1.0', device: 'cpu', cache_path: '/tmp', cache_limit_gb: 10, mirror: 'hf', huggingface_endpoint: 'https://huggingface.co', api_endpoint: 'https://huggingface.co' }),
  listModels: vi.fn().mockResolvedValue({ cached_models: [], active_model: null }),
  downloadModel: vi.fn().mockResolvedValue({ status: 'started' }),
  setActiveModel: vi.fn().mockResolvedValue({}),
  getMirrorInfo: vi.fn().mockResolvedValue(null),
  getSwitchMirrorInstructions: vi.fn().mockResolvedValue(null),
}

beforeEach(() => {
  vi.mocked(useModelManager).mockReturnValue(mockUseModelManager)
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
  expect(downloadButtons).toHaveLength(8)
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
