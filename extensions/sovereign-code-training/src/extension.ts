import * as vscode from 'vscode'
import { getTrainingClient, CompletionEvent } from './services/trainingClient'

let trainingEnabled = true
let trainingStatusItem: vscode.StatusBarItem
let serviceHealthy = false

export async function activate(context: vscode.ExtensionContext) {
  console.log('Sovereign Coder Training extension activated')

  const client = getTrainingClient()

  // Initialize status bar
  trainingStatusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  trainingStatusItem.command = 'sovereignCoder.training.openDashboard'
  updateStatusBar()
  context.subscriptions.push(trainingStatusItem)

  // Check service health on startup
  await checkServiceHealth()

  // Register commands
  const toggleCommand = vscode.commands.registerCommand('sovereignCoder.training.toggleLogging', () => {
    trainingEnabled = !trainingEnabled
    vscode.window.showInformationMessage(
      `Training logging ${trainingEnabled ? 'enabled' : 'disabled'}`
    )
    updateStatusBar()
  })
  context.subscriptions.push(toggleCommand)

  const dashboardCommand = vscode.commands.registerCommand('sovereignCoder.training.openDashboard', async () => {
    const stats = await client.getStats()
    if (!stats) {
      vscode.window.showErrorMessage('Training service unavailable. Verify it\'s running on http://localhost:8001')
      return
    }

    const message = `
    Total events: ${stats.total_events}
    Accepted: ${stats.completion_accepted}
    Rejected: ${stats.completion_rejected}
    Edited: ${stats.completion_edited}
    `
    vscode.window.showInformationMessage(message)
  })
  context.subscriptions.push(dashboardCommand)

  // Hook into inline completion provider
  const completionProvider = vscode.languages.registerInlineCompletionItemProvider(
    { pattern: '**' },
    {
      async provideInlineCompletionItems(document, position, context, token) {
        return undefined // Let other providers handle actual completions
      },
    }
  )
  context.subscriptions.push(completionProvider)

  // Monitor text edits to detect completion acceptance
  const textChangeListener = vscode.workspace.onDidChangeTextDocument(async (event) => {
    if (!trainingEnabled || !serviceHealthy) return

    const document = event.document
    const changes = event.contentChanges

    for (const change of changes) {
      const text = change.text
      // Detect if this looks like a code completion (sudden text addition)
      if (text.length > 5 && !text.includes('\n')) {
        // Potential completion accepted
        const editor = vscode.window.activeTextEditor
        if (!editor || editor.document !== document) continue

        const line = document.lineAt(document.offsetAt(change.range.start)).text
        const language = document.languageId

        // Extract context (previous 2 lines for prompt)
        const lineNumber = document.offsetAt(change.range.start)
        const startPos = Math.max(0, lineNumber - 200)
        const endPos = Math.min(document.getText().length, lineNumber)
        const context = document.getText(new vscode.Range(
          document.positionAt(startPos),
          document.positionAt(endPos)
        ))

        // Log to training service (fire and forget)
        const event: CompletionEvent = {
          prompt: context,
          completion: text,
          event_type: 'completion_accepted',
          language: language,
          file_path: document.uri.fsPath,
          line_number: document.offsetAt(change.range.start),
        }

        try {
          await client.logCompletionEvent(event)
          updateCompletionCount()
        } catch (error) {
          // Silently fail - never interrupt user workflow
        }
      }
    }
  })
  context.subscriptions.push(textChangeListener)

  // Periodic health check (every 30 seconds)
  setInterval(async () => {
    await checkServiceHealth()
  }, 30000)
}

async function checkServiceHealth(): Promise<void> {
  const client = getTrainingClient()
  const healthy = await client.healthCheck()
  serviceHealthy = healthy
  updateStatusBar()
}

function updateStatusBar(): void {
  if (!trainingStatusItem) return

  if (!trainingEnabled) {
    trainingStatusItem.text = '$(debug-pause) Training: OFF'
    trainingStatusItem.tooltip = 'Training logging disabled. Click to enable.'
    trainingStatusItem.color = '#999999'
  } else if (serviceHealthy) {
    trainingStatusItem.text = '$(record) Training: ON'
    trainingStatusItem.tooltip = 'Training logging active. Click to view stats.'
    trainingStatusItem.color = '#4EC9B0'
  } else {
    trainingStatusItem.text = '$(warning) Training: OFFLINE'
    trainingStatusItem.tooltip = 'Training service offline. Check localhost:8001'
    trainingStatusItem.color = '#F48771'
  }

  trainingStatusItem.show()
}

async function updateCompletionCount(): Promise<void> {
  const client = getTrainingClient()
  const stats = await client.getStats()
  if (stats && trainingStatusItem) {
    trainingStatusItem.text = `$(record) Training: ON (${stats.total_events})`
  }
}

export function deactivate() {
  console.log('Sovereign Coder Training extension deactivated')
}
