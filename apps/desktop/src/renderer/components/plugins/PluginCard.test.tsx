import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PluginCard } from './PluginCard'
import type { PluginManifest } from '../../../shared/pluginSystem'

const fixture: PluginManifest = {
  id: 'plugin-abc',
  name: 'My Plugin',
  version: '1.2.0',
  description: 'Does cool things',
  author: 'Alice',
  hooks: ['on_startup', 'on_chat_message'],
  enabled: true,
}

describe('PluginCard', () => {
  it('renders plugin name', () => {
    render(<PluginCard plugin={fixture} onToggle={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText('My Plugin')).toBeInTheDocument()
  })

  it('renders plugin version', () => {
    render(<PluginCard plugin={fixture} onToggle={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText('1.2.0')).toBeInTheDocument()
  })

  it('renders plugin description', () => {
    render(<PluginCard plugin={fixture} onToggle={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText('Does cool things')).toBeInTheDocument()
  })

  it('renders plugin author', () => {
    render(<PluginCard plugin={fixture} onToggle={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText('by Alice')).toBeInTheDocument()
  })

  it('renders hook tags', () => {
    render(<PluginCard plugin={fixture} onToggle={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText('on_startup')).toBeInTheDocument()
    expect(screen.getByText('on_chat_message')).toBeInTheDocument()
  })

  it('toggle button has correct aria-label when enabled', () => {
    render(<PluginCard plugin={fixture} onToggle={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Disable My Plugin' })).toBeInTheDocument()
  })

  it('toggle button has correct aria-label when disabled', () => {
    const disabled = { ...fixture, enabled: false }
    render(<PluginCard plugin={disabled} onToggle={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Enable My Plugin' })).toBeInTheDocument()
  })

  it('calls onToggle with id and new enabled state', async () => {
    const onToggle = vi.fn()
    render(<PluginCard plugin={fixture} onToggle={onToggle} onRemove={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Disable My Plugin' }))
    expect(onToggle).toHaveBeenCalledWith('plugin-abc', false)
  })

  it('calls onRemove with plugin id', async () => {
    const onRemove = vi.fn()
    render(<PluginCard plugin={fixture} onToggle={vi.fn()} onRemove={onRemove} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove My Plugin' }))
    expect(onRemove).toHaveBeenCalledWith('plugin-abc')
  })
})
