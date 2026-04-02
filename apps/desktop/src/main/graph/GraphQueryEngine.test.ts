import { GraphQueryEngine } from './GraphQueryEngine'
import type { DecisionNode } from '../../../shared/enterprise'

const engine = new GraphQueryEngine()

const nodes: DecisionNode[] = [
  {
    id: 'n1', type: 'BugFix', summary: 'fix: login crash', rationale: '',
    timestamp: 1712345678, commitHash: 'abc1234567890', author: 'alice@example.com', filesChanged: ['auth.ts'],
  },
  {
    id: 'n2', type: 'FeatureAdd', summary: 'feat: new dashboard', rationale: '',
    timestamp: 1712345700, commitHash: 'def1234567890', author: 'bob@example.com', filesChanged: ['Dashboard.tsx'],
  },
  {
    id: 'n3', type: 'ArchitectureDecision', summary: 'arch: migrate to microservices', rationale: '',
    timestamp: 1712345710, commitHash: 'ghi1234567890', author: 'carol@example.com', filesChanged: ['infra.ts'],
  },
  {
    id: 'n4', type: 'Refactor', summary: 'refactor: cleanup auth module', rationale: '',
    timestamp: 1712345720, commitHash: 'jkl1234567890', author: 'dave@example.com', filesChanged: ['auth.ts'],
  },
  {
    id: 'n5', type: 'DependencyChange', summary: 'deps: upgrade react to 19', rationale: '',
    timestamp: 1712345730, commitHash: 'mno1234567890', author: 'eve@example.com', filesChanged: ['package.json'],
  },
]

test('empty query returns all nodes', () => {
  expect(engine.query(nodes, '')).toEqual(nodes)
})

test('bug query filters to BugFix nodes', () => {
  const result = engine.query(nodes, 'bug fixes')
  expect(result.every(n => n.type === 'BugFix')).toBe(true)
  expect(result).toHaveLength(1)
})

test('arch query filters to ArchitectureDecision nodes', () => {
  const result = engine.query(nodes, 'architecture decisions')
  expect(result.every(n => n.type === 'ArchitectureDecision')).toBe(true)
  expect(result).toHaveLength(1)
})

test('refactor query filters to Refactor nodes', () => {
  const result = engine.query(nodes, 'refactor')
  expect(result.every(n => n.type === 'Refactor')).toBe(true)
  expect(result).toHaveLength(1)
})

test('feature query filters to FeatureAdd nodes', () => {
  const result = engine.query(nodes, 'new features')
  expect(result.every(n => n.type === 'FeatureAdd')).toBe(true)
  expect(result).toHaveLength(1)
})

test('dependency query filters to DependencyChange nodes', () => {
  const result = engine.query(nodes, 'dependency upgrade')
  expect(result.every(n => n.type === 'DependencyChange')).toBe(true)
  expect(result).toHaveLength(1)
})

test('last N query returns first N nodes', () => {
  const result = engine.query(nodes, 'last 3')
  expect(result).toHaveLength(3)
  expect(result).toEqual(nodes.slice(0, 3))
})

test('by author query filters by author', () => {
  const result = engine.query(nodes, 'by alice')
  expect(result).toHaveLength(1)
  expect(result[0].author).toBe('alice@example.com')
})

test('fuzzy summary search matches substring', () => {
  const result = engine.query(nodes, 'microservices')
  expect(result).toHaveLength(1)
  expect(result[0].id).toBe('n3')
})

test('query on empty nodes returns empty', () => {
  expect(engine.query([], 'bug')).toEqual([])
})
