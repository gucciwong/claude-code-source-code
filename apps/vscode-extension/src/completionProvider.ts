import * as vscode from 'vscode'
import { getCompletion } from './ollamaClient'

const MAX_PREFIX_CHARS = 2000

export class SovereignCompletionProvider implements vscode.InlineCompletionItemProvider {
  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken,
  ): Promise<vscode.InlineCompletionItem[] | vscode.InlineCompletionList> {
    const config = vscode.workspace.getConfiguration('sovereign-coder')
    const enabled = config.get<boolean>('enabled', true)
    const triggerOnTyping = config.get<boolean>('triggerOnTyping', true)

    if (!enabled) return []

    if (
      context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic &&
      !triggerOnTyping
    ) {
      return []
    }

    if (token.isCancellationRequested) return []

    const ollamaUrl = config.get<string>('ollamaUrl', 'http://localhost:11434')
    const model = config.get<string>('model', 'qwen2.5-coder:7b')
    const maxTokens = config.get<number>('maxTokens', 128)

    const prefix = document
      .getText(new vscode.Range(new vscode.Position(0, 0), position))
      .slice(-MAX_PREFIX_CHARS)

    const abortController = new AbortController()
    const cancelListener = token.onCancellationRequested?.(() => abortController.abort())

    try {
      const text = await getCompletion(ollamaUrl, model, prefix, maxTokens, abortController.signal)

      if (token.isCancellationRequested || !text) return []

      return [new vscode.InlineCompletionItem(text)]
    } finally {
      cancelListener?.dispose()
    }
  }
}
