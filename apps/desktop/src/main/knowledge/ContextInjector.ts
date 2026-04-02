import { type SearchResult, type Snippet } from '../../shared/knowledge'
import { RelevanceFilter } from './RelevanceFilter'
import { TokenBudgetManager } from './TokenBudgetManager'

export class ContextInjector {
  private readonly filter = new RelevanceFilter()
  private readonly budget = new TokenBudgetManager()

  formatBlock(snippets: Snippet[]): string {
    if (!snippets || snippets.length === 0) return ''

    const inner = snippets
      .map(s => {
        const score = s.qualityScore.toFixed(4)
        return `<snippet id="${s.id}" language="${s.language}" domain="${s.domain}" score="${score}">\n${s.text}\n</snippet>`
      })
      .join('\n')

    return `<knowledge_context>\n${inner}\n</knowledge_context>`
  }

  inject(
    results: SearchResult[],
    allSnippets: Map<string, Snippet>,
    maxTokens?: number,
  ): string {
    const filtered = this.filter.filter(results)
    const snippets = filtered
      .map(r => allSnippets.get(r.id))
      .filter((s): s is Snippet => s !== undefined)
    const fitted = this.budget.fit(snippets, maxTokens)
    return this.formatBlock(fitted)
  }
}
