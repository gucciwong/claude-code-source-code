import * as vscode from 'vscode'
import { SovereignCompletionProvider } from './completionProvider'
import { createStatusBar } from './statusBar'
import { checkOllamaOnline } from './ollamaClient'

const POLL_INTERVAL_MS = 30_000

export function activate(context: vscode.ExtensionContext): void {
  const statusBar = createStatusBar()
  statusBar.setLoading()

  // Register inline completion provider for all files
  const provider = new SovereignCompletionProvider()
  const providerDisposable = vscode.languages.registerInlineCompletionItemProvider(
    { pattern: '**' },
    provider,
  )
  context.subscriptions.push(providerDisposable)

  // Register toggle command
  const commandDisposable = vscode.commands.registerCommand(
    'sovereign-coder.toggleCompletions',
    () => {
      const config = vscode.workspace.getConfiguration('sovereign-coder')
      const current = config.get<boolean>('enabled', true)
      void config.update('enabled', !current, vscode.ConfigurationTarget.Global)
    },
  )
  context.subscriptions.push(commandDisposable)

  // Push status bar disposal to subscriptions
  context.subscriptions.push({ dispose: () => statusBar.dispose() })

  // Online check + periodic polling
  async function checkOnline(): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('sovereign-coder')
    const url = cfg.get<string>('ollamaUrl', 'http://localhost:11434')
    const model = cfg.get<string>('model', 'qwen2.5-coder:7b')
    const online = await checkOllamaOnline(url)
    if (online) {
      statusBar.setOnline(model)
    } else {
      statusBar.setOffline()
    }
  }

  void checkOnline()

  const pollingInterval = setInterval(() => void checkOnline(), POLL_INTERVAL_MS)
  context.subscriptions.push({ dispose: () => clearInterval(pollingInterval) })
}

export function deactivate(): void {
  // All cleanup handled by context.subscriptions
}
