import { describe, it, expect, beforeEach } from 'vitest'
import { usePluginStore } from './pluginStore'
import type { PluginManifest } from '../../shared/pluginSystem'

const SAMPLE_PLUGIN: PluginManifest = {
  id: 'test-plugin',
  name: 'Test Plugin',
  version: '1.0.0',
  description: 'A test plugin',
  author: 'Tester',
  hooks: ['on_startup'],
  enabled: true,
}

describe('pluginStore', () => {
  beforeEach(() => {
    usePluginStore.setState({
      plugins: [],
      isLoading: false,
      error: null,
    })
  })

  it('initial state: empty plugins, false isLoading, null error', () => {
    const state = usePluginStore.getState()
    expect(state.plugins).toEqual([])
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('setPlugins replaces plugins array', () => {
    const { setPlugins } = usePluginStore.getState()
    setPlugins([SAMPLE_PLUGIN])
    expect(usePluginStore.getState().plugins).toEqual([SAMPLE_PLUGIN])
  })

  it('addPlugin appends plugin', () => {
    const { addPlugin } = usePluginStore.getState()
    addPlugin(SAMPLE_PLUGIN)
    expect(usePluginStore.getState().plugins).toHaveLength(1)
    expect(usePluginStore.getState().plugins[0].id).toBe('test-plugin')
  })

  it('removePlugin deletes by id', () => {
    usePluginStore.setState({ plugins: [SAMPLE_PLUGIN] })
    const { removePlugin } = usePluginStore.getState()
    removePlugin('test-plugin')
    expect(usePluginStore.getState().plugins).toHaveLength(0)
  })

  it('setEnabled(id, false) turns enabled off', () => {
    usePluginStore.setState({ plugins: [SAMPLE_PLUGIN] })
    const { setEnabled } = usePluginStore.getState()
    setEnabled('test-plugin', false)
    expect(usePluginStore.getState().plugins[0].enabled).toBe(false)
  })

  it('setEnabled(id, true) turns enabled on', () => {
    usePluginStore.setState({ plugins: [{ ...SAMPLE_PLUGIN, enabled: false }] })
    const { setEnabled } = usePluginStore.getState()
    setEnabled('test-plugin', true)
    expect(usePluginStore.getState().plugins[0].enabled).toBe(true)
  })

  it('setLoading updates isLoading', () => {
    const { setLoading } = usePluginStore.getState()
    setLoading(true)
    expect(usePluginStore.getState().isLoading).toBe(true)
  })

  it('setError updates error', () => {
    const { setError } = usePluginStore.getState()
    setError('something went wrong')
    expect(usePluginStore.getState().error).toBe('something went wrong')
  })
})
