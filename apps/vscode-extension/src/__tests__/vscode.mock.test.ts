import * as vscode from 'vscode'

test('vscode mock exports InlineCompletionItem', () => {
  const item = new vscode.InlineCompletionItem('hello')
  expect(item.insertText).toBe('hello')
})

test('vscode mock exports InlineCompletionList', () => {
  const item = new vscode.InlineCompletionItem('world')
  const list = new vscode.InlineCompletionList([item])
  expect(list.items).toHaveLength(1)
})

test('vscode mock exports InlineCompletionTriggerKind', () => {
  expect(vscode.InlineCompletionTriggerKind.Invoke).toBe(0)
  expect(vscode.InlineCompletionTriggerKind.Automatic).toBe(1)
})

test('vscode mock exports position and range', () => {
  const pos = new vscode.Position(5, 10)
  expect(pos.line).toBe(5)
  expect(pos.character).toBe(10)
})
