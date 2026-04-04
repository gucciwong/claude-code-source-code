import { vi, beforeEach, test, expect } from 'vitest'
import * as vscode from 'vscode'
import { createStatusBar } from '../statusBar'

beforeEach(() => {
  vi.clearAllMocks()
})

test('creates a status bar item on construction', () => {
  createStatusBar()
  expect(vscode.window.createStatusBarItem).toHaveBeenCalledWith(
    'sovereign-code',
    vscode.StatusBarAlignment.Right,
    100,
  )
})

test('setOnline sets text containing model name', () => {
  const bar = createStatusBar()
  bar.setOnline('qwen2.5-coder:7b')
  const item = vi.mocked(vscode.window.createStatusBarItem).mock.results[0].value
  expect(item.text).toContain('qwen2.5-coder:7b')
})

test('setOffline sets text containing "Offline"', () => {
  const bar = createStatusBar()
  bar.setOffline()
  const item = vi.mocked(vscode.window.createStatusBarItem).mock.results[0].value
  expect(item.text).toContain('Offline')
})

test('dispose calls item.dispose', () => {
  const bar = createStatusBar()
  bar.dispose()
  const item = vi.mocked(vscode.window.createStatusBarItem).mock.results[0].value
  expect(item.dispose).toHaveBeenCalled()
})
