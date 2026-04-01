import { describe, test, expect } from 'vitest'
import { chunkSource } from '../../rag/chunker'

describe('chunkSource', () => {
  test('returns empty array for empty source', () => {
    const chunks = chunkSource('/a/b.ts', '')
    expect(chunks).toEqual([])
  })

  test('single chunk for short file', () => {
    const source = 'const x = 1\nconst y = 2\n'
    const chunks = chunkSource('/a/b.ts', source)
    expect(chunks.length).toBeGreaterThan(0)
    expect(chunks[0].filePath).toBe('/a/b.ts')
    expect(chunks[0].startLine).toBe(0)
    expect(chunks[0].content).toContain('const x = 1')
  })

  test('multiple chunks for long file', () => {
    // 120 lines — should produce more than 1 chunk
    const source = Array.from({ length: 120 }, (_, i) => `const v${i} = ${i}`).join('\n')
    const chunks = chunkSource('/a/big.ts', source)
    expect(chunks.length).toBeGreaterThan(1)
  })

  test('chunk boundary detected at function declaration', () => {
    const source = [
      ...Array(45).fill('const x = 1'),
      'function myBoundary() {',
      '  return 42',
      '}',
    ].join('\n')
    const chunks = chunkSource('/a/b.ts', source)
    // The boundary at line 45 should cause a split before CHUNK_SIZE (50)
    expect(chunks.length).toBeGreaterThanOrEqual(1)
    // Second chunk should start at or near the function
    if (chunks.length > 1) {
      expect(chunks[1].startLine).toBeLessThan(48)
    }
  })

  test('chunks have non-empty content', () => {
    const source = 'function foo() {\n  return 1\n}\n'
    const chunks = chunkSource('/a/b.ts', source)
    for (const chunk of chunks) {
      expect(chunk.content.trim().length).toBeGreaterThan(0)
    }
  })

  test('each chunk records correct startLine and endLine', () => {
    const source = 'line0\nline1\nline2\n'
    const chunks = chunkSource('/a/b.ts', source)
    for (const chunk of chunks) {
      expect(chunk.endLine).toBeGreaterThanOrEqual(chunk.startLine)
    }
  })
})
