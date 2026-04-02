import { create } from 'zustand'
import type { PluginManifest } from '../../shared/pluginSystem'

interface PluginStore {
  plugins: PluginManifest[]
  isLoading: boolean
  error: string | null
  setPlugins: (plugins: PluginManifest[]) => void
  addPlugin: (plugin: PluginManifest) => void
  removePlugin: (id: string) => void
  setEnabled: (id: string, enabled: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const usePluginStore = create<PluginStore>(set => ({
  plugins: [],
  isLoading: false,
  error: null,
  setPlugins: plugins => set({ plugins }),
  addPlugin: plugin => set(state => ({ plugins: [...state.plugins, plugin] })),
  removePlugin: id => set(state => ({ plugins: state.plugins.filter(p => p.id !== id) })),
  setEnabled: (id, enabled) => set(state => ({
    plugins: state.plugins.map(p => p.id === id ? { ...p, enabled } : p),
  })),
  setLoading: isLoading => set({ isLoading }),
  setError: error => set({ error }),
}))
