import { type Snippet } from '../../shared/knowledge'

export class TokenBudgetManager {
  static readonly MAX_TOKENS = 8192
  static readonly CHARS_PER_TOKEN = 4

  estimateTokens(text: string): number {
    return Math.ceil(text.length / TokenBudgetManager.CHARS_PER_TOKEN)
  }

  fit(snippets: Snippet[], maxTokens?: number): Snippet[] {
    const budget = maxTokens ?? TokenBudgetManager.MAX_TOKENS
    const result: Snippet[] = []
    let used = 0

    for (const snippet of snippets) {
      const cost = this.estimateTokens(snippet.text)
      if (used + cost > budget) continue
      used += cost
      result.push(snippet)
    }

    return result
  }
}
