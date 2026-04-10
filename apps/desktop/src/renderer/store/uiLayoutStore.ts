import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface UILayoutState {
  // Dimensions
  sidebarWidth: number
  voicePanelWidth: number
  modelParamsWidth: number
  downloadSidebarWidth: number
  commandPaletteWidth: number
  commandPaletteHeight: number
  // Setters
  setSidebarWidth: (width: number) => void
  setVoicePanelWidth: (width: number) => void
  setModelParamsWidth: (width: number) => void
  setDownloadSidebarWidth: (width: number) => void
  setCommandPaletteWidth: (width: number) => void
  setCommandPaletteHeight: (height: number) => void
  // Reset
  resetLayout: () => void
}

const DEFAULT_LAYOUT = {
  sidebarWidth: 220,
  voicePanelWidth: 280,
  modelParamsWidth: 320,
  downloadSidebarWidth: 280,
  commandPaletteWidth: 640,
  commandPaletteHeight: 480,
}

export const useUILayoutStore = create<UILayoutState>()(
  persist(
    (set) => ({
      ...DEFAULT_LAYOUT,

      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      setVoicePanelWidth: (width) => set({ voicePanelWidth: width }),
      setModelParamsWidth: (width) => set({ modelParamsWidth: width }),
      setDownloadSidebarWidth: (width) => set({ downloadSidebarWidth: width }),
      setCommandPaletteWidth: (width) => set({ commandPaletteWidth: width }),
      setCommandPaletteHeight: (height) => set({ commandPaletteHeight: height }),

      resetLayout: () => set(DEFAULT_LAYOUT),
    }),
    {
      name: 'sovereign-ui-layout',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
        voicePanelWidth: state.voicePanelWidth,
        modelParamsWidth: state.modelParamsWidth,
        downloadSidebarWidth: state.downloadSidebarWidth,
        commandPaletteWidth: state.commandPaletteWidth,
        commandPaletteHeight: state.commandPaletteHeight,
      }),
    }
  )
)
