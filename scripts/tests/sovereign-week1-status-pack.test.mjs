import test from 'node:test'
import assert from 'node:assert/strict'

import {
  deriveOverallStatus,
  buildExecutiveSummary,
  parseStatusPackArgs,
} from '../sovereign-week1-status-pack.mjs'

test('deriveOverallStatus returns green at high readiness', () => {
  const status = deriveOverallStatus({ readinessRate: 0.8, blockedDays: 1, totalDays: 5 })
  assert.equal(status, 'GREEN')
})

test('deriveOverallStatus returns red when totalDays is zero', () => {
  const status = deriveOverallStatus({ readinessRate: 1.0, blockedDays: 0, totalDays: 0 })
  assert.equal(status, 'RED')
})

test('deriveOverallStatus returns yellow when readinessRate is high but blockedDays exceeds threshold', () => {
  const status = deriveOverallStatus({ readinessRate: 0.8, blockedDays: 3, totalDays: 5 })
  assert.equal(status, 'YELLOW')
})

test('deriveOverallStatus returns yellow at moderate readiness', () => {
  const status = deriveOverallStatus({ readinessRate: 0.5, blockedDays: 2, totalDays: 4 })
  assert.equal(status, 'YELLOW')
})

test('deriveOverallStatus returns red at low readiness', () => {
  const status = deriveOverallStatus({ readinessRate: 0.2, blockedDays: 4, totalDays: 5 })
  assert.equal(status, 'RED')
})

test('buildExecutiveSummary renders concise weekly snapshot markdown', () => {
  const markdown = buildExecutiveSummary({
    overallStatus: 'YELLOW',
    trend: {
      totalDays: 4,
      readyDays: 2,
      blockedDays: 2,
      readinessRate: 0.5,
      readinessTargetPass: false,
      latestBlockedStreak: 2,
      window: {
        startDate: '2026-04-01',
        endDate: '2026-04-04',
      },
      blockedReasonCounts: {
        'Runtime is unreachable': 2,
      },
    },
    latest: {
      date: '2026-04-04',
      readyForDemo: false,
      reason: 'Runtime is unreachable',
    },
  })

  assert.match(markdown, /Sovereign Week1 Executive Status Pack/)
  assert.match(markdown, /Overall status: YELLOW/)
  assert.match(markdown, /Readiness rate: 50\.0%/)
  assert.match(markdown, /Readiness target pass: false/)
  assert.match(markdown, /Latest blocked streak: 2 day\(s\)/)
  assert.match(markdown, /Latest day: 2026-04-04 \(blocked\)/)
  assert.match(markdown, /Runtime is unreachable: 2/)
})

test('buildExecutiveSummary renders ready state for latest day', () => {
  const markdown = buildExecutiveSummary({
    overallStatus: 'GREEN',
    trend: {
      totalDays: 3,
      readyDays: 3,
      blockedDays: 0,
      readinessRate: 1.0,
      readinessTargetPass: true,
      latestBlockedStreak: 0,
      window: { startDate: '2026-04-01', endDate: '2026-04-03' },
      blockedReasonCounts: {},
    },
    latest: { date: '2026-04-03', readyForDemo: true, reason: 'All Week 1 gate signals are green' },
  })

  assert.match(markdown, /Latest day: 2026-04-03 \(ready\)/)
  assert.match(markdown, /- None/)
})

test('buildExecutiveSummary falls back to N/A for missing latest reason and window bounds', () => {
  const markdown = buildExecutiveSummary({
    overallStatus: 'RED',
    trend: {
      totalDays: 0,
      readyDays: 0,
      blockedDays: 0,
      readinessRate: 0,
      readinessTargetPass: false,
      latestBlockedStreak: 0,
      window: { startDate: null, endDate: null },
      blockedReasonCounts: {},
    },
    latest: { date: 'N/A', readyForDemo: false },
  })

  assert.match(markdown, /Window: N\/A to N\/A/)
  assert.match(markdown, /Latest reason: N\/A/)
})

test('parseStatusPackArgs parses explicit values and json flag', () => {
  const args = parseStatusPackArgs([
    'node',
    'scripts/sovereign-week1-status-pack.mjs',
    '--dir',
    'custom-artifacts',
    '--out-file',
    'custom-artifacts/status.md',
    '--json',
  ])

  assert.equal(args.dir, 'custom-artifacts')
  assert.equal(args.outFile, 'custom-artifacts/status.md')
  assert.equal(args.json, true)
})

test('parseStatusPackArgs throws when out-file value is missing', () => {
  assert.throws(
    () => parseStatusPackArgs(['node', 'scripts/sovereign-week1-status-pack.mjs', '--out-file']),
    /Missing value for --out-file/,
  )
})

test('parseStatusPackArgs throws when dir value is missing', () => {
  assert.throws(
    () => parseStatusPackArgs(['node', 'scripts/sovereign-week1-status-pack.mjs', '--dir']),
    /Missing value for --dir/,
  )
})

test('parseStatusPackArgs throws on unknown options', () => {
  assert.throws(
    () => parseStatusPackArgs(['node', 'scripts/sovereign-week1-status-pack.mjs', '--unknown-flag']),
    /Unknown option for status-pack CLI/,
  )
})

test('parseStatusPackArgs throws on unknown short options', () => {
  assert.throws(
    () => parseStatusPackArgs(['node', 'scripts/sovereign-week1-status-pack.mjs', '-x']),
    /Unknown option for status-pack CLI/,
  )
})

test('parseStatusPackArgs throws on positional arguments', () => {
  assert.throws(
    () => parseStatusPackArgs(['node', 'scripts/sovereign-week1-status-pack.mjs', 'unexpected']),
    /Unexpected positional argument/,
  )
})
