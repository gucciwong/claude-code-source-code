import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryCard } from './MemoryCard'
import type { Memory } from '../../../shared/conversationMemory'

const memory: Memory = {
  id: 'mem-001',
  text: 'User prefers concise code answers without extra explanation.',
  tags: ['preferences', 'coding'],
  relevance_score: 0.92,
  timestamp: new Date('2024-01-15').toISOString(),
}

const noTagsMemory: Memory = {
  id: 'mem-002',
  text: 'Project uses Tailwind v4 with @theme syntax.',
  tags: [],
  relevance_score: 0.85,
  timestamp: new Date('2024-01-16').toISOString(),
}

describe('MemoryCard', () => {
  it('renders memory text', () => {
    render(<MemoryCard memory={memory} onDelete={vi.fn()} />)
    expect(screen.getByText(memory.text)).toBeInTheDocument()
  })

  it('renders tags', () => {
    render(<MemoryCard memory={memory} onDelete={vi.fn()} />)
    expect(screen.getByText('preferences')).toBeInTheDocument()
    expect(screen.getByText('coding')).toBeInTheDocument()
  })

  it('does not render tag section when no tags', () => {
    render(<MemoryCard memory={noTagsMemory} onDelete={vi.fn()} />)
    expect(screen.queryByText('preferences')).not.toBeInTheDocument()
  })

  it('delete button has aria-label with memory id', () => {
    render(<MemoryCard memory={memory} onDelete={vi.fn()} />)
    expect(screen.getByRole('button', { name: `Delete memory ${memory.id}` })).toBeInTheDocument()
  })

  it('calls onDelete with memory id when delete button clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<MemoryCard memory={memory} onDelete={onDelete} />)
    await user.click(screen.getByRole('button', { name: `Delete memory ${memory.id}` }))
    expect(onDelete).toHaveBeenCalledWith('mem-001')
  })

  it('renders formatted date', () => {
    render(<MemoryCard memory={memory} onDelete={vi.fn()} />)
    const date = new Date(memory.timestamp).toLocaleDateString()
    expect(screen.getByText(date)).toBeInTheDocument()
  })
})
