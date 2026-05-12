import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Chat } from './Chat'
import { useChatStore } from '../store/chatStore'
import { useSystemStore } from '../store/systemStore'
import { useAgentStore } from '../store/agentStore'
import { useVoiceStore } from '../store/voiceStore'
import { useModelManagerStore } from '../store/modelManagerStore'
import { useModelsStore } from '../store/modelsStore'
import { useRouterStore, _resetRouterStoreForTests } from '../store/routerStore'
import * as ollamaClient from '../services/ollamaClient'
import { modelManagerAPI } from '../services/modelManagerAPI'

// Mock streamChat to avoid real HTTP calls
vi.mock('../services/ollamaClient', () => ({
  streamChat: vi.fn(async function* () {
    yield 'Hello '
    yield 'world'
  }),
}))

vi.mock('../services/modelManagerAPI', () => ({
  modelManagerAPI: {
    streamInference: vi.fn(async function* () {
      yield 'Model '
      yield 'manager'
    }),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  useChatStore.setState({ messages: [] })
  useSystemStore.setState({ activeModel: 'llama3.1:8b' })
  useAgentStore.setState({
    agentMode: false,
    toolCalls: [],
    fileChanges: [],
    dryRun: false,
  })
  useVoiceStore.setState({ isProcessing: false })
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
  useModelsStore.setState({ installed: [], selected: null })
  _resetRouterStoreForTests()
})

test('renders chat screen', () => {
  render(<Chat />)
  expect(screen.getByTestId('screen-chat')).toBeInTheDocument()
})

test('shows empty state when no messages', () => {
  render(<Chat />)
  expect(screen.getByText(/Start a conversation/i)).toBeInTheDocument()
})

test('renders model name in header', () => {
  render(<Chat />)
  expect(screen.getByText('llama3.1:8b')).toBeInTheDocument()
})

test('shows model sizes in the picker when available', () => {
  useSystemStore.setState({ activeModel: 'tiny-gguf' })
  useModelsStore.setState({
    installed: [{ name: 'llama3.1:8b', size: 4_500_000_000, digest: 'abc123', modified_at: '2024-01-15T10:00:00Z' }],
    selected: null,
  })
  useModelManagerStore.setState({
    models: [
      {
        id: 'tiny-gguf',
        name: 'tiny-gguf',
        cached: true,
        size_bytes: 2_200_000_000,
        local_path: 'C:/models/tiny.gguf',
        format: 'gguf',
        source: 'local',
        status: 'ready',
      },
    ],
  })

  render(<Chat />)

  expect(screen.getByRole('option', { name: 'llama3.1:8b (4.50 GB, Ollama)' })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: 'tiny-gguf (2.20 GB)' })).toBeInTheDocument()
})

test('send button is disabled when input is empty', () => {
  render(<Chat />)
  expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()
})

test('textarea has accessible label', () => {
  render(<Chat />)
  expect(screen.getByRole('textbox', { name: /chat message input/i })).toBeInTheDocument()
})

test('renders agent mode toggle button', () => {
  render(<Chat />)
  const agentButton = screen.getByRole('button', { name: /toggle agent mode/i })
  expect(agentButton).toBeInTheDocument()
})

test('activates agent mode when button clicked', async () => {
  const user = userEvent.setup()
  render(<Chat />)

  const agentButton = screen.getByRole('button', { name: /toggle agent mode/i })
  await user.click(agentButton)

  expect(agentButton).toHaveClass('bg-accent-500')
  expect(agentButton).toHaveAttribute('aria-pressed', 'true')
})

test('shows dry run checkbox when agent mode is on', async () => {
  const user = userEvent.setup()
  render(<Chat />)

  const agentButton = screen.getByRole('button', { name: /toggle agent mode/i })
  await user.click(agentButton)

  expect(screen.getByLabelText('Dry run mode')).toBeInTheDocument()
})

test('does not show dry run checkbox when agent mode is off', () => {
  render(<Chat />)
  expect(screen.queryByLabelText('Dry run mode')).not.toBeInTheDocument()
})

test('shows tool trace when agent mode is active', () => {
  useAgentStore.setState({
    agentMode: true,
    toolCalls: [
      {
        id: 'tool-1',
        name: 'readFile',
        status: 'done',
        inputs: {},
        output: 'ok',
        timestamp: Date.now(),
      },
    ],
  })

  render(<Chat />)
  expect(screen.getByText('Tool Calls')).toBeInTheDocument()
})

test('does not show tool trace when agent mode is off', () => {
  useAgentStore.setState({
    agentMode: false,
    toolCalls: [
      {
        id: 'tool-1',
        name: 'readFile',
        status: 'done',
        inputs: {},
        output: 'ok',
        timestamp: Date.now(),
      },
    ],
  })

  render(<Chat />)
  expect(screen.queryByText('Tool Calls')).not.toBeInTheDocument()
})

test('renders voice panel toggle button', () => {
  render(<Chat />)
  expect(screen.getByRole('button', { name: /toggle voice panel/i })).toBeInTheDocument()
})

test('expands voice panel when toggle is clicked', async () => {
  const user = userEvent.setup()
  render(<Chat />)

  const voiceToggle = screen.getByRole('button', { name: /toggle voice panel/i })
  await user.click(voiceToggle)

  expect(voiceToggle).toHaveAttribute('aria-expanded', 'true')
})

test('collapses voice panel when toggle is clicked again', async () => {
  const user = userEvent.setup()
  render(<Chat />)

  const voiceToggle = screen.getByRole('button', { name: /toggle voice panel/i })
  await user.click(voiceToggle)
  await user.click(voiceToggle)

  expect(voiceToggle).toHaveAttribute('aria-expanded', 'false')
})

test('disables textarea when voice is processing', () => {
  useVoiceStore.setState({ isProcessing: true })
  render(<Chat />)

  const textarea = screen.getByRole('textbox', { name: /chat message input/i })
  expect(textarea).toBeDisabled()
})

test('disables send button when voice is processing', () => {
  useVoiceStore.setState({ isProcessing: true })
  render(<Chat />)

  const sendButton = screen.getByRole('button', { name: 'Send message' })
  expect(sendButton).toBeDisabled()
})

test('shows diff viewer when agent mode is active', () => {
  useAgentStore.setState({
    agentMode: true,
    fileChanges: [
      {
        id: 'change-1',
        file: 'src/app.ts',
        type: 'modify',
        diff: 'diff',
        accepted: null,
      },
    ],
  })

  render(<Chat />)
  expect(screen.getByText('File Changes')).toBeInTheDocument()
})

test('does not show diff viewer when agent mode is off', () => {
  useAgentStore.setState({
    agentMode: false,
    fileChanges: [
      {
        id: 'change-1',
        file: 'src/app.ts',
        type: 'modify',
        diff: 'diff',
        accepted: null,
      },
    ],
  })

  render(<Chat />)
  expect(screen.queryByText('File Changes')).not.toBeInTheDocument()
})

test('renders both tool trace and diff viewer in agent mode', () => {
  useAgentStore.setState({
    agentMode: true,
    toolCalls: [
      {
        id: 'tool-1',
        name: 'tool',
        status: 'done',
        inputs: {},
        timestamp: Date.now(),
      },
    ],
    fileChanges: [
      {
        id: 'change-1',
        file: 'file.ts',
        type: 'create',
        diff: 'new',
        accepted: null,
      },
    ],
  })

  render(<Chat />)
  expect(screen.getByText('Tool Calls')).toBeInTheDocument()
  expect(screen.getByText('File Changes')).toBeInTheDocument()
})

test('shows error message in assistant bubble when stream fails', async () => {
  vi.mocked(ollamaClient.streamChat).mockImplementationOnce(async function* () {
    throw new Error('Connection reset')
  })
  const user = userEvent.setup()
  render(<Chat />)
  await user.type(screen.getByRole('textbox', { name: /chat message input/i }), 'hello')
  await user.click(screen.getByRole('button', { name: 'Send message' }))
  expect(await screen.findByText(/Connection reset/i)).toBeInTheDocument()
})

// ── UI W4-a — CAMR Auto pill (hero model picker) ────────────────────────

test('renders the Auto / Manual mode toggle group', () => {
  render(<Chat />)
  const group = screen.getByRole('group', { name: /model selection mode/i })
  expect(group).toBeInTheDocument()
  // Both segments are buttons inside the group.
  expect(screen.getByRole('button', { name: /^Auto$/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^Manual$/ })).toBeInTheDocument()
})

test('Manual mode renders the model select dropdown', () => {
  useRouterStore.setState({ mode: 'manual', lastChoice: null })
  render(<Chat />)
  expect(screen.getByRole('combobox', { name: /select model/i })).toBeInTheDocument()
})

test('Auto mode hides the select and shows the CAMR wordmark', () => {
  useRouterStore.setState({ mode: 'auto', lastChoice: null })
  render(<Chat />)
  expect(screen.queryByRole('combobox', { name: /select model/i })).not.toBeInTheDocument()
  expect(screen.getByText('CAMR')).toBeInTheDocument()
  expect(screen.getByText(/awaiting first prompt/i)).toBeInTheDocument()
})

test('Auto mode caption shows the last CAMR-chosen model + reason', () => {
  useRouterStore.setState({
    mode: 'auto',
    lastChoice: {
      model_id: 'qwen2.5-coder:14b',
      reason: 'larger context window for refactor',
      decided_at: 0,
    } as unknown as Parameters<typeof useRouterStore.setState>[0]['lastChoice'],
  })
  render(<Chat />)
  expect(screen.getByTestId('camr-reason')).toHaveTextContent('qwen2.5-coder:14b')
  expect(screen.getByTestId('camr-reason')).toHaveTextContent('larger context window for refactor')
})

test('clicking Auto switches routerStore mode to auto', async () => {
  const user = userEvent.setup()
  useRouterStore.setState({ mode: 'manual', lastChoice: null })
  render(<Chat />)
  await user.click(screen.getByRole('button', { name: /^Auto$/ }))
  expect(useRouterStore.getState().mode).toBe('auto')
})

test('clicking Manual switches routerStore mode to manual', async () => {
  const user = userEvent.setup()
  useRouterStore.setState({ mode: 'auto', lastChoice: null })
  render(<Chat />)
  await user.click(screen.getByRole('button', { name: /^Manual$/ }))
  expect(useRouterStore.getState().mode).toBe('manual')
})

test('the active mode button has aria-pressed=true', () => {
  useRouterStore.setState({ mode: 'auto', lastChoice: null })
  render(<Chat />)
  expect(screen.getByRole('button', { name: /^Auto$/ })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: /^Manual$/ })).toHaveAttribute('aria-pressed', 'false')
})

test('routes chat through model-manager when the active model is a model-manager model', async () => {
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

  render(<Chat />)
  await user.type(screen.getByRole('textbox', { name: /chat message input/i }), 'hello')
  await user.click(screen.getByRole('button', { name: 'Send message' }))

  expect(await screen.findByText(/Model manager/i)).toBeInTheDocument()
  expect(modelManagerAPI.streamInference).toHaveBeenCalled()
  expect(ollamaClient.streamChat).not.toHaveBeenCalled()
})
