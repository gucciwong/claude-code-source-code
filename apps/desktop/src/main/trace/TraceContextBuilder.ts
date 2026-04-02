import type { TraceEvent } from '../../../shared/enterprise'

interface TraceResult {
  lines: TraceEvent[]
  error: string | null
  duration_ms: number
  language: string
}

export class TraceContextBuilder {
  private readonly MAX_TOKENS = 4096
  private readonly CHARS_PER_TOKEN = 4

  buildContext(source: string, result: TraceResult): string {
    const annotated = this.annotateSource(source, result.lines, result.language)
    const block = this.buildXmlBlock(result.language, annotated, result.error)
    return this.truncateToTokenBudget(block)
  }

  annotateSource(source: string, events: TraceEvent[], language: string): string {
    const commentChar = language === 'javascript' ? '//' : '#'
    const lines = source.split('\n')
    for (const event of events) {
      const idx = event.line - 1
      if (idx < 0 || idx >= lines.length) continue
      const parts: string[] = []
      if (event.vars) {
        parts.push(...Object.entries(event.vars).map(([k, v]) => `${k}=${JSON.stringify(v)}`))
      }
      if (event.call) parts.push(`call=${event.call}`)
      if (event.duration_ms) parts.push(`duration=${event.duration_ms}ms`)
      if (parts.length > 0) {
        lines[idx] += `  ${commentChar} trace: ${parts.join(', ')}`
      }
    }
    return lines.join('\n')
  }

  buildXmlBlock(language: string, annotatedSource: string, error: string | null): string {
    const errorBlock = error ? `\n  <error>${this.escapeXml(error)}</error>` : ''
    return `<trace_context lang="${language}">\n  <source><![CDATA[${annotatedSource}]]></source>${errorBlock}\n</trace_context>`
  }

  truncateToTokenBudget(block: string): string {
    const maxChars = this.MAX_TOKENS * this.CHARS_PER_TOKEN
    if (block.length <= maxChars) return block
    return block.slice(0, maxChars) + '\n</trace_context>'
  }

  private escapeXml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}
