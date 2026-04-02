import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConversationMemory } from './ConversationMemory'
import { useMemoryStore } from '../store/memoryStore'

// Mock the hook so no real fetches happen
vi.mock('../hooks/useConversationMemory', () => ({
  useConversationMemory: () => ({
    fetchMemories: vi.fn().mockResolvedValue([]),
    addMemoryItem: vi.fn(),
    searchMemories: vi.fn(),
    deleteMemory: vi.fn(),
    buildContext: vi.fn(),
  }),
}))

describe('ConversationMemory screen', () => {
  beforeEach(() => {
    useMemoryStore.setState({
      memories: [],
      searchResults: [],
      contextSummary: null,
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders heading "Conversation Memory"', () => {
    render(<ConversationMemory />)
    expect(screen.getByRole('heading', { name: /conversation memory/i })).toBeInTheDocument()
  })

  it('renders description mentioning TF-IDF or relevance', () => {
    render(<ConversationMemory />)
    const desc = screen.getByText(/TF-IDF|relevance/i)
    expect(desc).toBeInTheDocument()
  })

  it('renders Memories tab', () => {
    render(<ConversationMemory />)
    expect(screen.getByRole('tab', { name: /memories/i })).toBeInTheDocument()
  })

  it('renders Search tab', () => {
    render(<ConversationMemory />)
    expect(screen.getByRole('tab', { name: /search/i })).toBeInTheDocument()
  })

  it('renders Context tab', () => {
    render(<ConversationMemory />)
    expect(screen.getByRole('tab', { name: /context/i })).toBeInTheDocument()
  })

  it('renders add memory input', () => {
    render(<ConversationMemory />)
    expect(screen.getByRole('textbox', { name: /new memory text/i })).toBeInTheDocument()
  })

  it('shows memories count in Memories tab label', () => {
    useMemoryStore.setState({ memories: [
      { id: '1', text: 'a', tags: [], relevance_score: 0, timestamp: new Date().toISOString() },
      { id: '2', text: 'b', tags: [], relevance_score: 0, timestamp: new Date().toISOString() },
    ] })
    render(<ConversationMemory />)
    expect(screen.getByRole('tab', { name: /memories \(2\)/i })).toBeInTheDocument()
  })
})
