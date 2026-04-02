import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KnowledgeCard } from './KnowledgeCard'
import type { Snippet } from '../../store/knowledgeLibraryStore'
import { vi } from 'vitest'

const snippet: Snippet = {
  id: 'test-1',
  text: 'function greet() { return "hello" }',
  language: 'typescript',
  domain: 'utils',
  qualityScore: 0.85,
  usageCount: 3,
  createdAt: new Date('2026-01-15').getTime(),
  updatedAt: new Date('2026-01-15').getTime(),
  tags: ['greeting'],
  rejected: false,
}

test('renders snippet language', () => {
  render(<KnowledgeCard snippet={snippet} />)
  expect(screen.getByText('typescript')).toBeInTheDocument()
})

test('renders snippet domain', () => {
  render(<KnowledgeCard snippet={snippet} />)
  expect(screen.getByText('utils')).toBeInTheDocument()
})

test('renders snippet content', () => {
  render(<KnowledgeCard snippet={snippet} />)
  expect(screen.getByText(/function greet/i)).toBeInTheDocument()
})

test('renders quality score', () => {
  render(<KnowledgeCard snippet={snippet} />)
  expect(screen.getByText('85%')).toBeInTheDocument()
})

test('delete button not shown when onDelete not provided', () => {
  render(<KnowledgeCard snippet={snippet} />)
  expect(screen.queryByRole('button', { name: /delete snippet/i })).not.toBeInTheDocument()
})

test('delete button shown when onDelete provided', () => {
  render(<KnowledgeCard snippet={snippet} onDelete={vi.fn()} />)
  expect(screen.getByRole('button', { name: /delete snippet/i })).toBeInTheDocument()
})

test('clicking delete calls onDelete with snippet id', async () => {
  const onDelete = vi.fn()
  const user = userEvent.setup()
  render(<KnowledgeCard snippet={snippet} onDelete={onDelete} />)
  await user.click(screen.getByRole('button', { name: /delete snippet/i }))
  expect(onDelete).toHaveBeenCalledWith('test-1')
})

test('content element has max-h class to truncate visually', () => {
  render(<KnowledgeCard snippet={snippet} />)
  const pre = screen.getByText(/function greet/i)
  expect(pre.className).toContain('max-h')
})
