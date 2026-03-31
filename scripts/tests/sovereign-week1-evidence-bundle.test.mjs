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
  assert.equal(bundle.modelCount, 2)
  assert.equal(bundle.metrics.firstTokenLatencyMsAvg, 490)
  assert.equal(bundle.targets.throughputPass, true)
})

test('summarizeGateSignals returns fail when runtime is unreachable', () => {
  const gate = summarizeGateSignals({
    runtimeReachable: false,
    targets: { latencyPass: true, throughputPass: true },
  })

  assert.equal(gate.readyForDemo, false)
  assert.match(gate.reason, /runtime/i)
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
