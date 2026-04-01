import { render, screen } from '@testing-library/react'
import { Chat } from './Chat'
import { useChatStore } from '../store/chatStore'
import { useSystemStore } from '../store/systemStore'

// Mock streamChat to avoid real HTTP calls
vi.mock('../services/ollamaClient', () => ({
  streamChat: async function* () {
    yield 'Hello '
    yield 'world'
  },
}))

beforeEach(() => {
  useChatStore.setState({ messages: [] })
  useSystemStore.setState({ activeModel: 'llama3.1:8b' })
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
  expect(screen.getByRole('heading', { name: 'llama3.1:8b' })).toBeInTheDocument()
})

test('send button is disabled when input is empty', () => {
  render(<Chat />)
  expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()
})

test('textarea has accessible label', () => {
  render(<Chat />)
  expect(screen.getByRole('textbox', { name: /chat message input/i })).toBeInTheDocument()
})
