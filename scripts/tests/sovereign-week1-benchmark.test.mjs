import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import {
  computeMetrics,
  validateSamples,
  buildReport,
  parseBenchmarkArgs,
} from '../sovereign-week1-benchmark.mjs'

const execFileAsync = promisify(execFile)

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

test('validateSamples rejects non-number firstTokenLatencyMs', () => {
  assert.throws(
    () => validateSamples([{ firstTokenLatencyMs: 'fast', tokensPerSecond: 35 }]),
    /firstTokenLatencyMs/,
  )
})

test('validateSamples rejects non-number tokensPerSecond', () => {
  assert.throws(
    () => validateSamples([{ firstTokenLatencyMs: 300, tokensPerSecond: null }]),
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

test('parseBenchmarkArgs parses explicit file, tier, and json flag', () => {
  const args = parseBenchmarkArgs([
    'node',
    'scripts/sovereign-week1-benchmark.mjs',
    '--file',
    'samples.json',
    '--tier',
    '12GB',
    '--json',
  ])

  assert.equal(args.file, 'samples.json')
  assert.equal(args.tier, '12GB')
  assert.equal(args.json, true)
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

test('benchmark CLI emits JSON report when --json is provided', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'week1-benchmark-'))
  const file = join(dir, 'samples.json')

  await writeFile(
    file,
    JSON.stringify([
      { firstTokenLatencyMs: 420, tokensPerSecond: 35 },
      { firstTokenLatencyMs: 480, tokensPerSecond: 33 },
    ]),
    'utf8',
  )

  const { stdout } = await execFileAsync(process.execPath, [
    'scripts/sovereign-week1-benchmark.mjs',
    '--file',
    file,
    '--tier',
    '8GB',
    '--json',
  ])

  const payload = JSON.parse(stdout)
  assert.equal(payload.profile.normalizedTier, '8GB')
  assert.equal(payload.targets.latencyPass, true)
  assert.equal(payload.targets.throughputPass, true)
})

test('benchmark CLI prints human output and exits 2 when gate fails', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'week1-benchmark-fail-'))
  const file = join(dir, 'samples.json')

  await writeFile(
    file,
    JSON.stringify([
      { firstTokenLatencyMs: 900, tokensPerSecond: 20 },
      { firstTokenLatencyMs: 950, tokensPerSecond: 22 },
    ]),
    'utf8',
  )

  await assert.rejects(
    execFileAsync(process.execPath, [
      'scripts/sovereign-week1-benchmark.mjs',
      '--file',
      file,
      '--tier',
      '8GB',
    ]),
    error => {
      assert.equal(error.code, 2)
      assert.match(error.stdout, /Sovereign Week 1 Benchmark Report/)
      assert.match(error.stdout, /Latency target .*FAIL/)
      assert.match(error.stdout, /Throughput target .*FAIL/)
      return true
    },
  )
})

test('benchmark --help prints usage text', async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    'scripts/sovereign-week1-benchmark.mjs',
    '--help',
  ])

  assert.match(stdout, /Usage: node scripts\/sovereign-week1-benchmark\.mjs/)
  assert.match(stdout, /--tier <tier>/)
})

test('benchmark CLI exits with error when --file argument is missing', async () => {
  await assert.rejects(
    execFileAsync(process.execPath, [
      'scripts/sovereign-week1-benchmark.mjs',
      '--tier',
      '8GB',
    ]),
    error => {
      assert.equal(error.code, 1)
      assert.match(error.stderr, /missing required argument: --file/)
      return true
    },
  )
})

test('buildReport uses 1000ms latency limit for 24GB tier', () => {
  const report = buildReport({
    tier: '24GB',
    samples: [{ firstTokenLatencyMs: 800, tokensPerSecond: 35 }],
  })

  assert.equal(report.targets.latencyLimitMs, 1000)
  assert.equal(report.profile.normalizedTier, '24GB')
})

test('benchmark CLI prints human output with PASS labels and default tier when targets are met', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'week1-benchmark-pass-'))
  const file = join(dir, 'samples.json')

  await writeFile(
    file,
    JSON.stringify([
      { firstTokenLatencyMs: 300, tokensPerSecond: 40 },
      { firstTokenLatencyMs: 350, tokensPerSecond: 38 },
    ]),
    'utf8',
  )

  const { stdout } = await execFileAsync(process.execPath, [
    'scripts/sovereign-week1-benchmark.mjs',
    '--file',
    file,
  ])

  assert.match(stdout, /Tier: default/)
  assert.match(stdout, /Latency target .* PASS/)
  assert.match(stdout, /Throughput target .* PASS/)
})

test('parseBenchmarkArgs handles --help by calling process.exit', () => {
  const originalExit = process.exit
  let exitCalled = false
  process.exit = () => { exitCalled = true; throw new Error('exit') }
  try { parseBenchmarkArgs(['node', 'scripts/sovereign-week1-benchmark.mjs', '--help']) } catch {}
  finally { process.exit = originalExit }
  assert.equal(exitCalled, true)
})

test('parseBenchmarkArgs handles -h by calling process.exit', () => {
  const originalExit = process.exit
  let exitCalled = false
  process.exit = () => { exitCalled = true; throw new Error('exit') }
  try { parseBenchmarkArgs(['node', 'scripts/sovereign-week1-benchmark.mjs', '-h']) } catch {}
  finally { process.exit = originalExit }
  assert.equal(exitCalled, true)
})
