import { vi } from 'vitest'
import { GitHistoryParser } from './GitHistoryParser'

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>()
  return {
    ...actual,
    execSync: vi.fn(),
  }
})

const parser = new GitHistoryParser()

const SINGLE_COMMIT = 'abc1234567890|alice@example.com|1712345678|fix: login crash\nauth.ts'

const MULTI_COMMIT =
  'abc1234567890|alice@example.com|1712345678|fix: login crash\nauth.ts\n\n' +
  'def0987654321|bob@example.com|1712345700|feat: new dashboard\nDashboard.tsx\nApp.tsx'

test('parseOutput empty string returns empty array', () => {
  expect(parser.parseOutput('')).toEqual([])
})

test('parseOutput single commit parses hash', () => {
  const nodes = parser.parseOutput(SINGLE_COMMIT)
  expect(nodes[0].commitHash).toBe('abc1234567890')
})

test('parseOutput single commit parses author', () => {
  const nodes = parser.parseOutput(SINGLE_COMMIT)
  expect(nodes[0].author).toBe('alice@example.com')
})

test('parseOutput single commit parses timestamp', () => {
  const nodes = parser.parseOutput(SINGLE_COMMIT)
  expect(nodes[0].timestamp).toBe(1712345678)
})

test('parseOutput single commit parses summary', () => {
  const nodes = parser.parseOutput(SINGLE_COMMIT)
  expect(nodes[0].summary).toBe('fix: login crash')
})

test('parseOutput single commit parses filesChanged', () => {
  const nodes = parser.parseOutput(SINGLE_COMMIT)
  expect(nodes[0].filesChanged).toEqual(['auth.ts'])
})

test('parseOutput multiple commits returns correct count', () => {
  const nodes = parser.parseOutput(MULTI_COMMIT)
  expect(nodes).toHaveLength(2)
})

test('classifyCommit feat prefix returns FeatureAdd', () => {
  expect(parser.classifyCommit('feat: add new feature')).toBe('FeatureAdd')
})

test('classifyCommit fix prefix returns BugFix', () => {
  expect(parser.classifyCommit('fix: login crash')).toBe('BugFix')
})

test('classifyCommit refactor prefix returns Refactor', () => {
  expect(parser.classifyCommit('refactor: cleanup auth module')).toBe('Refactor')
})

test('classifyCommit deps keyword returns DependencyChange', () => {
  expect(parser.classifyCommit('deps: upgrade packages to latest')).toBe('DependencyChange')
})

test('classifyCommit arch keyword returns ArchitectureDecision', () => {
  expect(parser.classifyCommit('arch: new microservice structure')).toBe('ArchitectureDecision')
})

test('classifyCommit unknown message returns FeatureAdd', () => {
  expect(parser.classifyCommit('random unrelated commit message')).toBe('FeatureAdd')
})

test('parseOutput node has generated id', () => {
  const nodes = parser.parseOutput(SINGLE_COMMIT)
  expect(nodes[0].id).toBeTruthy()
})

test('parse returns empty array when git fails', async () => {
  const { execSync } = await import('child_process')
  vi.mocked(execSync).mockImplementation(() => {
    throw new Error('not a git repository')
  })
  expect(parser.parse('/some/nonexistent/path')).toEqual([])
})
