import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TraceContextBuilder } from './TraceContextBuilder'
import type { TraceEvent } from '../../../shared/enterprise'

describe('TraceContextBuilder', () => {
  let builder: TraceContextBuilder

  beforeEach(() => {
    builder = new TraceContextBuilder()
  })

  // ---------------------------------------------------------------------------
  // annotateSource
  // ---------------------------------------------------------------------------

  it('annotateSource empty events returns source unchanged', () => {
    const source = 'x = 1\ny = 2'
    expect(builder.annotateSource(source, [], 'python')).toBe(source)
  })

  it('annotateSource adds Python comment on correct line', () => {
    const source = 'x = 5'
    const events: TraceEvent[] = [{ line: 1, vars: { x: '5' } }]
    const result = builder.annotateSource(source, events, 'python')
    expect(result).toContain('# trace:')
    expect(result).toContain('x=')
  })

  it('annotateSource adds JavaScript comment with //', () => {
    const source = 'let x = 5;'
    const events: TraceEvent[] = [{ line: 1, vars: { x: '5' } }]
    const result = builder.annotateSource(source, events, 'javascript')
    expect(result).toContain('// trace:')
  })

  it('annotateSource multiple vars in one comment', () => {
    const source = 'z = x + y'
    const events: TraceEvent[] = [{ line: 1, vars: { x: '1', y: '2', z: '3' } }]
    const result = builder.annotateSource(source, events, 'python')
    expect(result).toContain('x=')
    expect(result).toContain('y=')
    expect(result).toContain('z=')
  })

  it('annotateSource ignores out-of-range line numbers', () => {
    const source = 'x = 1'
    const events: TraceEvent[] = [{ line: 999, vars: { x: '1' } }]
    const result = builder.annotateSource(source, events, 'python')
    expect(result).toBe(source)
  })

  // ---------------------------------------------------------------------------
  // buildXmlBlock
  // ---------------------------------------------------------------------------

  it('buildXmlBlock wraps in trace_context tag', () => {
    const result = builder.buildXmlBlock('python', 'x = 1', null)
    expect(result).toContain('<trace_context')
    expect(result).toContain('</trace_context>')
  })

  it('buildXmlBlock includes lang attribute', () => {
    const result = builder.buildXmlBlock('python', 'x = 1', null)
    expect(result).toContain('lang="python"')
  })

  it('buildXmlBlock includes error when present', () => {
    const result = builder.buildXmlBlock('python', 'x = 1', 'ZeroDivisionError: division by zero')
    expect(result).toContain('<error>')
    expect(result).toContain('ZeroDivisionError')
  })

  it('buildXmlBlock no error element when null', () => {
    const result = builder.buildXmlBlock('python', 'x = 1', null)
    expect(result).not.toContain('<error>')
  })

  // ---------------------------------------------------------------------------
  // truncateToTokenBudget
  // ---------------------------------------------------------------------------

  it('truncateToTokenBudget truncates very long blocks', () => {
    // MAX_TOKENS = 4096, CHARS_PER_TOKEN = 4 → maxChars = 16384
    const longBlock = 'A'.repeat(20000)
    const result = builder.truncateToTokenBudget(longBlock)
    expect(result.length).toBeLessThan(20000)
    expect(result).toContain('</trace_context>')
  })
})
