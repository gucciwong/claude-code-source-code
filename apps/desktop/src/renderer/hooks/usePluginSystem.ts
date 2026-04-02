import { useCallback } from 'react'
import { usePluginStore } from '../store/pluginStore'
import type { PluginManifest, HookEvent } from '../../shared/pluginSystem'

const BASE_URL = 'http://localhost:8012'

export function usePluginSystem() {
  const { setPlugins, addPlugin, removePlugin, setEnabled, setLoading, setError } = usePluginStore()

  const fetchPlugins = useCallback(async (): Promise<PluginManifest[]> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/plugins`)
      if (!res.ok) throw new Error('Failed to fetch plugins')
      const data: PluginManifest[] = await res.json()
      setPlugins(data)
      return data
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
      return []
    } finally {
      setLoading(false)
    }
  }, [setPlugins, setLoading, setError])

  const registerPlugin = useCallback(async (manifest: PluginManifest): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/plugins/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manifest),
      })
      if (res.ok) addPlugin(manifest)
      return res.ok
    } catch {
      return false
    }
  }, [addPlugin])

  const unregisterPlugin = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/plugins/${id}`, { method: 'DELETE' })
      if (res.ok) removePlugin(id)
      return res.ok
    } catch {
      return false
    }
  }, [removePlugin])

  const togglePlugin = useCallback(async (id: string, enabled: boolean): Promise<boolean> => {
    const endpoint = enabled ? 'enable' : 'disable'
    try {
      const res = await fetch(`${BASE_URL}/plugins/${id}/${endpoint}`, { method: 'PUT' })
      if (res.ok) setEnabled(id, enabled)
      return res.ok
    } catch {
      return false
    }
  }, [setEnabled])

  const dispatchHook = useCallback(async (event: HookEvent): Promise<string[]> => {
    try {
      const res = await fetch(`${BASE_URL}/hooks/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })
      if (!res.ok) return []
      const data = await res.json()
      return data.handled_by ?? []
    } catch {
      return []
    }
  }, [])

  return { fetchPlugins, registerPlugin, unregisterPlugin, togglePlugin, dispatchHook }
}
