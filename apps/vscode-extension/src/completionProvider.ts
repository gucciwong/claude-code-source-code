import * as vscode from 'vscode'
import { getCompletion } from './ollamaClient'
import type { Retriever } from './rag/retriever'

const MAX_PREFIX_CHARS = 2000
const RAG_QUERY_CHARS = 300

export class SovereignCompletionProvider implements vscode.InlineCompletionItemProvider {
  constructor(private readonly retriever: Retriever | null = null) {}

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken,
  ): Promise<vscode.InlineCompletionItem[] | vscode.InlineCompletionList> {
    const config = vscode.workspace.getConfiguration('sovereign-code')
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
    const ragEnabled = config.get<boolean>('ragEnabled', false)
    const ragTopK = config.get<number>('ragTopK', 5)
    const ragMaxContextChars = config.get<number>('ragMaxContextChars', 2000)

    const prefix = document
      .getText(new vscode.Range(new vscode.Position(0, 0), position))
      .slice(-MAX_PREFIX_CHARS)

    let contextBlock = ''
    if (ragEnabled && this.retriever) {
      const chunks = await this.retriever.query(prefix.slice(-RAG_QUERY_CHARS), ragTopK ?? 5)
      if (chunks.length > 0) {
        const parts = chunks.map(c => `// ${c.filePath}:${c.startLine}-${c.endLine}\n${c.content}`)
        contextBlock = `// Context from workspace:\n${parts.join('\n\n')}\n\n`.slice(
          0,
          ragMaxContextChars ?? 2000,
        )
      }
    }

    const abortController = new AbortController()
    const cancelListener = token.onCancellationRequested?.(() => abortController.abort())

    try {
      const text = await getCompletion(
        ollamaUrl,
        model,
        contextBlock + prefix,
        maxTokens,
        abortController.signal,
      )

      if (token.isCancellationRequested || !text) return []

      return [new vscode.InlineCompletionItem(text)]
    } finally {
      cancelListener?.dispose()
    }
  }
}
