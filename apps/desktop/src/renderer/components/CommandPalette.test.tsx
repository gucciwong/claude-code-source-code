import { render, screen } from '@testing-library/react'
import { CommandPalette } from './CommandPalette'
import { useCommandPaletteStore } from '../store/commandPaletteStore'
import { useModelsStore } from '../store/modelsStore'

beforeEach(() => {
  useCommandPaletteStore.setState({ open: false })
  useModelsStore.setState({ installed: [], selected: null })
})

test('CommandPalette renders nothing when closed', () => {
  render(<CommandPalette />)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('CommandPalette opens when store state is true', () => {
  render(<CommandPalette />)
  useCommandPaletteStore.setState({ open: true })
  // Re-render
  const { rerender } = render(<CommandPalette />)
  useCommandPaletteStore.setState({ open: true })
  rerender(<CommandPalette />)
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})

test('CommandPalette has search input when open', () => {
  useCommandPaletteStore.setState({ open: true })
  render(<CommandPalette />)
  expect(screen.getByPlaceholderText(/Type a model name or command/i)).toBeInTheDocument()
})

test('CommandPalette shows installed models when open', () => {
  useModelsStore.setState({
    installed: [
      { name: 'qwen2.5-coder:32b', size: 20_000_000_000, digest: 'abc', modified_at: '2026-01-01' },
    ],
    selected: null,
  })
  useCommandPaletteStore.setState({ open: true })
  render(<CommandPalette />)
  expect(screen.getByText('qwen2.5-coder:32b')).toBeInTheDocument()
})
