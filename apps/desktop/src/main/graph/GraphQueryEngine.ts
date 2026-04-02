import type { DecisionNode } from '../../../shared/enterprise'

export class GraphQueryEngine {
  /**
   * Query nodes by natural language. Supported patterns:
   * - "show me all bug fixes" → filter type: BugFix
   * - "architecture decisions" → filter type: ArchitectureDecision
   * - "changes by alice" → filter by author containing "alice"
   * - "last 10 commits" → return last N commits
   * - "refactors in auth" → type Refactor + filesChanged contains "auth"
   * - Otherwise: fuzzy text search on summary
   */
  query(nodes: DecisionNode[], nlQuery: string): DecisionNode[] {
    const q = nlQuery.toLowerCase().trim()
    if (!q) return nodes

    // Type-based filters
    if (/bug|fix|patch/.test(q)) return nodes.filter(n => n.type === 'BugFix')
    if (/arch|design|decision|adr/.test(q)) return nodes.filter(n => n.type === 'ArchitectureDecision')
    if (/refactor|cleanup|restructure/.test(q)) return nodes.filter(n => n.type === 'Refactor')
    if (/feat|feature|implement|add/.test(q)) return nodes.filter(n => n.type === 'FeatureAdd')
    if (/dep|dependency|upgrade|bump/.test(q)) return nodes.filter(n => n.type === 'DependencyChange')

    // "last N" pattern
    const lastMatch = q.match(/last\s+(\d+)/)
    if (lastMatch) {
      const n = parseInt(lastMatch[1], 10)
      return nodes.slice(0, n)
    }

    // "by <author>" pattern
    const byMatch = q.match(/by\s+(\w+)/)
    if (byMatch) {
      const author = byMatch[1].toLowerCase()
      return nodes.filter(n => n.author.toLowerCase().includes(author))
    }

    // Fuzzy summary search
    return nodes.filter(n =>
      n.summary.toLowerCase().includes(q) ||
      n.filesChanged.some(f => f.toLowerCase().includes(q))
    )
  }
}
