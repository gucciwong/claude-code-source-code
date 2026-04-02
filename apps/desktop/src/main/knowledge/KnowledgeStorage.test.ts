import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KnowledgeStorage, type PKLConfig, type Snippet } from './KnowledgeStorage'

function createMockDb() {
  return {
    exec: vi.fn(),
    prepare: vi.fn().mockImplementation(() => ({
      run: vi.fn(),
      get: vi.fn().mockReturnValue(null),
      all: vi.fn().mockReturnValue([]),
    })),
    close: vi.fn(),
  }
}

function makeSnippet(overrides: Partial<Snippet> = {}): Snippet {
  return {
    id: 'snip-1',
    text: 'console.log("hello")',
    language: 'typescript',
    domain: 'frontend',
    qualityScore: 0.9,
    usageCount: 0,
    createdAt: 1000,
    updatedAt: 1000,
    tags: ['debug'],
    rejected: false,
    ...overrides,
  }
}

describe('KnowledgeStorage', () => {
  let mockDb: ReturnType<typeof createMockDb>
  let storage: KnowledgeStorage
  let testDir: string

  beforeEach(() => {
    testDir = path.join(
      os.tmpdir(),
      `pkl-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    )
    mockDb = createMockDb()
    storage = new KnowledgeStorage(mockDb, testDir)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    try {
      fs.rmSync(testDir, { recursive: true, force: true })
    } catch {
      // best-effort cleanup
    }
  })

  // Test 1
  it('constructor initializes without throwing', () => {
    const freshDir = path.join(os.tmpdir(), `pkl-ctor-${Date.now()}`)
    expect(() => new KnowledgeStorage(createMockDb(), freshDir)).not.toThrow()
    try {
      fs.rmSync(freshDir, { recursive: true, force: true })
    } catch {
      // best-effort cleanup
    }
  })

  // Test 2
  it('saveSnippet calls prepare with INSERT', () => {
    storage.saveSnippet(makeSnippet())
    const calls = mockDb.prepare.mock.calls.map((c) => c[0] as string)
    expect(calls.some((sql) => sql.includes('INSERT OR REPLACE INTO snippets'))).toBe(true)
    // The prepared statement's run must have been called
    const prepareReturn = mockDb.prepare.mock.results.find((r) =>
      (r.value as { run: ReturnType<typeof vi.fn> }).run !== undefined,
    )?.value as { run: ReturnType<typeof vi.fn> }
    expect(prepareReturn.run).toHaveBeenCalled()
  })

  // Test 3
  it('getSnippet returns null when not found', () => {
    const result = storage.getSnippet('nonexistent')
    expect(result).toBeNull()
  })

  // Test 4
  it('getAllSnippets returns empty array initially', () => {
    const result = storage.getAllSnippets()
    expect(result).toEqual([])
  })

  // Test 5
  it('deleteSnippet calls prepare with DELETE', () => {
    storage.deleteSnippet('snip-1')
    const calls = mockDb.prepare.mock.calls.map((c) => c[0] as string)
    expect(calls.some((sql) => sql.includes('DELETE FROM snippets'))).toBe(true)
  })

  // Test 6
  it('saveVector serializes Float32Array to BLOB correctly', () => {
    const vector = new Float32Array([1.0, 2.0, 3.0])

    // Capture what gets passed to prepare().run()
    let capturedRunArgs: unknown[] = []
    mockDb.prepare.mockImplementationOnce(() => ({
      run: vi.fn().mockImplementation((...args: unknown[]) => {
        capturedRunArgs = args
      }),
      get: vi.fn().mockReturnValue(null),
      all: vi.fn().mockReturnValue([]),
    }))

    storage.saveVector('vec-1', vector)

    expect(mockDb.prepare).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO embeddings'),
    )
    expect(capturedRunArgs[0]).toBe('vec-1')
    expect(capturedRunArgs[1]).toBeInstanceOf(Buffer)

    // Buffer should be 12 bytes (3 floats × 4 bytes each), little-endian
    const buf = capturedRunArgs[1] as Buffer
    expect(buf.byteLength).toBe(12)
    expect(buf.readFloatLE(0)).toBeCloseTo(1.0)
    expect(buf.readFloatLE(4)).toBeCloseTo(2.0)
    expect(buf.readFloatLE(8)).toBeCloseTo(3.0)
  })

  // Test 7
  it('getVector returns null when not found', () => {
    const result = storage.getVector('nonexistent')
    expect(result).toBeNull()
  })

  // Test 8
  it('getAllVectors returns empty Map initially', () => {
    const result = storage.getAllVectors()
    expect(result).toBeInstanceOf(Map)
    expect(result.size).toBe(0)
  })

  // Test 9
  it('searchByVector returns empty array when no vectors', () => {
    const query = new Float32Array([1, 0, 0])
    const result = storage.searchByVector(query, 5)
    expect(result).toEqual([])
  })

  // Test 10
  it('searchByVector returns top-K ranked by cosine similarity', () => {
    const vec1 = new Float32Array([1, 0, 0]) // perfect match for query [1,0,0]
    const vec2 = new Float32Array([0, 1, 0]) // orthogonal, similarity = 0
    const vec3 = new Float32Array([0.9, 0.1, 0]) // close match

    vi.spyOn(storage, 'getAllVectors').mockReturnValue(
      new Map([
        ['id1', vec1],
        ['id2', vec2],
        ['id3', vec3],
      ]),
    )

    const query = new Float32Array([1, 0, 0])
    const results = storage.searchByVector(query, 2)

    expect(results).toHaveLength(2)
    expect(results[0].id).toBe('id1')
    expect(results[0].similarity).toBeCloseTo(1.0)
    expect(results[1].id).toBe('id3')
    expect(results[1].similarity).toBeGreaterThan(0)
    expect(results[1].similarity).toBeLessThan(1)
    // id2 should NOT appear (it's 3rd place, topK=2)
    expect(results.find((r) => r.id === 'id2')).toBeUndefined()
  })

  // Test 11
  it('getMemoryMarkdown returns default template when file missing', () => {
    // testDir exists but memory.md was never written
    const result = storage.getMemoryMarkdown()
    expect(result).toContain('Personal Knowledge Library')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  // Test 12
  it('saveMemoryMarkdown writes content to file', () => {
    const content = '# My custom notes\nSome content here'
    storage.saveMemoryMarkdown(content)
    const written = fs.readFileSync(path.join(testDir, 'memory.md'), 'utf8')
    expect(written).toBe(content)
  })

  // Test 13
  it('getConfig returns default config when file missing', () => {
    const config = storage.getConfig()
    expect(config).toMatchObject({
      injectionEnabled: expect.any(Boolean),
      maxTokens: expect.any(Number),
      qualityThreshold: expect.any(Number),
      version: expect.any(String),
    })
    expect(config.maxTokens).toBeGreaterThan(0)
  })

  // Test 14
  it('saveConfig writes config as JSON', () => {
    const config: PKLConfig = {
      injectionEnabled: false,
      maxTokens: 1024,
      qualityThreshold: 0.5,
      version: '2.0.0',
    }
    storage.saveConfig(config)
    const written = JSON.parse(
      fs.readFileSync(path.join(testDir, 'config.json'), 'utf8'),
    ) as PKLConfig
    expect(written).toEqual(config)
  })

  // Test 15
  it('getSnippetCount returns 0 initially', () => {
    mockDb.prepare.mockImplementation(() => ({
      run: vi.fn(),
      get: vi.fn().mockReturnValue({ count: 0 }),
      all: vi.fn().mockReturnValue([]),
    }))
    const fresh = new KnowledgeStorage(mockDb, testDir)
    const count = fresh.getSnippetCount()
    expect(count).toBe(0)
  })
})
