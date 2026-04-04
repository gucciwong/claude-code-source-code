import * as vscode from 'vscode'
import * as fs from 'fs/promises'
import { chunkSource } from './chunker'
import { getEmbedding } from './embedder'
import { ChunkStore } from './store'

const INCLUDE_GLOB = '**/*.{ts,tsx,js,jsx,py,go,rs,java,cpp,c,h,cs,rb,php,swift,kt,vue,svelte}'
const EXCLUDE_GLOB = '{**/node_modules/**,**/out/**,**/.git/**,**/dist/**,**/.sovereign-code/**,**/*.min.js,**/*.d.ts}'

export class Indexer {
  private watcher?: vscode.FileSystemWatcher
  private _ready = false
  private _resolveReady!: () => void
  private readonly _readyPromise = new Promise<void>(r => { this._resolveReady = r })

  get ready(): boolean { return this._ready }
  waitUntilReady(): Promise<void> { return this._readyPromise }

  constructor(
    private readonly store: ChunkStore,
    private readonly ollamaUrl: string,
    private readonly embeddingModel: string,
  ) {}

  async start(workspaceRoot: string): Promise<void> {
    // Initial full scan
    const uris = await vscode.workspace.findFiles(INCLUDE_GLOB, EXCLUDE_GLOB)
    for (const uri of uris) {
      await this.indexFile(uri.fsPath)
    }

    this._ready = true
    this._resolveReady()

    // Incremental watch
    this.watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceRoot, INCLUDE_GLOB),
    )
    this.watcher.onDidCreate(uri => void this.indexFile(uri.fsPath))
    this.watcher.onDidChange(uri => void this.indexFile(uri.fsPath))
    this.watcher.onDidDelete(uri => this.store.removeFile(uri.fsPath))
  }

  private async indexFile(filePath: string): Promise<void> {
    try {
      const source = await fs.readFile(filePath, 'utf-8')
      const rawChunks = chunkSource(filePath, source)
      const chunksWithEmbeddings: Array<{
        startLine: number
        endLine: number
        content: string
        embedding: number[]
      }> = []

      for (const chunk of rawChunks) {
        const embedding = await getEmbedding(this.ollamaUrl, this.embeddingModel, chunk.content)
        if (embedding) {
          chunksWithEmbeddings.push({ ...chunk, embedding })
        }
      }

      if (chunksWithEmbeddings.length > 0) {
        this.store.upsertFile(filePath, chunksWithEmbeddings)
      }
    } catch {
      // Silently skip unreadable files (binary, permission denied, etc.)
    }
  }

  stop(): void {
    this.watcher?.dispose()
  }
}
