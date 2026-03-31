import test from 'node:test'
import assert from 'node:assert/strict'

import {
  computeMetrics,
  validateSamples,
  buildReport,
  parseBenchmarkArgs,
} from '../sovereign-week1-benchmark.mjs'

test('computeMetrics returns mean first token latency and mean throughput', () => {
  const metrics = computeMetrics([
    { firstTokenLatencyMs: 420, tokensPerSecond: 35 },
    { firstTokenLatencyMs: 580, tokensPerSecond: 31 },
  ])

  assert.equal(metrics.sampleCount, 2)
  assert.equal(metrics.firstTokenLatencyMsAvg, 500)
  assert.equal(metrics.tokensPerSecondAvg, 33)
})

test('validateSamples rejects invalid numeric values', () => {
  assert.throws(
    () => validateSamples([{ firstTokenLatencyMs: -1, tokensPerSecond: 10 }]),
    /firstTokenLatencyMs/,
  )

  assert.throws(
    () => validateSamples([{ firstTokenLatencyMs: 100, tokensPerSecond: 0 }]),
    /tokensPerSecond/,
  )
})

test('buildReport computes target checks from PRD thresholds', () => {
  const report = buildReport({
    tier: '8GB',
    samples: [
      { firstTokenLatencyMs: 450, tokensPerSecond: 32 },
      { firstTokenLatencyMs: 470, tokensPerSecond: 34 },
    ],
  })

  assert.equal(report.targets.latencyLimitMs, 500)
  assert.equal(report.targets.throughputMinimumTps, 30)
  assert.equal(report.targets.latencyPass, true)
  assert.equal(report.targets.throughputPass, true)
})

test('parseBenchmarkArgs throws when --file value is missing', () => {
  assert.throws(
    () => parseBenchmarkArgs(['node', 'scripts/sovereign-week1-benchmark.mjs', '--file']),
    /Missing value for --file/,
  )
})

test('parseBenchmarkArgs throws when --tier value is missing', () => {
  assert.throws(
    () => parseBenchmarkArgs(['node', 'scripts/sovereign-week1-benchmark.mjs', '--tier']),
    /Missing value for --tier/,
  )
})

test('parseBenchmarkArgs throws when --tier value is unsupported', () => {
  assert.throws(
    () => parseBenchmarkArgs(['node', 'scripts/sovereign-week1-benchmark.mjs', '--tier', '16GB']),
    /Unsupported --tier value/,
  )
})

test('parseBenchmarkArgs throws on unknown options', () => {
  assert.throws(
    () => parseBenchmarkArgs(['node', 'scripts/sovereign-week1-benchmark.mjs', '--unknown']),
    /Unknown option for benchmark CLI/,
  )
})

test('parseBenchmarkArgs throws on unknown short options', () => {
  assert.throws(
    () => parseBenchmarkArgs(['node', 'scripts/sovereign-week1-benchmark.mjs', '-x']),
    /Unknown option for benchmark CLI/,
  )
})

test('parseBenchmarkArgs throws on positional arguments', () => {
  assert.throws(
    () => parseBenchmarkArgs(['node', 'scripts/sovereign-week1-benchmark.mjs', 'unexpected']),
    /Unexpected positional argument/,
  )
})
