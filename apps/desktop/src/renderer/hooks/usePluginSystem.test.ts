import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePluginSystem } from './usePluginSystem'
import { usePluginStore } from '../store/pluginStore'
import type { PluginManifest } from '../../shared/pluginSystem'

const SAMPLE_PLUGIN: PluginManifest = {
  id: 'hook-test-plugin',
  name: 'Hook Test Plugin',
  version: '1.0.0',
  description: 'Plugin for hook testing',
  author: 'Tester',
  hooks: ['on_startup'],
  enabled: true,
}

describe('usePluginSystem', () => {
  beforeEach(() => {
    usePluginStore.setState({ plugins: [], isLoading: false, error: null })
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('fetchPlugins calls GET /plugins and calls setPlugins', async () => {
    const mockPlugins = [SAMPLE_PLUGIN]
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlugins,
    } as Response)

    const { result } = renderHook(() => usePluginSystem())
    await act(async () => {
      await result.current.fetchPlugins()
    })

    expect(fetch).toHaveBeenCalledWith('http://localhost:8015/plugins')
    expect(usePluginStore.getState().plugins).toEqual(mockPlugins)
  })

  it('fetchPlugins returns empty array when fetch throws', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => usePluginSystem())
    let returned: PluginManifest[] = []
    await act(async () => {
      returned = await result.current.fetchPlugins()
    })

    expect(returned).toEqual([])
  })

  it('registerPlugin POSTs to /plugins/register and returns true on 200', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', plugin_id: SAMPLE_PLUGIN.id }),
    } as Response)

    const { result } = renderHook(() => usePluginSystem())
    let success = false
    await act(async () => {
      success = await result.current.registerPlugin(SAMPLE_PLUGIN)
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8015/plugins/register',
      expect.objectContaining({ method: 'POST' })
    )
    expect(success).toBe(true)
  })

  it('registerPlugin returns false on error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => usePluginSystem())
    let success = true
    await act(async () => {
      success = await result.current.registerPlugin(SAMPLE_PLUGIN)
    })

    expect(success).toBe(false)
  })

  it('unregisterPlugin sends DELETE to /plugins/{id}', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }),
    } as Response)

    const { result } = renderHook(() => usePluginSystem())
    await act(async () => {
      await result.current.unregisterPlugin('hook-test-plugin')
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8015/plugins/hook-test-plugin',
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('togglePlugin sends PUT to /plugins/{id}/enable when enabled=true', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }),
    } as Response)

    const { result } = renderHook(() => usePluginSystem())
    await act(async () => {
      await result.current.togglePlugin('hook-test-plugin', true)
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8015/plugins/hook-test-plugin/enable',
      expect.objectContaining({ method: 'PUT' })
    )
  })

  it('togglePlugin sends PUT to /plugins/{id}/disable when enabled=false', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }),
    } as Response)

    const { result } = renderHook(() => usePluginSystem())
    await act(async () => {
      await result.current.togglePlugin('hook-test-plugin', false)
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8015/plugins/hook-test-plugin/disable',
      expect.objectContaining({ method: 'PUT' })
    )
  })

  it('dispatchHook POSTs to /hooks/dispatch and returns handled_by array', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', hook: 'on_startup', handled_by: ['plugin-a'] }),
    } as Response)

    const { result } = renderHook(() => usePluginSystem())
    let handledBy: string[] = []
    await act(async () => {
      handledBy = await result.current.dispatchHook({ hook: 'on_startup', payload: {} })
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8015/hooks/dispatch',
      expect.objectContaining({ method: 'POST' })
    )
    expect(handledBy).toEqual(['plugin-a'])
  })
})
