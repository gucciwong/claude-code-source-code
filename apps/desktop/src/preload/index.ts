import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Use `exposeInMainWorld` APIs to add methods or properties to `window` object
// These are available to the renderer process and can be used to communicate with the main process.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
  } catch (error) {
    console.error(error)
  }
}
