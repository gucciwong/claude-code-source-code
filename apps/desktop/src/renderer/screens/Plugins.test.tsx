import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { Plugins } from './Plugins'
import { usePluginStore } from '../store/pluginStore'
import type { PluginManifest } from '../../shared/pluginSystem'

vi.mock('../hooks/usePluginSystem', () => ({
  usePluginSystem: () => ({
    fetchPlugins: vi.fn().mockResolvedValue([]),
    registerPlugin: vi.fn().mockResolvedValue(true),
    unregisterPlugin: vi.fn().mockResolvedValue(true),
    togglePlugin: vi.fn().mockResolvedValue(true),
    dispatchHook: vi.fn().mockResolvedValue([]),
  }),
}))

const SAMPLE_PLUGIN: PluginManifest = {
  id: 'test-plugin',
  name: 'Test Plugin',
  version: '1.0.0',
  description: 'A test plugin',
  author: 'Tester',
  hooks: ['on_startup'],
  enabled: true,
}

describe('Plugins screen', () => {
  beforeEach(() => {
    usePluginStore.setState({
      plugins: [],
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders heading "Plugin Extension System"', () => {
    render(<Plugins />)
    expect(screen.getByText('Plugin Extension System')).toBeInTheDocument()
  })

  it('renders tabs: Installed, Hooks, Guide', () => {
    render(<Plugins />)
    expect(screen.getByText(/Installed/)).toBeInTheDocument()
    expect(screen.getByText('Hooks')).toBeInTheDocument()
    expect(screen.getByText('Guide')).toBeInTheDocument()
  })

  it('renders refresh button', () => {
    render(<Plugins />)
    expect(screen.getByRole('button', { name: /refresh plugins/i })).toBeInTheDocument()
  })

  it('shows empty state message when no plugins', () => {
    render(<Plugins />)
    expect(screen.getByText(/no plugins installed/i)).toBeInTheDocument()
  })

  it('renders plugin count in Installed tab label', () => {
    usePluginStore.setState({ plugins: [SAMPLE_PLUGIN] })
    render(<Plugins />)
    expect(screen.getByText('Installed (1)')).toBeInTheDocument()
  })

  it('shows PluginCard when plugins exist', () => {
    usePluginStore.setState({ plugins: [SAMPLE_PLUGIN] })
    render(<Plugins />)
    expect(screen.getByText('Test Plugin')).toBeInTheDocument()
    expect(screen.getByText('A test plugin')).toBeInTheDocument()
  })

  it('renders HooksList in Hooks tab', async () => {
    render(<Plugins />)
    const hooksTab = screen.getByRole('tab', { name: /hooks/i })
    await userEvent.click(hooksTab)
    expect(screen.getByText('Available Hooks')).toBeInTheDocument()
  })
})
