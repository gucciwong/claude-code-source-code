import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import * as vscode from 'vscode'
import { Indexer } from '../../rag/indexer'
import { ChunkStore } from '../../rag/store'
import * as embedderModule from '../../rag/embedder'

// Mock fs/promises so we don't touch the real filesystem
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('function hello() {\n  return 42\n}\n'),
}))

const FAKE_VEC = Array.from({ length: 768 }, () => 0.1)

let store: ChunkStore

beforeEach(() => {
  store = new ChunkStore(':memory:')
  vi.spyOn(embedderModule, 'getEmbedding').mockResolvedValue(FAKE_VEC)
  vi.mocked(vscode.workspace.findFiles).mockResolvedValue([
    vscode.Uri.file('/workspace/src/main.ts'),
  ])
})

afterEach(() => {
  store.dispose()
  vi.restoreAllMocks()
})

describe('Indexer', () => {
  test('start() indexes all files found by findFiles', async () => {
    const indexer = new Indexer(store, 'http://localhost:11434', 'nomic-embed-text')
    await indexer.start('/workspace')

    const results = store.search(FAKE_VEC, 10)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].filePath).toBe('/workspace/src/main.ts')
    indexer.stop()
  })

  test('start() creates a FileSystemWatcher', async () => {
    const indexer = new Indexer(store, 'http://localhost:11434', 'nomic-embed-text')
    await indexer.start('/workspace')

    expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalledOnce()
    indexer.stop()
  })

  test('stop() disposes the watcher', async () => {
    const mockWatcher = {
      onDidCreate: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      onDidChange: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      onDidDelete: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      dispose: vi.fn(),
    }
    vi.mocked(vscode.workspace.createFileSystemWatcher).mockReturnValueOnce(
      mockWatcher as unknown as ReturnType<typeof vscode.workspace.createFileSystemWatcher>,
    )

    const indexer = new Indexer(store, 'http://localhost:11434', 'nomic-embed-text')
    await indexer.start('/workspace')
    indexer.stop()

    expect(mockWatcher.dispose).toHaveBeenCalledOnce()
  })

  test('does not throw if getEmbedding returns null for a file', async () => {
    vi.spyOn(embedderModule, 'getEmbedding').mockResolvedValue(null)

    const indexer = new Indexer(store, 'http://localhost:11434', 'nomic-embed-text')
    await expect(indexer.start('/workspace')).resolves.not.toThrow()
    indexer.stop()
  })

  test('does not throw if readFile fails for a file', async () => {
    const { readFile } = await import('fs/promises')
    vi.mocked(readFile).mockRejectedValueOnce(new Error('Permission denied'))

    const indexer = new Indexer(store, 'http://localhost:11434', 'nomic-embed-text')
    await expect(indexer.start('/workspace')).resolves.not.toThrow()
    indexer.stop()
  })
})
