import { type SearchResult } from '../../shared/knowledge'

export class RelevanceFilter {
  static readonly THRESHOLD = 0.7

  filter(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>()
    return results
      .filter(r => r.similarity >= RelevanceFilter.THRESHOLD)
      .sort((a, b) => b.similarity - a.similarity)
      .filter(r => {
        if (seen.has(r.id)) return false
        seen.add(r.id)
        return true
      })
  }
}
