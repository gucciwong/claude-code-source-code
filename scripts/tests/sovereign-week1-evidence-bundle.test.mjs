import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildEvidenceBundle,
  summarizeGateSignals,
  parseEvidenceBundleArgs,
} from '../sovereign-week1-evidence-bundle.mjs'

test('buildEvidenceBundle composes runtime and benchmark evidence', () => {
  const bundle = buildEvidenceBundle({
    date: '2026-04-01',
    runtime: {
      runtime: { reachable: true, host: '127.0.0.1', port: 11434, error: null },
      models: { count: 2, names: ['model-a', 'model-b'] },
    },
    benchmark: {
      metrics: { sampleCount: 3, firstTokenLatencyMsAvg: 490, tokensPerSecondAvg: 34 },
      targets: { latencyPass: true, throughputPass: true, latencyLimitMs: 500, throughputMinimumTps: 30 },
    },
  })

  assert.equal(bundle.date, '2026-04-01')
  assert.equal(bundle.runtimeReachable, true)
  assert.equal(bundle.runtimeEndpoint, '127.0.0.1:11434')
  assert.equal(bundle.modelCount, 2)
  assert.equal(bundle.metrics.firstTokenLatencyMsAvg, 490)
  assert.equal(bundle.targets.throughputPass, true)
})

test('buildEvidenceBundle throws when date is missing', () => {
  assert.throws(
    () => buildEvidenceBundle({ runtime: {}, benchmark: {} }),
    /date is required/,
  )
})

test('buildEvidenceBundle applies null/zero defaults when runtime or benchmark fields are missing', () => {
  const bundle = buildEvidenceBundle({
    date: '2026-04-01',
    runtime: null,
    benchmark: {},
  })

  assert.equal(bundle.runtimeReachable, false)
  assert.equal(bundle.runtimeEndpoint, null)
  assert.equal(bundle.runtimeError, null)
  assert.equal(bundle.modelCount, 0)
  assert.deepStrictEqual(bundle.modelNames, [])
  assert.equal(bundle.metrics.sampleCount, 0)
  assert.equal(bundle.metrics.firstTokenLatencyMsAvg, null)
  assert.equal(bundle.metrics.tokensPerSecondAvg, null)
  assert.equal(bundle.targets.latencyPass, false)
  assert.equal(bundle.targets.throughputPass, false)
  assert.equal(bundle.targets.latencyLimitMs, null)
  assert.equal(bundle.targets.throughputMinimumTps, null)
})

test('summarizeGateSignals returns fail when runtime is unreachable', () => {
  const gate = summarizeGateSignals({
    runtimeReachable: false,
    targets: { latencyPass: true, throughputPass: true },
  })

  assert.equal(gate.readyForDemo, false)
  assert.match(gate.reason, /runtime/i)
})

test('summarizeGateSignals returns fail when latency target failed', () => {
  const gate = summarizeGateSignals({
    runtimeReachable: true,
    targets: { latencyPass: false, throughputPass: true },
  })

  assert.equal(gate.readyForDemo, false)
  assert.match(gate.reason, /latency/i)
})

test('summarizeGateSignals returns fail when throughput target failed', () => {
  const gate = summarizeGateSignals({
    runtimeReachable: true,
    targets: { latencyPass: true, throughputPass: false },
  })

  assert.equal(gate.readyForDemo, false)
  assert.match(gate.reason, /throughput/i)
})

test('summarizeGateSignals returns ready when all gate signals pass', () => {
  const gate = summarizeGateSignals({
    runtimeReachable: true,
    targets: { latencyPass: true, throughputPass: true },
  })

  assert.equal(gate.readyForDemo, true)
  assert.match(gate.reason, /green/i)
})

test('parseEvidenceBundleArgs throws when --runtime-file value is missing', () => {
  assert.throws(
    () => parseEvidenceBundleArgs(['node', 'scripts/sovereign-week1-evidence-bundle.mjs', '--runtime-file']),
    /Missing value for --runtime-file/,
  )
})

test('parseEvidenceBundleArgs throws when --benchmark-file value is missing', () => {
  assert.throws(
    () => parseEvidenceBundleArgs(['node', 'scripts/sovereign-week1-evidence-bundle.mjs', '--benchmark-file']),
    /Missing value for --benchmark-file/,
  )
})

test('parseEvidenceBundleArgs throws when --date value is missing', () => {
  assert.throws(
    () => parseEvidenceBundleArgs(['node', 'scripts/sovereign-week1-evidence-bundle.mjs', '--date']),
    /Missing value for --date/,
  )
})

test('parseEvidenceBundleArgs parses explicit args and json flag', () => {
  const args = parseEvidenceBundleArgs([
    'node',
    'scripts/sovereign-week1-evidence-bundle.mjs',
    '--date',
    '2026-04-01',
    '--runtime-file',
    'artifacts/week1-runtime.json',
    '--benchmark-file',
    'artifacts/week1-benchmark.json',
    '--json',
  ])

  assert.equal(args.date, '2026-04-01')
  assert.equal(args.runtimeFile, 'artifacts/week1-runtime.json')
  assert.equal(args.benchmarkFile, 'artifacts/week1-benchmark.json')
  assert.equal(args.json, true)
})

test('parseEvidenceBundleArgs throws on unknown options', () => {
  assert.throws(
    () => parseEvidenceBundleArgs(['node', 'scripts/sovereign-week1-evidence-bundle.mjs', '--unknown']),
    /Unknown option for evidence-bundle CLI/,
  )
})

test('parseEvidenceBundleArgs throws on unknown short options', () => {
  assert.throws(
    () => parseEvidenceBundleArgs(['node', 'scripts/sovereign-week1-evidence-bundle.mjs', '-x']),
    /Unknown option for evidence-bundle CLI/,
  )
})

test('parseEvidenceBundleArgs throws on positional arguments', () => {
  assert.throws(
    () => parseEvidenceBundleArgs(['node', 'scripts/sovereign-week1-evidence-bundle.mjs', 'unexpected']),
    /Unexpected positional argument/,
  )
})
