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

test('validateSamples rejects empty array', () => {
  assert.throws(
    () => validateSamples([]),
    /non-empty array/,
  )
})

test('validateSamples rejects non-array input', () => {
  assert.throws(() => validateSamples(null), /non-empty array/)
  assert.throws(() => validateSamples({}), /non-empty array/)
  assert.throws(() => validateSamples('data'), /non-empty array/)
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

test('buildReport marks latencyPass false when avg latency exceeds limit', () => {
  const report = buildReport({
    tier: '8GB',
    samples: [
      { firstTokenLatencyMs: 600, tokensPerSecond: 35 },
      { firstTokenLatencyMs: 700, tokensPerSecond: 35 },
    ],
  })

  assert.equal(report.targets.latencyPass, false)
  assert.equal(report.targets.throughputPass, true)
})

test('buildReport marks throughputPass false when avg tps is below minimum', () => {
  const report = buildReport({
    tier: '8GB',
    samples: [
      { firstTokenLatencyMs: 400, tokensPerSecond: 20 },
      { firstTokenLatencyMs: 400, tokensPerSecond: 25 },
    ],
  })

  assert.equal(report.targets.latencyPass, true)
  assert.equal(report.targets.throughputPass, false)
})

test('buildReport uses 1000ms latency limit for 6GB tier', () => {
  const report = buildReport({
    tier: '6GB',
    samples: [{ firstTokenLatencyMs: 800, tokensPerSecond: 35 }],
  })

  assert.equal(report.targets.latencyLimitMs, 1000)
  assert.equal(report.targets.latencyPass, true)
})

test('buildReport falls back to 500ms limit when tier is null', () => {
  const report = buildReport({
    tier: null,
    samples: [{ firstTokenLatencyMs: 300, tokensPerSecond: 35 }],
  })

  assert.equal(report.targets.latencyLimitMs, 500)
  assert.equal(report.profile.normalizedTier, null)
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
