import { execSync } from 'child_process'
import type { DecisionNode } from '../../../shared/enterprise'

type DecisionNodeType = DecisionNode['type']

export class GitHistoryParser {
  /**
   * Run git log in the given directory and return DecisionNode[].
   * @param repoPath - absolute path to git repository root
   * @param maxCommits - maximum number of commits to parse (default 200)
   */
  parse(repoPath: string, maxCommits = 200): DecisionNode[] {
    try {
      const output = execSync(
        `git log --pretty=format:"%H|%ae|%at|%s" --name-only -n ${maxCommits}`,
        { cwd: repoPath, encoding: 'utf-8', timeout: 10_000 }
      )
      return this.parseOutput(output)
    } catch {
      return []
    }
  }

  parseOutput(gitLogOutput: string): DecisionNode[] {
    if (!gitLogOutput?.trim()) return []

    // Normalize line endings
    const normalized = gitLogOutput.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    // Split by double newline to get one block per commit
    const blocks = normalized.split(/\n\n+/)

    const nodes: DecisionNode[] = []

    for (const block of blocks) {
      const lines = block.trim().split('\n').filter(l => l.trim())
      if (lines.length === 0) continue

      const headerLine = lines[0]
      const pipeIdx = headerLine.indexOf('|')
      if (pipeIdx === -1) continue

      const commitHash = headerLine.slice(0, pipeIdx)
      const rest = headerLine.slice(pipeIdx + 1)
      const secondPipe = rest.indexOf('|')
      if (secondPipe === -1) continue

      const author = rest.slice(0, secondPipe)
      const rest2 = rest.slice(secondPipe + 1)
      const thirdPipe = rest2.indexOf('|')
      if (thirdPipe === -1) continue

      const timestampStr = rest2.slice(0, thirdPipe)
      const summary = rest2.slice(thirdPipe + 1)

      const timestamp = parseInt(timestampStr, 10)
      if (isNaN(timestamp)) continue

      const filesChanged = lines.slice(1).filter(l => l.trim() !== '')

      const node: DecisionNode = {
        id: commitHash,
        type: this.classifyCommit(summary),
        summary,
        rationale: this.extractRationale(summary),
        timestamp,
        commitHash,
        author,
        filesChanged,
      }

      nodes.push(node)
    }

    return nodes
  }

  classifyCommit(message: string): DecisionNodeType {
    const m = message.toLowerCase()
    if (/\bfix[:(]|\bfixes?\b|\bbug\b|\bpatch\b|\bresolve\b/.test(m)) return 'BugFix'
    if (/\barch\b|\bdesign\b|\bdecision\b|\badr\b/.test(m)) return 'ArchitectureDecision'
    if (/\brefactor[:(]|\bcleanup\b|\brestructure\b/.test(m)) return 'Refactor'
    if (/\bdeps?\b|\bdependency\b|\bupgrade\b|\bbump\b/.test(m)) return 'DependencyChange'
    return 'FeatureAdd'
  }

  extractRationale(message: string): string {
    const lines = message.split('\n')
    if (lines.length <= 1) return ''
    return lines.slice(1).join('\n').trim()
  }
}
