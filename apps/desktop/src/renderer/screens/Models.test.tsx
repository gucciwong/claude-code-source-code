import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Models } from './Models'
import { useModelsStore } from '../store/modelsStore'
import { useSystemStore } from '../store/systemStore'

const mockModels = [
  { name: 'llama3.1:8b', size: 4_500_000_000, digest: 'abc123def456', modified_at: '2024-01-15T10:00:00Z' },
  { name: 'mistral:7b', size: 3_800_000_000, digest: 'xyz789uvw012', modified_at: '2024-02-20T08:00:00Z' },
]

beforeEach(() => {
  useModelsStore.setState({ installed: mockModels, selected: null })
  useSystemStore.setState({ ollamaOnline: true, activeModel: '' })
})

test('renders installed models list', () => {
  render(<Models />)
  expect(screen.getByText('llama3.1:8b')).toBeInTheDocument()
  expect(screen.getByText('mistral:7b')).toBeInTheDocument()
})

test('shows empty state when no model selected', () => {
  render(<Models />)
  expect(screen.getByText('Select a model')).toBeInTheDocument()
})

test('selecting a model shows model detail', async () => {
  const user = userEvent.setup()
  render(<Models />)
  await user.click(screen.getByRole('option', { name: 'llama3.1:8b' }))
  expect(screen.getByRole('heading', { name: 'llama3.1:8b' })).toBeInTheDocument()
})

test('model detail shows size formatted as GB', async () => {
  const user = userEvent.setup()
  render(<Models />)
  await user.click(screen.getByRole('option', { name: 'llama3.1:8b' }))
  expect(screen.getByText('4.5 GB')).toBeInTheDocument()
})

test('Load Model button sets activeModel in systemStore', async () => {
  const user = userEvent.setup()
  useModelsStore.setState({ installed: mockModels, selected: 'llama3.1:8b' })
  render(<Models />)
  await user.click(screen.getByRole('button', { name: 'Load Model' }))
  expect(useSystemStore.getState().activeModel).toBe('llama3.1:8b')
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
