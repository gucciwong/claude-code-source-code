import { render, screen } from '@testing-library/react'
import { AiCopilot } from './AiCopilot'
import { useCodingStore } from '../../store/codingStore'
import { useSystemStore } from '../../store/systemStore'

vi.mock('../../services/ollamaClient', () => ({
  streamChat: vi.fn(),
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
})

test('renders AI Copilot heading when open', () => {
  render(<AiCopilot />)
  expect(screen.getByText('AI Copilot')).toBeInTheDocument()
})

test('shows model name without tag in badge', () => {
  render(<AiCopilot />)
  expect(screen.getByText('llama3.1')).toBeInTheDocument()
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
