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
