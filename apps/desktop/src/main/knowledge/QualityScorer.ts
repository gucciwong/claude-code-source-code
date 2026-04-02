export class QualityScorer {
  // Score: 0.0 (low quality) to 1.0 (high quality)
  static score(text: string, type: 'code' | 'methodology'): number {
    if (!text || text.trim().length === 0) return 0.0

    const lines = text.trim().split('\n').length
    const chars = text.trim().length

    let score = 0.5  // baseline

    if (type === 'code') {
      // Ideal: 5-200 lines of code
      if (lines >= 5 && lines <= 200) score += 0.2
      else if (lines < 5) score -= 0.1
      else score -= 0.1  // too long

      // Reward specificity: contains function/class/const/def keywords
      const specificityKeywords = /function|class|const|let|var|def|import|export|interface|type /
      if (specificityKeywords.test(text)) score += 0.15

      // Penalise blank/trivial content
      if (chars < 30) score -= 0.3
      if (chars > 5000) score -= 0.1

    } else {
      // methodology
      if (chars >= 100 && chars <= 2000) score += 0.2

      // Reward structure: numbered lists, headers, bullet points
      if (/\d\.|^-|^#/m.test(text)) score += 0.1

      if (chars < 50) score -= 0.2
    }

    return Math.max(0, Math.min(1, score))
  }
}
