import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildCheckpointSummary,
  toCheckpointText,
  parseCheckpointArgs,
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

test('buildCheckpointSummary returns Ready when gate is satisfied', () => {
  const summary = buildCheckpointSummary({
    date: '2026-04-01',
    metrics: { firstTokenLatencyMsAvg: 450, tokensPerSecondAvg: 35 },
    gate: { readyForDemo: true, reason: 'All Week 1 gate signals are green' },
  })

  assert.equal(summary.readiness, 'Ready')
  assert.equal(summary.reason, 'All Week 1 gate signals are green')
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

test('toCheckpointText renders Blocked readiness variant', () => {
  const text = toCheckpointText({
    date: '2026-04-01',
    readiness: 'Blocked',
    latencyMs: 620,
    throughputTps: 28,
    reason: 'Latency target failed',
  })

  assert.match(text, /Readiness: Blocked/)
  assert.match(text, /Latency: 620 ms/)
  assert.match(text, /Throughput: 28 tps/)
  assert.match(text, /Reason: Latency target failed/)
})

test('parseCheckpointArgs throws when evidence-file value is missing', () => {
  assert.throws(
    () => parseCheckpointArgs(['node', 'scripts/sovereign-week1-checkpoint.mjs', '--evidence-file']),
    /Missing value for --evidence-file/,
  )
})

test('parseCheckpointArgs throws when out-file value is missing', () => {
  assert.throws(
    () => parseCheckpointArgs(['node', 'scripts/sovereign-week1-checkpoint.mjs', '--out-file']),
    /Missing value for --out-file/,
  )
})

test('parseCheckpointArgs throws on unknown options', () => {
  assert.throws(
    () => parseCheckpointArgs(['node', 'scripts/sovereign-week1-checkpoint.mjs', '--unknown']),
    /Unknown option for checkpoint CLI/,
  )
})

test('parseCheckpointArgs throws on unknown short options', () => {
  assert.throws(
    () => parseCheckpointArgs(['node', 'scripts/sovereign-week1-checkpoint.mjs', '-x']),
    /Unknown option for checkpoint CLI/,
  )
})

test('parseCheckpointArgs throws on positional arguments', () => {
  assert.throws(
    () => parseCheckpointArgs(['node', 'scripts/sovereign-week1-checkpoint.mjs', 'unexpected']),
    /Unexpected positional argument/,
  )
})
