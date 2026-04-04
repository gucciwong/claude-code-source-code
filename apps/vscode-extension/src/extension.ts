import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { SovereignCompletionProvider } from './completionProvider'
import { createStatusBar } from './statusBar'
import { checkOllamaOnline, listModels } from './ollamaClient'
import { ChatViewProvider } from './chatViewProvider'
import { ChunkStore } from './rag/store'
import { Retriever } from './rag/retriever'
import { Indexer } from './rag/indexer'

const POLL_INTERVAL_MS = 30_000

export function activate(context: vscode.ExtensionContext): void {
  const statusBar = createStatusBar()
  statusBar.setLoading()

  // Set up RAG index if a workspace folder is open
  let retriever: Retriever | null = null
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
  if (workspaceRoot) {
    try {
      const dbDir = path.join(workspaceRoot, '.sovereign-code')
      fs.mkdirSync(dbDir, { recursive: true })
      const dbPath = path.join(dbDir, 'rag.db')
      const cfg = vscode.workspace.getConfiguration('sovereign-code')
      const ollamaUrl = cfg.get<string>('ollamaUrl', 'http://localhost:11434')
      const embeddingModel = cfg.get<string>('embeddingModel', 'nomic-embed-text')
      const store = new ChunkStore(dbPath)
      retriever = new Retriever(store, ollamaUrl ?? 'http://localhost:11434', embeddingModel ?? 'nomic-embed-text')
      const indexer = new Indexer(store, ollamaUrl ?? 'http://localhost:11434', embeddingModel ?? 'nomic-embed-text')
      indexer.start(workspaceRoot).then(() => {
        retriever?.setReady(true)
      }).catch(() => {
        // Index failed — completions work without RAG
      })
      context.subscriptions.push({ dispose: () => { retriever?.dispose(); indexer.stop(); store.dispose() } })
    } catch {
      vscode.window.showWarningMessage(
        'Sovereign Code: RAG features disabled — database initialization failed'
      )
      // retriever stays null, completions work without RAG
    }
  }

  // Register inline completion provider for all files
  const provider = new SovereignCompletionProvider(retriever)
  const providerDisposable = vscode.languages.registerInlineCompletionItemProvider(
    { pattern: '**' },
    provider,
  )
  context.subscriptions.push(providerDisposable)

  // Register toggle command
  const commandDisposable = vscode.commands.registerCommand(
    'sovereign-code.toggleCompletions',
    () => {
      const config = vscode.workspace.getConfiguration('sovereign-code')
      const current = config.get<boolean>('enabled', true)
      void config.update('enabled', !current, vscode.ConfigurationTarget.Global)
    },
  )
  context.subscriptions.push(commandDisposable)

  // Chat sidebar panel
  const chatProvider = new ChatViewProvider(context.extensionUri)
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, chatProvider)
  )

  // Model selection command
  context.subscriptions.push(
    vscode.commands.registerCommand('sovereign-code.selectModel', async () => {
      const config = vscode.workspace.getConfiguration('sovereign-code')
      const baseUrl = config.get<string>('ollamaUrl', 'http://localhost:11434')
      const models = await listModels(baseUrl)
      if (models.length === 0) {
        vscode.window.showWarningMessage('No models found. Is Ollama running?')
        return
      }
      const current = config.get<string>('model', 'qwen2.5-coder:7b')
      const picked = await vscode.window.showQuickPick(models, {
        placeHolder: `Current: ${current}`,
        title: 'Select Ollama Model',
      })
      if (picked) {
        await config.update('model', picked, vscode.ConfigurationTarget.Global)
        vscode.window.showInformationMessage(`Model set to ${picked}`)
      }
    })
  )

  // Push status bar disposal to subscriptions
  context.subscriptions.push({ dispose: () => statusBar.dispose() })

  // Online check + periodic polling
  async function checkOnline(): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('sovereign-code')
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

