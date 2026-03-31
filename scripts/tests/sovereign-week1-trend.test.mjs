import test from 'node:test'
import assert from 'node:assert/strict'

import {
  computeTrendMetrics,
  buildTrendReport,
  sortSummariesByDate,
} from '../sovereign-week1-trend.mjs'

test('sortSummariesByDate sorts ascending by date key', () => {
  const sorted = sortSummariesByDate([
    { date: '2026-04-03' },
    { date: '2026-04-01' },
    { date: '2026-04-02' },
  ])

  assert.deepEqual(sorted.map(item => item.date), [
    '2026-04-01',
    '2026-04-02',
    '2026-04-03',
  ])
})

test('computeTrendMetrics returns readiness rate and reason breakdown', () => {
  const metrics = computeTrendMetrics([
    { date: '2026-04-01', readyForDemo: false, reason: 'Runtime is unreachable' },
    { date: '2026-04-02', readyForDemo: true, reason: 'Ready for demo' },
    { date: '2026-04-03', readyForDemo: false, reason: 'Throughput below threshold' },
  ])

  assert.equal(metrics.totalDays, 3)
  assert.equal(metrics.readyDays, 1)
  assert.equal(metrics.blockedDays, 2)
  assert.equal(metrics.readinessRate, 0.333)
  assert.equal(metrics.window.startDate, '2026-04-01')
  assert.equal(metrics.window.endDate, '2026-04-03')
  assert.equal(metrics.blockedReasonCounts['Runtime is unreachable'], 1)
  assert.equal(metrics.blockedReasonCounts['Throughput below threshold'], 1)
})

test('buildTrendReport includes high-level metrics and top blocked reasons', () => {
  const report = buildTrendReport({
    totalDays: 4,
    readyDays: 3,
    blockedDays: 1,
    readinessRate: 0.75,
    window: {
      startDate: '2026-04-01',
      endDate: '2026-04-04',
    },
    blockedReasonCounts: {
      'Runtime is unreachable': 1,
    },
  })

  assert.match(report, /Sovereign Week1 Trend Report/)
  assert.match(report, /Readiness rate: 75\.0%/)
  assert.match(report, /Window: 2026-04-01 to 2026-04-04/)
  assert.match(report, /Runtime is unreachable: 1/)
})
