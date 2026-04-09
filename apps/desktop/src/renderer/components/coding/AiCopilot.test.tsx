import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AiCopilot } from './AiCopilot'
import { useCodingStore } from '../../store/codingStore'
import { useSystemStore } from '../../store/systemStore'
import { useModelManagerStore } from '../../store/modelManagerStore'
import { modelManagerAPI } from '../../services/modelManagerAPI'

vi.mock('../../services/ollamaClient', () => ({
  streamChat: vi.fn(),
}))

vi.mock('../../services/modelManagerAPI', () => ({
  modelManagerAPI: {
    streamInference: vi.fn(async function* () {
      yield 'Code '
      yield 'answer'
    }),
  },
}))

beforeEach(() => {
  useSystemStore.setState({ activeModel: 'llama3.1:8b' })
  useCodingStore.setState({
    isCopilotOpen: true,
    copilotMessages: [],
    copilotInput: '',
    openTabs: [],
    activeTabId: null,
  })
  useModelManagerStore.setState({
    models: [],
    selectedModel: null,
    trainingJobs: [],
    activeTrainingJob: null,
    isLoading: false,
    error: null,
    isServiceAvailable: true,
    last_error: null,
  })
})

test('renders AI Copilot heading when open', () => {
  render(<AiCopilot />)
  expect(screen.getByText('AI Copilot')).toBeInTheDocument()
})

test('shows model name without tag in badge', () => {
  render(<AiCopilot />)
  expect(screen.getByText('llama3.1')).toBeInTheDocument()
})

test('shows model size in badge when available', () => {
  useModelManagerStore.setState({
    models: [
      {
        id: 'llama3.1:8b',
        name: 'llama3.1:8b',
        cached: true,
        size_bytes: 4_500_000_000,
        local_path: 'C:/models/llama3.1-8b.gguf',
        format: 'gguf',
        source: 'local',
        status: 'ready',
      },
    ],
  })
  render(<AiCopilot />)
  expect(screen.getByText('llama3.1 · 4.50 GB')).toBeInTheDocument()
})

test('shows "No model" when activeModel is null', () => {
  useSystemStore.setState({ activeModel: null })
  render(<AiCopilot />)
  expect(screen.getByText('No model')).toBeInTheDocument()
})

test('renders close button with accessible label', () => {
  render(<AiCopilot />)
  expect(screen.getByRole('button', { name: /Close AI Copilot/ })).toBeInTheDocument()
})

test('renders empty state message when no messages', () => {
  render(<AiCopilot />)
  expect(screen.getByText('Ask anything about your code')).toBeInTheDocument()
})

test('renders null when copilot is closed', () => {
  useCodingStore.setState({ isCopilotOpen: false })
  const { container } = render(<AiCopilot />)
  expect(container.firstChild).toBeNull()
})

test('shows quick prompts when a tab is active and no messages', () => {
  useCodingStore.setState({
    isCopilotOpen: true,
    copilotMessages: [],
    openTabs: [
      {
        id: 'tab-1',
        path: 'src/App.tsx',
        name: 'App.tsx',
        language: 'typescript',
        content: 'const x = 1',
        isDirty: false,
      },
    ],
    activeTabId: 'tab-1',
  })
  render(<AiCopilot />)
  expect(screen.getByRole('button', { name: /Explain/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Find bugs/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Add tests/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Refactor/ })).toBeInTheDocument()
})

test('renders input textarea with correct placeholder', () => {
  render(<AiCopilot />)
  expect(
    screen.getByPlaceholderText('Ask about your code... (Enter to send)')
  ).toBeInTheDocument()
})

test('input textarea has accessible label', () => {
  render(<AiCopilot />)
  expect(screen.getByRole('textbox', { name: /Copilot input/ })).toBeInTheDocument()
})

test('send button is present', () => {
  render(<AiCopilot />)
  expect(screen.getByRole('button', { name: /Send message/ })).toBeInTheDocument()
})

test('routes copilot requests through model-manager when the active model is a model-manager model', async () => {
  const user = userEvent.setup()
  useSystemStore.setState({ activeModel: 'tiny-gguf' })
  useModelManagerStore.setState({
    models: [
      {
        id: 'tiny-gguf',
        name: 'tiny-gguf',
        cached: true,
        size_bytes: 123,
        local_path: 'C:/models/tiny.gguf',
        format: 'gguf',
        source: 'local',
        status: 'ready',
      },
    ],
  })
  useCodingStore.setState({
    isCopilotOpen: true,
    copilotMessages: [],
    copilotInput: '',
    openTabs: [
      {
        id: 'tab-1',
        path: 'src/App.tsx',
        name: 'App.tsx',
        language: 'typescript',
        content: 'const x = 1',
        isDirty: false,
      },
    ],
    activeTabId: 'tab-1',
  })

  render(<AiCopilot />)
  await user.type(screen.getByRole('textbox', { name: /Copilot input/i }), 'Explain this code')
  await user.click(screen.getByRole('button', { name: /Send message/i }))

  expect(await screen.findByText(/Code answer/i)).toBeInTheDocument()
  expect(modelManagerAPI.streamInference).toHaveBeenCalled()
})
