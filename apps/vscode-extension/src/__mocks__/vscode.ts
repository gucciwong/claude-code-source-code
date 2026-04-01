// Minimal vscode mock for unit tests.
// Extend this file when new vscode.* usages are added to the extension.
import { vi } from 'vitest'

export class Position {
  constructor(public line: number, public character: number) {}
}

export class Range {
  constructor(
    public start: Position,
    public end: Position,
  ) {}
}

export class InlineCompletionItem {
  constructor(
    public insertText: string,
    public range?: Range,
    public command?: unknown,
  ) {}
}

export class InlineCompletionList {
  constructor(public items: InlineCompletionItem[]) {}
}

export const InlineCompletionTriggerKind = {
  Invoke: 0,
  Automatic: 1,
} as const

export const StatusBarAlignment = {
  Left: 1,
  Right: 2,
} as const

export const ConfigurationTarget = {
  Global: 1,
  Workspace: 2,
  WorkspaceFolder: 3,
} as const

export const workspace = {
  getConfiguration: vi.fn().mockReturnValue({
    get: vi.fn().mockImplementation((_key: string, defaultValue: unknown) => defaultValue),
    update: vi.fn(),
  }),
}

export const window = {
  createStatusBarItem: vi.fn().mockReturnValue({
    text: '',
    tooltip: '',
    command: '',
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
  }),
  showErrorMessage: vi.fn(),
  showInformationMessage: vi.fn(),
}

export const languages = {
  registerInlineCompletionItemProvider: vi.fn().mockReturnValue({
    dispose: vi.fn(),
  }),
}

export const commands = {
  registerCommand: vi.fn().mockReturnValue({
    dispose: vi.fn(),
  }),
}

export const CancellationToken = {
  isCancellationRequested: false,
}

export class ThemeColor {
  constructor(public id: string) {}
}
