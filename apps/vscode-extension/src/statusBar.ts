import * as vscode from 'vscode'

export interface SovereignStatusBar {
  setOnline: (model: string) => void
  setOffline: () => void
  setLoading: () => void
  dispose: () => void
}

export function createStatusBar(): SovereignStatusBar {
  const item = vscode.window.createStatusBarItem(
    'sovereign-code',
    vscode.StatusBarAlignment.Right,
    100,
  )
  item.command = 'sovereign-code.toggleCompletions'
  item.show()

  return {
    setOnline(model: string) {
      item.text = `$(sparkle) ${model}`
      item.tooltip = `Sovereign Code: Active — ${model}`
    },
    setOffline() {
      item.text = '$(warning) Sovereign Offline'
      item.tooltip = 'Sovereign Code: Ollama not reachable'
    },
    setLoading() {
      item.text = '$(loading~spin) Sovereign'
      item.tooltip = 'Sovereign Code: Connecting…'
    },
    dispose() {
      item.dispose()
    },
  }
}
