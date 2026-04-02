/**
 * Tier-baseline regression tests — KPI spec §2.2 / §8
 * Validates that per-VRAM-tier benchmark results stay within documented
 * baseline bounds. These tests run against the committed fixture files so they
 * catch any regression in the benchmark helper logic itself.
 *
 * Tier mapping (spec §8 rule 2):
 *   Tier A  6–8 GB VRAM   →  script labels 6GB / 8GB
 *   Tier B  10–16 GB VRAM →  script label  12GB
 *   Tier C  20–24 GB VRAM →  script label  24GB
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { buildReport } from '../sovereign-week1-benchmark.mjs'

// ── Baseline fixtures (copied from benchmark script) ──────────────────────────

const TIER_FIXTURES = {
  '6GB': {
    tier: '6GB',
    samples: [
      { firstTokenLatencyMs: 682, tokensPerSecond: 28 },
      { firstTokenLatencyMs: 710, tokensPerSecond: 26 },
      { firstTokenLatencyMs: 645, tokensPerSecond: 31 },
      { firstTokenLatencyMs: 729, tokensPerSecond: 27 },
      { firstTokenLatencyMs: 698, tokensPerSecond: 29 },
      { firstTokenLatencyMs: 751, tokensPerSecond: 25 },
      { firstTokenLatencyMs: 663, tokensPerSecond: 30 },
      { firstTokenLatencyMs: 718, tokensPerSecond: 28 },
      { firstTokenLatencyMs: 692, tokensPerSecond: 27 },
      { firstTokenLatencyMs: 707, tokensPerSecond: 28 },
    ],
  },
  '8GB': {
    tier: '8GB',
    samples: [
      { firstTokenLatencyMs: 342, tokensPerSecond: 42 },
      { firstTokenLatencyMs: 318, tokensPerSecond: 45 },
      { firstTokenLatencyMs: 361, tokensPerSecond: 40 },
      { firstTokenLatencyMs: 329, tokensPerSecond: 44 },
      { firstTokenLatencyMs: 375, tokensPerSecond: 38 },
      { firstTokenLatencyMs: 348, tokensPerSecond: 41 },
      { firstTokenLatencyMs: 337, tokensPerSecond: 43 },
      { firstTokenLatencyMs: 356, tokensPerSecond: 40 },
      { firstTokenLatencyMs: 322, tokensPerSecond: 46 },
      { firstTokenLatencyMs: 367, tokensPerSecond: 39 },
    ],
  },
  '12GB': {
    tier: '12GB',
    samples: [
      { firstTokenLatencyMs: 298, tokensPerSecond: 51 },
      { firstTokenLatencyMs: 274, tokensPerSecond: 55 },
      { firstTokenLatencyMs: 311, tokensPerSecond: 49 },
      { firstTokenLatencyMs: 285, tokensPerSecond: 53 },
      { firstTokenLatencyMs: 302, tokensPerSecond: 50 },
      { firstTokenLatencyMs: 268, tokensPerSecond: 57 },
      { firstTokenLatencyMs: 294, tokensPerSecond: 52 },
      { firstTokenLatencyMs: 316, tokensPerSecond: 48 },
      { firstTokenLatencyMs: 279, tokensPerSecond: 54 },
      { firstTokenLatencyMs: 307, tokensPerSecond: 50 },
    ],
  },
  '24GB': {
    tier: '24GB',
    samples: [
      { firstTokenLatencyMs: 198, tokensPerSecond: 63 },
      { firstTokenLatencyMs: 184, tokensPerSecond: 67 },
      { firstTokenLatencyMs: 212, tokensPerSecond: 61 },
      { firstTokenLatencyMs: 191, tokensPerSecond: 65 },
      { firstTokenLatencyMs: 205, tokensPerSecond: 62 },
      { firstTokenLatencyMs: 178, tokensPerSecond: 70 },
      { firstTokenLatencyMs: 195, tokensPerSecond: 64 },
      { firstTokenLatencyMs: 219, tokensPerSecond: 59 },
      { firstTokenLatencyMs: 187, tokensPerSecond: 66 },
      { firstTokenLatencyMs: 201, tokensPerSecond: 63 },
    ],
  },
}

// ── Week-1 published baselines (matches docs/en/17-benchmark-baseline-table.md) ─

const WEEK1_BASELINE = {
  '6GB':  { latencyMs: 700, tps: 28 },
  '8GB':  { latencyMs: 346, tps: 42 },
  '12GB': { latencyMs: 293, tps: 52 },
  '24GB': { latencyMs: 197, tps: 64 },
}

// ── Tier A — 6 GB ─────────────────────────────────────────────────────────────

test('Tier A 6GB: avg first-token latency is below the 1000ms alert threshold', () => {
  const report = buildReport(TIER_FIXTURES['6GB'])
  assert.equal(report.targets.latencyPass, true,
    `Tier A 6GB latency ${report.metrics.firstTokenLatencyMsAvg}ms exceeds 1000ms limit`)
})

test('Tier A 6GB: throughput is at boundary — baseline documents 28 tps (below 30 tps floor)', () => {
  // 6GB VRAM with a 7B Q4 model is a constrained tier; 28 tps is the measured baseline.
  // This test *documents* the known shortfall, not a pass condition.
  const report = buildReport(TIER_FIXTURES['6GB'])
  assert.equal(report.metrics.tokensPerSecondAvg, WEEK1_BASELINE['6GB'].tps,
    'Tier A 6GB throughput baseline has drifted — update docs/en/17-benchmark-baseline-table.md')
})

test('Tier A 6GB: sample count matches fixture', () => {
  const report = buildReport(TIER_FIXTURES['6GB'])
  assert.equal(report.metrics.sampleCount, 10)
})

// ── Tier A — 8 GB ─────────────────────────────────────────────────────────────

test('Tier A 8GB: latency and throughput both pass', () => {
  const report = buildReport(TIER_FIXTURES['8GB'])
  assert.equal(report.targets.latencyPass, true,
    `8GB latency ${report.metrics.firstTokenLatencyMsAvg}ms exceeds 500ms limit`)
  assert.equal(report.targets.throughputPass, true,
    `8GB throughput ${report.metrics.tokensPerSecondAvg} tps below 30 tps minimum`)
})

test('Tier A 8GB: avg latency within 10% of published baseline', () => {
  const report = buildReport(TIER_FIXTURES['8GB'])
  const baseline = WEEK1_BASELINE['8GB'].latencyMs
  const tolerance = baseline * 0.10
  assert.ok(
    Math.abs(report.metrics.firstTokenLatencyMsAvg - baseline) <= tolerance,
    `8GB latency ${report.metrics.firstTokenLatencyMsAvg}ms deviates > 10% from baseline ${baseline}ms`,
  )
})

// ── Tier B — 12 GB ────────────────────────────────────────────────────────────

test('Tier B 12GB: latency and throughput both pass', () => {
  const report = buildReport(TIER_FIXTURES['12GB'])
  assert.equal(report.targets.latencyPass, true,
    `12GB latency ${report.metrics.firstTokenLatencyMsAvg}ms exceeds 500ms limit`)
  assert.equal(report.targets.throughputPass, true,
    `12GB throughput ${report.metrics.tokensPerSecondAvg} tps below 30 tps minimum`)
})

test('Tier B 12GB: throughput at least 20% above the 30 tps minimum', () => {
  const report = buildReport(TIER_FIXTURES['12GB'])
  assert.ok(
    report.metrics.tokensPerSecondAvg >= 36,
    `Tier B should sustain ≥36 tps; got ${report.metrics.tokensPerSecondAvg}`,
  )
})

test('Tier B 12GB: avg latency within 10% of published baseline', () => {
  const report = buildReport(TIER_FIXTURES['12GB'])
  const baseline = WEEK1_BASELINE['12GB'].latencyMs
  const tolerance = baseline * 0.10
  assert.ok(
    Math.abs(report.metrics.firstTokenLatencyMsAvg - baseline) <= tolerance,
    `12GB latency ${report.metrics.firstTokenLatencyMsAvg}ms deviates > 10% from baseline ${baseline}ms`,
  )
})

// ── Tier C — 24 GB ────────────────────────────────────────────────────────────

test('Tier C 24GB: latency and throughput both pass', () => {
  const report = buildReport(TIER_FIXTURES['24GB'])
  assert.equal(report.targets.latencyPass, true,
    `24GB latency ${report.metrics.firstTokenLatencyMsAvg}ms exceeds 1000ms limit`)
  assert.equal(report.targets.throughputPass, true,
    `24GB throughput ${report.metrics.tokensPerSecondAvg} tps below 30 tps minimum`)
})

test('Tier C 24GB: throughput at least double the 30 tps minimum', () => {
  const report = buildReport(TIER_FIXTURES['24GB'])
  assert.ok(
    report.metrics.tokensPerSecondAvg >= 60,
    `Tier C should sustain ≥60 tps; got ${report.metrics.tokensPerSecondAvg}`,
  )
})

test('Tier C 24GB: avg latency within 10% of published baseline', () => {
  const report = buildReport(TIER_FIXTURES['24GB'])
  const baseline = WEEK1_BASELINE['24GB'].latencyMs
  const tolerance = baseline * 0.10
  assert.ok(
    Math.abs(report.metrics.firstTokenLatencyMsAvg - baseline) <= tolerance,
    `24GB latency ${report.metrics.firstTokenLatencyMsAvg}ms deviates > 10% from baseline ${baseline}ms`,
  )
})

// ── Cross-tier ordering invariants ────────────────────────────────────────────

test('latency decreases monotonically from Tier A 8GB → Tier B → Tier C', () => {
  const r8  = buildReport(TIER_FIXTURES['8GB'])
  const r12 = buildReport(TIER_FIXTURES['12GB'])
  const r24 = buildReport(TIER_FIXTURES['24GB'])
  assert.ok(
    r8.metrics.firstTokenLatencyMsAvg > r12.metrics.firstTokenLatencyMsAvg,
    `Expected 8GB latency > 12GB latency but got ${r8.metrics.firstTokenLatencyMsAvg} ≤ ${r12.metrics.firstTokenLatencyMsAvg}`,
  )
  assert.ok(
    r12.metrics.firstTokenLatencyMsAvg > r24.metrics.firstTokenLatencyMsAvg,
    `Expected 12GB latency > 24GB latency but got ${r12.metrics.firstTokenLatencyMsAvg} ≤ ${r24.metrics.firstTokenLatencyMsAvg}`,
  )
})

test('throughput increases monotonically from Tier A 8GB → Tier B → Tier C', () => {
  const r8  = buildReport(TIER_FIXTURES['8GB'])
  const r12 = buildReport(TIER_FIXTURES['12GB'])
  const r24 = buildReport(TIER_FIXTURES['24GB'])
  assert.ok(
    r8.metrics.tokensPerSecondAvg < r12.metrics.tokensPerSecondAvg,
    `Expected 8GB tps < 12GB tps but got ${r8.metrics.tokensPerSecondAvg} ≥ ${r12.metrics.tokensPerSecondAvg}`,
  )
  assert.ok(
    r12.metrics.tokensPerSecondAvg < r24.metrics.tokensPerSecondAvg,
    `Expected 12GB tps < 24GB tps but got ${r12.metrics.tokensPerSecondAvg} ≥ ${r24.metrics.tokensPerSecondAvg}`,
  )
})
