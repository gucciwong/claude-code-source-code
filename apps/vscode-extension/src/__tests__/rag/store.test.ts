import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { ChunkStore } from '../../rag/store'

// Use in-memory SQLite for all store tests
let store: ChunkStore

// 768-dimensional unit vectors for testing
const VEC_A = Array.from({ length: 768 }, () => 1 / Math.sqrt(768))  // uniform positive
const VEC_B = Array.from({ length: 768 }, (_, i) => i % 2 === 0 ? 1 / Math.sqrt(384) : 0) // every other dim

beforeEach(() => {
  store = new ChunkStore(':memory:')
})

afterEach(() => {
  store.dispose()
})

describe('ChunkStore', () => {
  test('upsertFile and search returns inserted chunk', () => {
    store.upsertFile('/project/a.ts', [
      { startLine: 0, endLine: 5, content: 'function hello() {}', embedding: VEC_A },
    ])

    const results = store.search(VEC_A, 5)
    expect(results.length).toBe(1)
    expect(results[0].content).toBe('function hello() {}')
    expect(results[0].filePath).toBe('/project/a.ts')
  })

  test('upsertFile replaces existing chunks for same file', () => {
    store.upsertFile('/project/a.ts', [
      { startLine: 0, endLine: 5, content: 'old content', embedding: VEC_A },
    ])
    store.upsertFile('/project/a.ts', [
      { startLine: 0, endLine: 5, content: 'new content', embedding: VEC_A },
    ])

    const results = store.search(VEC_A, 5)
    expect(results.length).toBe(1)
    expect(results[0].content).toBe('new content')
  })

  test('removeFile deletes chunks for that file only', () => {
    store.upsertFile('/project/a.ts', [
      { startLine: 0, endLine: 2, content: 'chunk in a', embedding: VEC_A },
    ])
    store.upsertFile('/project/b.ts', [
      { startLine: 0, endLine: 2, content: 'chunk in b', embedding: VEC_B },
    ])

    store.removeFile('/project/a.ts')

    const results = store.search(VEC_A, 10)
    // Only b.ts chunk remains
    expect(results.length).toBe(1)
    expect(results[0].filePath).toBe('/project/b.ts')
  })

  test('search returns topK most similar chunks in descending order', () => {
    store.upsertFile('/project/a.ts', [
      { startLine: 0, endLine: 1, content: 'high similarity', embedding: VEC_A },
      { startLine: 2, endLine: 3, content: 'low similarity', embedding: VEC_B },
    ])

    const results = store.search(VEC_A, 2)
    expect(results[0].content).toBe('high similarity')
    expect(results[1].content).toBe('low similarity')
  })

  test('search returns at most topK results', () => {
    for (let i = 0; i < 10; i++) {
      store.upsertFile(`/project/file${i}.ts`, [
        { startLine: 0, endLine: 1, content: `chunk ${i}`, embedding: VEC_A },
      ])
    }
    const results = store.search(VEC_A, 3)
    expect(results.length).toBe(3)
  })

  test('search on empty store returns empty array', () => {
    const results = store.search(VEC_A, 5)
    expect(results).toEqual([])
  })

  test('stored chunk has correct metadata', () => {
    store.upsertFile('/project/x.py', [
      { startLine: 10, endLine: 20, content: 'def foo(): pass', embedding: VEC_A },
    ])
    const results = store.search(VEC_A, 1)
    expect(results[0].startLine).toBe(10)
    expect(results[0].endLine).toBe(20)
  })
})
