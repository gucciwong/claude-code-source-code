import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildCheckpointSummary,
  toCheckpointText,
} from '../sovereign-week1-checkpoint.mjs'

test('buildCheckpointSummary maps evidence to checkpoint fields', () => {
  const summary = buildCheckpointSummary({
    date: '2026-04-01',
    runtimeReachable: false,
    metrics: {
      firstTokenLatencyMsAvg: 483,
      tokensPerSecondAvg: 33,
    },
    gate: {
      readyForDemo: false,
      reason: 'Runtime is unreachable',
    },
  })

  assert.equal(summary.date, '2026-04-01')
  assert.equal(summary.readiness, 'Blocked')
  assert.equal(summary.latencyMs, 483)
  assert.equal(summary.throughputTps, 33)
  assert.equal(summary.reason, 'Runtime is unreachable')
})

test('toCheckpointText renders concise 4-line checkpoint update', () => {
  const text = toCheckpointText({
    date: '2026-04-01',
    readiness: 'Ready',
    latencyMs: 470,
    throughputTps: 34,
    reason: 'All Week 1 gate signals are green',
  })

  const lines = text.trim().split('\n')
  assert.equal(lines.length, 5)
  assert.match(lines[0], /Week 1 Checkpoint \(2026-04-01\)/)
  assert.match(lines[1], /Readiness: Ready/)
  assert.match(lines[2], /Latency: 470 ms/)
  assert.match(lines[3], /Throughput: 34 tps/)
  assert.match(lines[4], /Reason: All Week 1 gate signals are green/)
})
