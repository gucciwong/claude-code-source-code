import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import {
  buildCheckpointSummary,
  toCheckpointText,
  parseCheckpointArgs,
} from '../sovereign-week1-checkpoint.mjs'

const execFileAsync = promisify(execFile)

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

test('buildCheckpointSummary falls back to unknown and n/a defaults', () => {
  const summary = buildCheckpointSummary({})

  assert.equal(summary.date, 'unknown')
  assert.equal(summary.readiness, 'Blocked')
  assert.equal(summary.latencyMs, 'n/a')
  assert.equal(summary.throughputTps, 'n/a')
  assert.equal(summary.reason, 'No gate reason available')
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

test('parseCheckpointArgs parses explicit file arguments', () => {
  const args = parseCheckpointArgs([
    'node',
    'scripts/sovereign-week1-checkpoint.mjs',
    '--evidence-file',
    'artifacts/week1-evidence.json',
    '--out-file',
    'artifacts/week1-checkpoint.txt',
  ])

  assert.equal(args.evidenceFile, 'artifacts/week1-evidence.json')
  assert.equal(args.outFile, 'artifacts/week1-checkpoint.txt')
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

test('checkpoint CLI reads evidence and writes checkpoint text file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'week1-checkpoint-'))
  const evidenceFile = join(dir, 'evidence.json')
  const outFile = join(dir, 'checkpoint.txt')

  await writeFile(
    evidenceFile,
    JSON.stringify({
      date: '2026-04-02',
      metrics: { firstTokenLatencyMsAvg: 470, tokensPerSecondAvg: 34 },
      gate: { readyForDemo: true, reason: 'All Week 1 gate signals are green' },
    }),
    'utf8',
  )

  const { stdout } = await execFileAsync(process.execPath, [
    'scripts/sovereign-week1-checkpoint.mjs',
    '--evidence-file',
    evidenceFile,
    '--out-file',
    outFile,
  ])

  const payload = JSON.parse(stdout)
  assert.equal(payload.evidenceFile, evidenceFile)
  assert.equal(payload.outFile, outFile)

  const text = await readFile(outFile, 'utf8')
  assert.match(text, /Week 1 Checkpoint \(2026-04-02\)/)
  assert.match(text, /Readiness: Ready/)
})

test('checkpoint --help prints usage text', async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    'scripts/sovereign-week1-checkpoint.mjs',
    '--help',
  ])

  assert.match(stdout, /Usage: node scripts\/sovereign-week1-checkpoint\.mjs/)
  assert.match(stdout, /--evidence-file <path>/)
})

test('checkpoint CLI exits with error when required arguments are missing', async () => {
  await assert.rejects(
    execFileAsync(process.execPath, [
      'scripts/sovereign-week1-checkpoint.mjs',
      '--evidence-file',
      'some-file.json',
    ]),
    error => {
      assert.equal(error.code, 1)
      assert.match(error.stderr, /both --evidence-file and --out-file are required/)
      return true
    },
  )
})
