export interface Chunk {
  filePath: string
  startLine: number
  endLine: number
  content: string
}

const CHUNK_SIZE = 50     // target lines per chunk
const CHUNK_OVERLAP = 10  // overlap between consecutive chunks

/** Regex patterns that mark the start of a new logical unit (function, class, etc.) */
const BOUNDARY_PATTERNS: RegExp[] = [
  /^(export\s+)?(default\s+)?(async\s+)?function\s+\w+/,
  /^(export\s+)?(abstract\s+)?class\s+\w+/,
  /^(export\s+)?const\s+\w+\s*=\s*(async\s+)?\(/,
  /^(export\s+)?const\s+\w+\s*=\s*(async\s+)?function/,
  /^def\s+\w+[\s(]/,
  /^class\s+\w+[:(]/,
  /^func\s+\w+\s*\(/,
  /^fn\s+\w+\s*[(<]/,
  /^pub\s+(async\s+)?fn\s+\w+/,
]

function isBoundary(line: string): boolean {
  const trimmed = line.trimStart()
  return BOUNDARY_PATTERNS.some(p => p.test(trimmed))
}

export function chunkSource(filePath: string, source: string): Chunk[] {
  if (!source.trim()) return []

  const lines = source.split('\n')
  const chunks: Chunk[] = []
  let i = 0

  while (i < lines.length) {
    const targetEnd = Math.min(i + CHUNK_SIZE, lines.length)

    // Search backward from the target end for a natural boundary
    let splitAt = targetEnd
    for (let j = targetEnd - 1; j > i + CHUNK_OVERLAP && j > i + 1; j--) {
      if (isBoundary(lines[j])) {
        splitAt = j
        break
      }
    }

    const content = lines.slice(i, splitAt).join('\n').trim()
    if (content.length > 0) {
      chunks.push({ filePath, startLine: i, endLine: splitAt - 1, content })
    }

    if (splitAt >= lines.length) break

    // Next chunk starts with overlap to preserve context
    i = splitAt - CHUNK_OVERLAP
    if (i < 0) i = 0
  }

  return chunks
}
