import { createHash } from 'crypto'
import { Snippet } from '../../shared/knowledge'

export class DeduplicationEngine {
  private seenHashes = new Set<string>()

  // Load existing snippet texts as hashes (call on startup)
  loadExisting(snippets: Snippet[]): void {
    for (const s of snippets) {
      this.seenHashes.add(this.hash(s.text))
    }
  }

  // Returns true if this text is a duplicate (exact match)
  isDuplicate(text: string): boolean {
    return this.seenHashes.has(this.hash(text))
  }

  // Mark a text as seen (call after saving a new snippet)
  markSeen(text: string): void {
    this.seenHashes.add(this.hash(text))
  }

  // Filter out duplicates from a list of snippets
  filterNew(snippets: Snippet[]): Snippet[] {
    return snippets.filter(s => {
      if (this.isDuplicate(s.text)) return false
      this.markSeen(s.text)
      return true
    })
  }

  private hash(text: string): string {
    // Normalize whitespace before hashing for near-exact dedup
    const normalized = text.replace(/\s+/g, ' ').trim()
    return createHash('sha256').update(normalized).digest('hex')
  }

  // Clear the seen-set (useful for testing)
  reset(): void {
    this.seenHashes.clear()
  }
}
