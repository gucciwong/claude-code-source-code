import { Snippet } from '../../shared/knowledge'
import { randomUUID } from 'crypto'
import { QualityScorer } from './QualityScorer'

export interface ExtractedPattern {
  type: 'code' | 'methodology' | 'decision'
  text: string
  language?: string
  context: string
  qualityScore: number
  tags: string[]
}

export class PatternExtractor {
  private static MAX_EXTRACTIONS_PER_COMPLETION = 5

  // Extract patterns from an AI completion and the user prompt that produced it
  extract(completion: string, userPrompt: string): ExtractedPattern[] {
    const patterns: ExtractedPattern[] = []

    // 1. Extract fenced code blocks: ```lang\ncode```
    const codeBlockRegex = /```(\w+)?\n([\s\S]+?)```/g
    let match: RegExpExecArray | null
    while ((match = codeBlockRegex.exec(completion)) !== null) {
      const language = match[1] ?? 'plaintext'
      const code = match[2].trim()
      const quality = QualityScorer.score(code, 'code')
      patterns.push({
        type: 'code',
        text: code,
        language,
        context: userPrompt.slice(0, 200),
        qualityScore: quality,
        tags: [language],
      })
    }

    // 2. If no code blocks, extract the whole completion as methodology if long enough
    if (patterns.length === 0 && completion.length > 100) {
      const quality = QualityScorer.score(completion, 'methodology')
      if (quality >= 0.5) {
        patterns.push({
          type: 'methodology',
          text: completion.slice(0, 1000),
          context: userPrompt.slice(0, 200),
          qualityScore: quality,
          tags: [],
        })
      }
    }

    // Limit to MAX_EXTRACTIONS_PER_COMPLETION
    return patterns
      .filter(p => p.qualityScore >= 0.6)
      .slice(0, PatternExtractor.MAX_EXTRACTIONS_PER_COMPLETION)
  }

  // Convert extracted patterns to Snippet objects ready for storage
  toSnippets(patterns: ExtractedPattern[]): Snippet[] {
    const now = Date.now()
    return patterns.map(p => ({
      id: `snip_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
      text: p.text,
      language: p.language ?? 'plaintext',
      domain: p.type,
      qualityScore: p.qualityScore,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
      tags: p.tags,
      rejected: false,
    }))
  }
}
