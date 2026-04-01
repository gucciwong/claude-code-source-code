import * as vscode from 'vscode'

export interface SovereignStatusBar {
  setOnline: (model: string) => void
  setOffline: () => void
  setLoading: () => void
  dispose: () => void
}

export function createStatusBar(): SovereignStatusBar {
  const item = vscode.window.createStatusBarItem(
    'sovereign-coder',
    vscode.StatusBarAlignment.Right,
    100,
  )
  item.command = 'sovereign-coder.toggleCompletions'
  item.show()

  return {
    setOnline(model: string) {
      item.text = `$(sparkle) ${model}`
      item.tooltip = `Sovereign Coder: Active — ${model}`
    },
    setOffline() {
      item.text = '$(warning) Sovereign Offline'
      item.tooltip = 'Sovereign Coder: Ollama not reachable'
    },
    setLoading() {
      item.text = '$(loading~spin) Sovereign'
      item.tooltip = 'Sovereign Coder: Connecting…'
    },
    dispose() {
      item.dispose()
    },
  }
}
