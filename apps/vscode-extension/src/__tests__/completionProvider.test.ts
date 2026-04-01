import * as vscode from 'vscode'
import { SovereignCompletionProvider } from '../completionProvider'
import * as ollamaClient from '../ollamaClient'
import type { Retriever } from '../rag/retriever'

vi.mock('../ollamaClient')

// Helper: build a minimal mock TextDocument
function makeDoc(text: string): vscode.TextDocument {
  return {
    getText: (_range?: unknown) => text,
    languageId: 'typescript',
    uri: { scheme: 'file' },
  } as unknown as vscode.TextDocument
}

function makePos(line: number, char: number): vscode.Position {
  return new vscode.Position(line, char)
}

const liveToken = { isCancellationRequested: false, onCancellationRequested: undefined } as unknown as vscode.CancellationToken
const deadToken = { isCancellationRequested: true, onCancellationRequested: undefined } as unknown as vscode.CancellationToken

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
    get: vi.fn().mockImplementation((key: string) => {
      const cfg: Record<string, unknown> = {
        enabled: true,
        ollamaUrl: 'http://localhost:11434',
        model: 'qwen2.5-coder:7b',
        maxTokens: 64,
        triggerOnTyping: true,
      }
      return cfg[key]
    }),
  } as unknown as vscode.WorkspaceConfiguration)
  vi.mocked(ollamaClient.getCompletion).mockResolvedValue('  return x + 1;')
})

const provider = new SovereignCompletionProvider()
const ctx = { triggerKind: vscode.InlineCompletionTriggerKind.Automatic } as vscode.InlineCompletionContext

test('returns InlineCompletionItem when getCompletion returns text', async () => {
  const doc = makeDoc('function add(x) {\n')
  const pos = makePos(1, 0)
  const result = await provider.provideInlineCompletionItems(doc, pos, ctx, liveToken)
  expect(result).toBeInstanceOf(Array)
  const items = result as vscode.InlineCompletionItem[]
  expect(items).toHaveLength(1)
  expect(items[0].insertText).toBe('  return x + 1;')
})

test('returns [] when enabled is false', async () => {
  vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
    get: vi.fn().mockReturnValue(false),
  } as unknown as vscode.WorkspaceConfiguration)
  const result = await provider.provideInlineCompletionItems(makeDoc('const x = '), makePos(0, 10), ctx, liveToken)
  expect(result).toEqual([])
  expect(ollamaClient.getCompletion).not.toHaveBeenCalled()
})

test('returns [] when cancellation requested before fetch', async () => {
  const result = await provider.provideInlineCompletionItems(makeDoc('const '), makePos(0, 6), ctx, deadToken)
  expect(result).toEqual([])
  expect(ollamaClient.getCompletion).not.toHaveBeenCalled()
})

test('returns [] when getCompletion returns empty string', async () => {
  vi.mocked(ollamaClient.getCompletion).mockResolvedValue('')
  const result = await provider.provideInlineCompletionItems(makeDoc('function foo() {'), makePos(0, 16), ctx, liveToken)
  expect(result).toEqual([])
})

test('does not trigger on Automatic when triggerOnTyping is false', async () => {
  vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
    get: vi.fn().mockImplementation((key: string) => {
      if (key === 'triggerOnTyping') return false
      if (key === 'enabled') return true
      return undefined
    }),
  } as unknown as vscode.WorkspaceConfiguration)
  const result = await provider.provideInlineCompletionItems(
    makeDoc('const x = '),
    makePos(0, 10),
    { triggerKind: vscode.InlineCompletionTriggerKind.Automatic } as vscode.InlineCompletionContext,
    liveToken,
  )
  expect(result).toEqual([])
})

test('passes correct params to getCompletion', async () => {
  const doc = makeDoc('const greeting = ')
  await provider.provideInlineCompletionItems(doc, makePos(0, 18), ctx, liveToken)
  expect(ollamaClient.getCompletion).toHaveBeenCalledWith(
    'http://localhost:11434',
    'qwen2.5-coder:7b',
    expect.stringContaining('const greeting = '),
    64,
    expect.any(AbortSignal),
  )
})

describe('RAG context injection', () => {
  test('prepends retrieved context when ragEnabled is true', async () => {
    const mockChunk = { filePath: 'src/foo.ts', startLine: 1, endLine: 5, content: 'const x = 1' }
    const mockRetriever = {
      query: vi.fn().mockResolvedValue([mockChunk]),
    } as unknown as Retriever
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn().mockImplementation((key: string) => {
        const cfg: Record<string, unknown> = {
          enabled: true,
          ollamaUrl: 'http://localhost:11434',
          model: 'qwen2.5-coder:7b',
          maxTokens: 64,
          triggerOnTyping: true,
          ragEnabled: true,
          ragTopK: 3,
          ragMaxContextChars: 2000,
        }
        return cfg[key]
      }),
    } as unknown as vscode.WorkspaceConfiguration)
    const ragProvider = new SovereignCompletionProvider(mockRetriever)
    const doc = makeDoc('const greeting = ')
    await ragProvider.provideInlineCompletionItems(doc, makePos(0, 18), ctx, liveToken)
    expect(mockRetriever.query).toHaveBeenCalled()
    expect(ollamaClient.getCompletion).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.stringContaining('// Context from workspace:'),
      expect.any(Number),
      expect.any(AbortSignal),
    )
  })

  test('skips RAG when ragEnabled is false', async () => {
    const mockRetriever = {
      query: vi.fn().mockResolvedValue([]),
    } as unknown as Retriever
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn().mockImplementation((key: string) => {
        const cfg: Record<string, unknown> = {
          enabled: true,
          ollamaUrl: 'http://localhost:11434',
          model: 'qwen2.5-coder:7b',
          maxTokens: 64,
          triggerOnTyping: true,
          ragEnabled: false,
        }
        return cfg[key]
      }),
    } as unknown as vscode.WorkspaceConfiguration)
    const ragProvider = new SovereignCompletionProvider(mockRetriever)
    const doc = makeDoc('const x = ')
    await ragProvider.provideInlineCompletionItems(doc, makePos(0, 10), ctx, liveToken)
    expect(mockRetriever.query).not.toHaveBeenCalled()
  })

  test('completion still works when retriever is null', async () => {
    const nullProvider = new SovereignCompletionProvider(null)
    const doc = makeDoc('const x = ')
    const result = await nullProvider.provideInlineCompletionItems(doc, makePos(0, 10), ctx, liveToken)
    expect(result).toBeInstanceOf(Array)
    expect((result as vscode.InlineCompletionItem[]).length).toBe(1)
  })
})

