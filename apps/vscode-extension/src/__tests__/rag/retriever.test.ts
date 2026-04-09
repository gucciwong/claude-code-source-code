import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { Retriever } from '../../rag/retriever'
import { ChunkStore } from '../../rag/store'
import * as embedderModule from '../../rag/embedder'

const VEC = Array.from({ length: 768 }, () => 0.5)

let store: ChunkStore

beforeEach(() => {
  store = new ChunkStore(':memory:')
  vi.spyOn(embedderModule, 'getEmbedding').mockResolvedValue(VEC)
})

afterEach(() => {
  store.dispose()
  vi.restoreAllMocks()
})

describe('Retriever', () => {
  test('returns empty array when store is empty', async () => {
    const retriever = new Retriever(store, 'http://localhost:11434', 'nomic-embed-text')
    const results = await retriever.query('function foo', 3)
    expect(results).toEqual([])
  })

  test('returns top-k chunks from store', async () => {
    const vec = Array.from({ length: 768 }, () => 0.5)
    store.upsertFile('/project/a.ts', [
      { startLine: 0, endLine: 5, content: 'function foo() {}', embedding: vec },
      { startLine: 6, endLine: 10, content: 'class Bar {}', embedding: vec },
    ])

    const retriever = new Retriever(store, 'http://localhost:11434', 'nomic-embed-text')
    retriever.setReady(true)
    const results = await retriever.query('function foo', 1)

    expect(results.length).toBe(1)
    expect(results[0].content).toBe('function foo() {}')
  })

  test('returns RetrievedChunk shape with correct fields', async () => {
    store.upsertFile('/project/x.py', [
      { startLine: 10, endLine: 20, content: 'def hello(): pass', embedding: VEC },
    ])

    const retriever = new Retriever(store, 'http://localhost:11434', 'nomic-embed-text')
    retriever.setReady(true)
    const results = await retriever.query('def hello', 5)

    expect(results[0]).toMatchObject({
      filePath: '/project/x.py',
      startLine: 10,
      endLine: 20,
      content: 'def hello(): pass',
    })
    // Should NOT expose internal `score` or `embedding` fields
    expect('score' in results[0]).toBe(false)
    expect('embedding' in results[0]).toBe(false)
  })

  test('returns empty array when getEmbedding returns null', async () => {
    vi.spyOn(embedderModule, 'getEmbedding').mockResolvedValueOnce(null)

    store.upsertFile('/project/a.ts', [
      { startLine: 0, endLine: 5, content: 'function foo() {}', embedding: VEC },
    ])

    const retriever = new Retriever(store, 'http://localhost:11434', 'nomic-embed-text')
    const results = await retriever.query('function foo', 5)
    expect(results).toEqual([])
  })

  test('calls getEmbedding with correct arguments', async () => {
    const spy = vi.spyOn(embedderModule, 'getEmbedding').mockResolvedValue(VEC)

    const retriever = new Retriever(store, 'http://my-host:11434', 'nomic-embed-text')
    retriever.setReady(true)
    await retriever.query('some code', 3)

    expect(spy).toHaveBeenCalledWith('http://my-host:11434', 'nomic-embed-text', 'some code')
  })
})
