import * as vscode from 'vscode'
import { activate, deactivate } from '../extension'
import * as statusBarModule from '../statusBar'
import * as ollamaClient from '../ollamaClient'

vi.mock('../statusBar')
vi.mock('../ollamaClient')

function makeContext(): vscode.ExtensionContext {
  return {
    subscriptions: [],
  } as unknown as vscode.ExtensionContext
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(ollamaClient.checkOllamaOnline).mockResolvedValue(true)
  vi.mocked(statusBarModule.createStatusBar).mockReturnValue({
    setOnline: vi.fn(),
    setOffline: vi.fn(),
    setLoading: vi.fn(),
    dispose: vi.fn(),
  })
  vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
    get: vi.fn().mockImplementation((key: string) => {
      if (key === 'model') return 'qwen2.5-coder:7b'
      if (key === 'ollamaUrl') return 'http://localhost:11434'
      return undefined
    }),
    update: vi.fn(),
  } as unknown as vscode.WorkspaceConfiguration)
})

test('activate registers InlineCompletionItemProvider', () => {
  const ctx = makeContext()
  activate(ctx)
  expect(vscode.languages.registerInlineCompletionItemProvider).toHaveBeenCalledWith(
    { pattern: '**' },
    expect.any(Object),
  )
})

test('activate registers toggleCompletions command', () => {
  const ctx = makeContext()
  activate(ctx)
  expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
    'sovereign-code.toggleCompletions',
    expect.any(Function),
  )
})

test('activate pushes disposables to subscriptions', () => {
  const ctx = makeContext()
  activate(ctx)
  expect(ctx.subscriptions.length).toBe(4)
})

test('activate creates status bar', () => {
  const ctx = makeContext()
  activate(ctx)
  expect(statusBarModule.createStatusBar).toHaveBeenCalled()
})

test('deactivate does not throw', () => {
  expect(() => deactivate()).not.toThrow()
})
