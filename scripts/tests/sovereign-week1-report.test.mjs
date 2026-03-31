import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildMarkdownReport,
  summarizeReadiness,
} from '../sovereign-week1-report.mjs'

test('summarizeReadiness maps gate state to readable summary', () => {
  const summary = summarizeReadiness({
    gate: { readyForDemo: false, reason: 'Runtime is unreachable' },
  })

  assert.equal(summary.status, 'Blocked')
  assert.match(summary.message, /Runtime is unreachable/)
})

test('buildMarkdownReport includes key metrics and status', () => {
  const report = buildMarkdownReport({
    date: '2026-04-01',
    runtimeReachable: true,
    modelCount: 2,
    metrics: {
      firstTokenLatencyMsAvg: 483,
      tokensPerSecondAvg: 33,
      sampleCount: 3,
    },
    targets: {
      latencyPass: true,
      throughputPass: true,
      latencyLimitMs: 500,
      throughputMinimumTps: 30,
    },
    gate: {
      readyForDemo: true,
      reason: 'All Week 1 gate signals are green',
    },
  })

  assert.match(report, /^# Sovereign Week 1 Daily Report/m)
  assert.match(report, /Date: 2026-04-01/)
  assert.match(report, /Runtime reachable: yes/)
  assert.match(report, /Average first-token latency \(ms\): 483/)
  assert.match(report, /Average throughput \(tps\): 33/)
  assert.match(report, /Overall readiness: Ready/)
})
