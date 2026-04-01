import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import {
  buildEvidenceBundle,
  summarizeGateSignals,
  parseEvidenceBundleArgs,
} from '../sovereign-week1-evidence-bundle.mjs'

const execFileAsync = promisify(execFile)

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

test('evidence-bundle --help prints usage text', async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    'scripts/sovereign-week1-evidence-bundle.mjs',
    '--help',
  ])

  assert.match(stdout, /Usage: node scripts\/sovereign-week1-evidence-bundle\.mjs/)
  assert.match(stdout, /--runtime-file <path>/)
  assert.match(stdout, /--benchmark-file <path>/)
})

test('evidence-bundle CLI exits with error when required files are missing', async () => {
  await assert.rejects(
    execFileAsync(process.execPath, [
      'scripts/sovereign-week1-evidence-bundle.mjs',
      '--date',
      '2026-04-01',
    ]),
    error => {
      assert.equal(error.code, 1)
      assert.match(error.stderr, /both --runtime-file and --benchmark-file are required/)
      return true
    },
  )
})

test('evidence-bundle CLI emits JSON output with full passing gate', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'week1-evidence-bundle-'))
  const runtimeFile = join(dir, 'runtime.json')
  const benchmarkFile = join(dir, 'benchmark.json')

  await writeFile(
    runtimeFile,
    JSON.stringify({
      runtime: { reachable: true, host: '127.0.0.1', port: 11434, error: null },
      models: { count: 2, names: ['model-a', 'model-b'] },
    }),
    'utf8',
  )

  await writeFile(
    benchmarkFile,
    JSON.stringify({
      metrics: { sampleCount: 3, firstTokenLatencyMsAvg: 490, tokensPerSecondAvg: 34 },
      targets: { latencyPass: true, throughputPass: true, latencyLimitMs: 500, throughputMinimumTps: 30 },
    }),
    'utf8',
  )

  const { stdout } = await execFileAsync(process.execPath, [
    'scripts/sovereign-week1-evidence-bundle.mjs',
    '--date',
    '2026-04-01',
    '--runtime-file',
    runtimeFile,
    '--benchmark-file',
    benchmarkFile,
    '--json',
  ])

  const payload = JSON.parse(stdout)
  assert.equal(payload.date, '2026-04-01')
  assert.equal(payload.runtimeReachable, true)
  assert.equal(payload.modelCount, 2)
  assert.equal(payload.gate.readyForDemo, true)
  assert.match(payload.gate.reason, /green/i)
})

test('evidence-bundle CLI prints human-readable output', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'week1-evidence-bundle-human-'))
  const runtimeFile = join(dir, 'runtime.json')
  const benchmarkFile = join(dir, 'benchmark.json')

  await writeFile(
    runtimeFile,
    JSON.stringify({
      runtime: { reachable: true, host: '127.0.0.1', port: 11434, error: null },
      models: { count: 1, names: ['model-a'] },
    }),
    'utf8',
  )

  await writeFile(
    benchmarkFile,
    JSON.stringify({
      metrics: { sampleCount: 2, firstTokenLatencyMsAvg: 450, tokensPerSecondAvg: 35 },
      targets: { latencyPass: true, throughputPass: true, latencyLimitMs: 500, throughputMinimumTps: 30 },
    }),
    'utf8',
  )

  const { stdout } = await execFileAsync(process.execPath, [
    'scripts/sovereign-week1-evidence-bundle.mjs',
    '--date',
    '2026-04-01',
    '--runtime-file',
    runtimeFile,
    '--benchmark-file',
    benchmarkFile,
  ])

  assert.match(stdout, /Sovereign Week 1 Evidence Bundle/)
  assert.match(stdout, /Date: 2026-04-01/)
  assert.match(stdout, /Runtime reachable: yes/)
  assert.match(stdout, /Models discovered: 1/)
  assert.match(stdout, /Ready for demo: yes/)
})

test('evidence-bundle CLI exits with code 2 when gate is blocked', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'week1-evidence-bundle-blocked-'))
  const runtimeFile = join(dir, 'runtime.json')
  const benchmarkFile = join(dir, 'benchmark.json')

  await writeFile(
    runtimeFile,
    JSON.stringify({
      runtime: { reachable: false, host: '127.0.0.1', port: 11434, error: 'Connection refused' },
      models: { count: 0, names: [] },
    }),
    'utf8',
  )

  await writeFile(
    benchmarkFile,
    JSON.stringify({
      metrics: { sampleCount: 0, firstTokenLatencyMsAvg: null, tokensPerSecondAvg: null },
      targets: { latencyPass: false, throughputPass: false, latencyLimitMs: 500, throughputMinimumTps: 30 },
    }),
    'utf8',
  )

  await assert.rejects(
    execFileAsync(process.execPath, [
      'scripts/sovereign-week1-evidence-bundle.mjs',
      '--date',
      '2026-04-01',
      '--runtime-file',
      runtimeFile,
      '--benchmark-file',
      benchmarkFile,
      '--json',
    ]),
    error => {
      assert.equal(error.code, 2)
      const payload = JSON.parse(error.stdout)
      assert.equal(payload.gate.readyForDemo, false)
      assert.match(payload.gate.reason, /unreachable/i)
      return true
    },
  )
})

test('parseEvidenceBundleArgs handles --help by calling process.exit', () => {
  const originalExit = process.exit
  let exitCalled = false
  process.exit = () => { exitCalled = true; throw new Error('exit') }
  try { parseEvidenceBundleArgs(['node', 'scripts/sovereign-week1-evidence-bundle.mjs', '--help']) } catch {}
  finally { process.exit = originalExit }
  assert.equal(exitCalled, true)
})

test('parseEvidenceBundleArgs handles -h by calling process.exit', () => {
  const originalExit = process.exit
  let exitCalled = false
  process.exit = () => { exitCalled = true; throw new Error('exit') }
  try { parseEvidenceBundleArgs(['node', 'scripts/sovereign-week1-evidence-bundle.mjs', '-h']) } catch {}
  finally { process.exit = originalExit }
  assert.equal(exitCalled, true)
})

test('evidence-bundle CLI prints human output showing runtime unreachable and not ready', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'week1-evidence-bundle-blocked-human-'))
  const runtimeFile = join(dir, 'runtime.json')
  const benchmarkFile = join(dir, 'benchmark.json')

  await writeFile(
    runtimeFile,
    JSON.stringify({
      runtime: { reachable: false, host: '127.0.0.1', port: 11434, error: 'Connection refused' },
      models: { count: 0, names: [] },
    }),
    'utf8',
  )

  await writeFile(
    benchmarkFile,
    JSON.stringify({
      metrics: { sampleCount: 0, firstTokenLatencyMsAvg: null, tokensPerSecondAvg: null },
      targets: { latencyPass: false, throughputPass: false, latencyLimitMs: 500, throughputMinimumTps: 30 },
    }),
    'utf8',
  )

  await assert.rejects(
    execFileAsync(process.execPath, [
      'scripts/sovereign-week1-evidence-bundle.mjs',
      '--date',
      '2026-04-01',
      '--runtime-file',
      runtimeFile,
      '--benchmark-file',
      benchmarkFile,
    ]),
    error => {
      assert.equal(error.code, 2)
      assert.match(error.stdout, /Runtime reachable: no/)
      assert.match(error.stdout, /Ready for demo: no/)
      return true
    },
  )
})
