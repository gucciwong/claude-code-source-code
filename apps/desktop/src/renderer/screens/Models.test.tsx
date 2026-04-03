import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Models } from './Models'
import { useModelsStore } from '../store/modelsStore'
import { useSystemStore } from '../store/systemStore'

const mockModels = [
  { name: 'llama3.1:8b', size: 4_500_000_000, digest: 'abc123def456', modified_at: '2024-01-15T10:00:00Z' },
  { name: 'mistral:7b', size: 3_800_000_000, digest: 'xyz789uvw012', modified_at: '2024-02-20T08:00:00Z' },
]

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    json: () => Promise.resolve({}),
  }))
  useModelsStore.setState({ installed: mockModels, selected: null })
  useSystemStore.setState({ ollamaOnline: true, activeModel: '' })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('renders installed models list', () => {
  render(<Models />)
  expect(screen.getByText('llama3.1:8b')).toBeInTheDocument()
  expect(screen.getByText('mistral:7b')).toBeInTheDocument()
})

test('shows INSTALLED section header', () => {
  render(<Models />)
  expect(screen.getByText('Installed')).toBeInTheDocument()
})

test('shows empty state when no model selected', () => {
  render(<Models />)
  expect(screen.getByText('Select a model')).toBeInTheDocument()
})

test('selecting a model shows model detail', async () => {
  const user = userEvent.setup()
  render(<Models />)
  await user.click(screen.getByRole('button', { name: /llama3.1:8b/ }))
  expect(screen.getByRole('heading', { name: 'llama3.1:8b' })).toBeInTheDocument()
})

test('model detail shows size formatted as GB', async () => {
  const user = userEvent.setup()
  render(<Models />)
  await user.click(screen.getByRole('button', { name: /llama3.1:8b/ }))
  expect(screen.getByText('4.5 GB')).toBeInTheDocument()
})

test('model detail shows info grid with Parameters, Size, Status, Modified', async () => {
  useModelsStore.setState({ installed: mockModels, selected: 'llama3.1:8b' })
  render(<Models />)
  expect(screen.getByText('Parameters')).toBeInTheDocument()
  expect(screen.getByText('Size')).toBeInTheDocument()
  expect(screen.getByText('Status')).toBeInTheDocument()
  expect(screen.getByText('Modified')).toBeInTheDocument()
})

test('Set as Active button sets activeModel in systemStore', async () => {
  const user = userEvent.setup()
  useModelsStore.setState({ installed: mockModels, selected: 'llama3.1:8b' })
  render(<Models />)
  const button = screen.getByText('Set as Active')
  await user.click(button)
  expect(useSystemStore.getState().activeModel).toBe('llama3.1:8b')
})

test('shows Fine-tune button', async () => {
  useModelsStore.setState({ installed: mockModels, selected: 'llama3.1:8b' })
  render(<Models />)
  expect(screen.getByRole('button', { name: /Fine-tune/ })).toBeInTheDocument()
})

test('shows Delete button', async () => {
  useModelsStore.setState({ installed: mockModels, selected: 'llama3.1:8b' })
  render(<Models />)
  expect(screen.getByRole('button', { name: /Delete/ })).toBeInTheDocument()
})

test('shows active model indicator (checkmark) on selected model in detail', async () => {
  useSystemStore.setState({ activeModel: 'llama3.1:8b' })
  useModelsStore.setState({ installed: mockModels, selected: 'llama3.1:8b' })
  render(<Models />)
  // Verify checkmark is shown in the detail panel when model is active
  const checkmark = screen.getByLabelText('Active model')
  expect(checkmark).toBeInTheDocument()
})

test('shows offline indicator when ollama is offline', () => {
  useSystemStore.setState({ ollamaOnline: false })
  render(<Models />)
  expect(screen.getByText(/Ollama offline/i)).toBeInTheDocument()
})

test('shows no models installed when list empty', () => {
  useModelsStore.setState({ installed: [], selected: null })
  render(<Models />)
  expect(screen.getByText('No models installed')).toBeInTheDocument()
})

test('displays status as Active when model is activeModel', async () => {
  useSystemStore.setState({ activeModel: 'llama3.1:8b' })
  useModelsStore.setState({ installed: mockModels, selected: 'llama3.1:8b' })
  render(<Models />)
  expect(screen.getAllByText('Active')[0]).toBeInTheDocument()
})

test('displays status as Installed when model is not activeModel', async () => {
  useSystemStore.setState({ activeModel: 'mistral:7b' })
  useModelsStore.setState({ installed: mockModels, selected: 'llama3.1:8b' })
  render(<Models />)
  // Find "Installed" in the status grid area (not the header)
  const statusElements = screen.getAllByText('Installed')
  expect(statusElements.length).toBeGreaterThan(1)
})

test('renders tab bar with Installed and Download from HuggingFace tabs', () => {
  render(<Models />)
  expect(screen.getByRole('tab', { name: /Installed/ })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /Download from HuggingFace/ })).toBeInTheDocument()
})

test('Parameters card shows value when details.parameter_size is present', () => {
  const modelWithDetails = [
    { ...mockModels[0], details: { parameter_size: '7.2B', quantization_level: 'Q4_K_M', family: 'llama', format: 'gguf' } },
    ...mockModels.slice(1),
  ]
  useModelsStore.setState({ installed: modelWithDetails, selected: 'llama3.1:8b' })
  render(<Models />)
  expect(screen.getByText('7.2B')).toBeInTheDocument()
})

test('Parameters card shows \u2014 when details are absent', () => {
  useModelsStore.setState({ installed: mockModels, selected: 'llama3.1:8b' })
  render(<Models />)
  expect(screen.getByText('Parameters')).toBeInTheDocument()
  // The em-dash fallback should be rendered
  expect(screen.getAllByText('\u2014').length).toBeGreaterThanOrEqual(1)
})

test('quantization_level badge renders when present', () => {
  const modelWithDetails = [
    { ...mockModels[0], details: { parameter_size: '7.2B', quantization_level: 'Q4_K_M', family: 'llama', format: 'gguf' } },
    ...mockModels.slice(1),
  ]
  useModelsStore.setState({ installed: modelWithDetails, selected: 'llama3.1:8b' })
  render(<Models />)
  expect(screen.getByText('Q4_K_M')).toBeInTheDocument()
})

test('Installed tab shows installed model count', () => {
  render(<Models />)
  expect(screen.getByRole('tab', { name: /Installed \(2\)/ })).toBeInTheDocument()
})
