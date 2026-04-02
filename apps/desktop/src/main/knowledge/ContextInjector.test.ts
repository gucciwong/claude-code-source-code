import { describe, it, expect } from 'vitest'
import { RelevanceFilter } from './RelevanceFilter'
import { TokenBudgetManager } from './TokenBudgetManager'
import { ContextInjector } from './ContextInjector'
import { type SearchResult, type Snippet } from '../../shared/knowledge'

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    id: 'r1',
    text: 'const x = 1',
    similarity: 0.9,
    language: 'typescript',
    domain: 'frontend',
    createdAt: 1000,
    ...overrides,
  }
}

function makeSnippet(overrides: Partial<Snippet> = {}): Snippet {
  return {
    id: 'snip-1',
    text: 'const x = 1',
    language: 'typescript',
    domain: 'frontend',
    qualityScore: 0.9,
    usageCount: 0,
    createdAt: 1000,
    updatedAt: 1000,
    tags: [],
    rejected: false,
    ...overrides,
  }
}

// ─── RelevanceFilter ─────────────────────────────────────────────────────────

describe('RelevanceFilter', () => {
  const filter = new RelevanceFilter()

  it('filters results below threshold', () => {
    const results = [
      makeResult({ id: 'a', similarity: 0.5 }),
      makeResult({ id: 'b', similarity: 0.9 }),
    ]
    const out = filter.filter(results)
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('b')
  })

  it('keeps results at the exact threshold', () => {
    const result = makeResult({ id: 'a', similarity: 0.7 })
    const out = filter.filter([result])
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('a')
  })

  it('sorts results by similarity descending', () => {
    const results = [
      makeResult({ id: 'lo', similarity: 0.75 }),
      makeResult({ id: 'hi', similarity: 0.95 }),
      makeResult({ id: 'mid', similarity: 0.85 }),
    ]
    const out = filter.filter(results)
    expect(out.map(r => r.id)).toEqual(['hi', 'mid', 'lo'])
  })

  it('deduplicates results by id', () => {
    const results = [
      makeResult({ id: 'dup', similarity: 0.9 }),
      makeResult({ id: 'dup', similarity: 0.8 }),
    ]
    const out = filter.filter(results)
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('dup')
  })

  it('returns empty array for empty input', () => {
    expect(filter.filter([])).toEqual([])
  })

  it('handles a single result correctly', () => {
    const result = makeResult({ id: 'only', similarity: 0.8 })
    const out = filter.filter([result])
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('only')
  })

  it('threshold is 0.7', () => {
    expect(RelevanceFilter.THRESHOLD).toBe(0.7)
  })
})

// ─── TokenBudgetManager ──────────────────────────────────────────────────────

describe('TokenBudgetManager', () => {
  const mgr = new TokenBudgetManager()

  it('fits snippets within the default budget', () => {
    const snippets = [
      makeSnippet({ id: 'a', text: 'a'.repeat(100) }),
      makeSnippet({ id: 'b', text: 'b'.repeat(100) }),
    ]
    const out = mgr.fit(snippets)
    expect(out).toHaveLength(2)
  })

  it('excludes snippets that would exceed the budget', () => {
    const bigText = 'x'.repeat(TokenBudgetManager.MAX_TOKENS * TokenBudgetManager.CHARS_PER_TOKEN)
    const big = makeSnippet({ id: 'big', text: bigText })
    const small = makeSnippet({ id: 'small', text: 'tiny' })
    // big exceeds budget on its own — it won't fit even alone
    const out = mgr.fit([small, big])
    expect(out.map(s => s.id)).not.toContain('big')
  })

  it('returns empty array for empty input', () => {
    expect(mgr.fit([])).toEqual([])
  })

  it('estimateTokens returns ceil(length / 4)', () => {
    expect(mgr.estimateTokens('abcd')).toBe(1)  // 4/4 = 1
    expect(mgr.estimateTokens('abcde')).toBe(2) // ceil(5/4) = 2
    expect(mgr.estimateTokens('')).toBe(0)
  })

  it('MAX_TOKENS is 8192', () => {
    expect(TokenBudgetManager.MAX_TOKENS).toBe(8192)
  })

  it('single large snippet that exceeds budget returns empty array', () => {
    const hugeText = 'z'.repeat(TokenBudgetManager.MAX_TOKENS * TokenBudgetManager.CHARS_PER_TOKEN + 1)
    const out = mgr.fit([makeSnippet({ id: 'huge', text: hugeText })])
    expect(out).toHaveLength(0)
  })

  it('respects maxTokens override', () => {
    const snippets = [
      makeSnippet({ id: 'a', text: 'a'.repeat(40) }), // 10 tokens
      makeSnippet({ id: 'b', text: 'b'.repeat(40) }), // 10 tokens
      makeSnippet({ id: 'c', text: 'c'.repeat(40) }), // 10 tokens
    ]
    // budget = 15 → only first two fit (10+10=20 > 15 so only first fits)
    const out = mgr.fit(snippets, 15)
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('a')
  })
})

// ─── ContextInjector ─────────────────────────────────────────────────────────

describe('ContextInjector', () => {
  const injector = new ContextInjector()

  it('formatBlock returns empty string for empty array', () => {
    expect(injector.formatBlock([])).toBe('')
  })

  it('formatBlock wraps output in <knowledge_context> tags', () => {
    const snippet = makeSnippet({ id: 'x1' })
    const out = injector.formatBlock([snippet])
    expect(out).toContain('<knowledge_context>')
    expect(out).toContain('</knowledge_context>')
  })

  it('formatBlock includes snippet id attribute', () => {
    const snippet = makeSnippet({ id: 'my-id' })
    const out = injector.formatBlock([snippet])
    expect(out).toContain('id="my-id"')
  })

  it('formatBlock includes snippet content', () => {
    const snippet = makeSnippet({ text: 'return 42' })
    const out = injector.formatBlock([snippet])
    expect(out).toContain('return 42')
  })

  it('inject with below-threshold results returns empty string', () => {
    const results = [makeResult({ id: 'low', similarity: 0.3 })]
    const snippets = new Map<string, Snippet>([
      ['low', makeSnippet({ id: 'low' })],
    ])
    expect(injector.inject(results, snippets)).toBe('')
  })

  it('inject with above-threshold results produces XML', () => {
    const results = [makeResult({ id: 'high', similarity: 0.85 })]
    const snippets = new Map<string, Snippet>([
      ['high', makeSnippet({ id: 'high', text: 'const z = 99' })],
    ])
    const out = injector.inject(results, snippets)
    expect(out).toContain('<knowledge_context>')
    expect(out).toContain('id="high"')
    expect(out).toContain('const z = 99')
  })
})
