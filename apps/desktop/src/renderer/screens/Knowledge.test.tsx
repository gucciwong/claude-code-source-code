import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Knowledge } from './Knowledge'
import { useKnowledgeLibraryStore } from '../store/knowledgeLibraryStore'
import { vi } from 'vitest'

const baseStore = {
  snippets: [],
  decisions: [],
  domainStats: [],
  memoryMarkdown: '',
  totalItems: 0,
  isIndexing: false,
  searchQuery: '',
  searchResults: [],
  injectionEnabled: true,
  setSnippets: vi.fn(),
  setDecisions: vi.fn(),
  setSearchResults: vi.fn(),
  setMemoryMarkdown: vi.fn(),
  setDomainStats: vi.fn(),
  setTotalItems: vi.fn(),
  setIsIndexing: vi.fn(),
  setSearchQuery: vi.fn(),
  setInjectionEnabled: vi.fn(),
  removeSnippet: vi.fn(),
}

beforeEach(() => {
  useKnowledgeLibraryStore.setState({ ...baseStore })
})

test('renders "Knowledge Library" heading', () => {
  render(<Knowledge />)
  expect(screen.getByRole('heading', { name: /knowledge library/i })).toBeInTheDocument()
})

test('renders all 4 tab labels', () => {
  render(<Knowledge />)
  expect(screen.getByRole('tab', { name: /snippets/i })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /decisions/i })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /domains/i })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /memory/i })).toBeInTheDocument()
})

test('Snippets tab is active by default', () => {
  render(<Knowledge />)
  const snippetsTab = screen.getByRole('tab', { name: /snippets/i })
  expect(snippetsTab).toHaveAttribute('data-state', 'active')
})

test('shows total item count from store', () => {
  useKnowledgeLibraryStore.setState({ totalItems: 42 })
  render(<Knowledge />)
  expect(screen.getByText(/42 items/i)).toBeInTheDocument()
})

test('shows "Indexing..." when isIndexing is true', () => {
  useKnowledgeLibraryStore.setState({ isIndexing: true })
  render(<Knowledge />)
  expect(screen.getByText(/indexing\.\.\./i)).toBeInTheDocument()
})

test('shows "Ready" when isIndexing is false', () => {
  useKnowledgeLibraryStore.setState({ isIndexing: false })
  render(<Knowledge />)
  expect(screen.getByText(/ready/i)).toBeInTheDocument()
})

test('SnippetBrowser is rendered in Snippets tab', () => {
  render(<Knowledge />)
  // SnippetBrowser renders a count text
  expect(screen.getByText(/0 snippets/i)).toBeInTheDocument()
})

test('clicking Decisions tab shows DecisionLog', async () => {
  const user = userEvent.setup()
  render(<Knowledge />)
  await user.click(screen.getByRole('tab', { name: /decisions/i }))
  expect(screen.getByText(/no decisions logged yet/i)).toBeInTheDocument()
})

test('clicking Memory tab shows textarea', async () => {
  const user = userEvent.setup()
  render(<Knowledge />)
  await user.click(screen.getByRole('tab', { name: /memory/i }))
  expect(screen.getByRole('textbox')).toBeInTheDocument()
})

test('delete button calls removeSnippet', async () => {
  const removeSnippet = vi.fn()
  useKnowledgeLibraryStore.setState({
    removeSnippet,
    snippets: [
      {
        id: 'snip-1',
        text: 'console.log("hello")',
        language: 'typescript',
        domain: 'testing',
        qualityScore: 0.9,
        usageCount: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: [],
        rejected: false,
      },
    ],
  })
  const user = userEvent.setup()
  render(<Knowledge />)
  const deleteBtn = screen.getByRole('button', { name: /delete snippet/i })
  await user.click(deleteBtn)
  expect(removeSnippet).toHaveBeenCalledWith('snip-1')
})

test('memory textarea reflects store value', async () => {
  useKnowledgeLibraryStore.setState({ memoryMarkdown: '# My Notes' })
  const user = userEvent.setup()
  render(<Knowledge />)
  await user.click(screen.getByRole('tab', { name: /memory/i }))
  const textarea = screen.getByRole('textbox')
  expect(textarea).toHaveValue('# My Notes')
})

test('save button exists in Memory tab', async () => {
  const user = userEvent.setup()
  render(<Knowledge />)
  await user.click(screen.getByRole('tab', { name: /memory/i }))
  expect(screen.getByRole('button', { name: /save memory/i })).toBeInTheDocument()
})
