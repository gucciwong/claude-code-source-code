import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import {
  buildMarkdownReport,
  summarizeReadiness,
  parseReportArgs,
} from '../sovereign-week1-report.mjs'

const execFileAsync = promisify(execFile)

test('summarizeReadiness maps gate state to readable summary', () => {
  const summary = summarizeReadiness({
    gate: { readyForDemo: false, reason: 'Runtime is unreachable' },
  })

  assert.equal(summary.status, 'Blocked')
  assert.match(summary.message, /Runtime is unreachable/)
})

test('summarizeReadiness returns Ready status when gate is satisfied', () => {
  const summary = summarizeReadiness({
    gate: { readyForDemo: true, reason: 'All Week 1 gate signals are green' },
  })

  assert.equal(summary.status, 'Ready')
  assert.match(summary.message, /green/i)
})

test('summarizeReadiness uses fallback message when reason is absent', () => {
  const summary = summarizeReadiness({ gate: { readyForDemo: false } })
  assert.equal(summary.status, 'Blocked')
  assert.match(summary.message, /Gate not satisfied/)
})

test('summarizeReadiness uses ready fallback message when reason is absent', () => {
  const summary = summarizeReadiness({ gate: { readyForDemo: true } })
  assert.equal(summary.status, 'Ready')
  assert.match(summary.message, /Ready for demo/)
})

test('buildMarkdownReport includes key metrics and status', () => {
  const report = buildMarkdownReport({
    date: '2026-04-01',
    runtimeReachable: true,
    modelCount: 2,
    metrics: {
      firstTokenLatencyMsAvg: 483,
      tokensPerSecondAvg: 33,
      sampleCount: 3,
    },
    targets: {
      latencyPass: true,
      throughputPass: true,
      latencyLimitMs: 500,
      throughputMinimumTps: 30,
    },
    gate: {
      readyForDemo: true,
      reason: 'All Week 1 gate signals are green',
    },
  })

  assert.match(report, /^# Sovereign Week 1 Daily Report/m)
  assert.match(report, /Date: 2026-04-01/)
  assert.match(report, /Runtime reachable: yes/)
  assert.match(report, /Average first-token latency \(ms\): 483/)
  assert.match(report, /Average throughput \(tps\): 33/)
  assert.match(report, /Overall readiness: Ready/)
})

test('buildMarkdownReport renders fail indicators for targets not met', () => {
  const report = buildMarkdownReport({
    date: '2026-04-01',
    runtimeReachable: false,
    modelCount: 0,
    metrics: {
      firstTokenLatencyMsAvg: 650,
      tokensPerSecondAvg: 20,
      sampleCount: 2,
    },
    targets: {
      latencyPass: false,
      throughputPass: false,
      latencyLimitMs: 500,
      throughputMinimumTps: 30,
    },
    gate: { readyForDemo: false, reason: 'Latency target failed' },
  })

  assert.match(report, /Runtime reachable: no/)
  assert.match(report, /Latency target.*fail/)
  assert.match(report, /Throughput target.*fail/)
  assert.match(report, /Overall readiness: Blocked/)
})

test('buildMarkdownReport falls back to defaults when evidence fields are missing', () => {
  const report = buildMarkdownReport({ gate: { readyForDemo: false } })

  assert.match(report, /Date: unknown/)
  assert.match(report, /Runtime reachable: no/)
  assert.match(report, /Models discovered: 0/)
  assert.match(report, /Average first-token latency \(ms\): n\/a/)
  assert.match(report, /Average throughput \(tps\): n\/a/)
})

test('parseReportArgs parses explicit file arguments', () => {
  const args = parseReportArgs([
    'node',
    'scripts/sovereign-week1-report.mjs',
    '--evidence-file',
    'artifacts/week1-evidence.json',
    '--out-file',
    'artifacts/week1-report.md',
  ])

  assert.equal(args.evidenceFile, 'artifacts/week1-evidence.json')
  assert.equal(args.outFile, 'artifacts/week1-report.md')
})

test('parseReportArgs throws when evidence-file value is missing', () => {
  assert.throws(
    () => parseReportArgs(['node', 'scripts/sovereign-week1-report.mjs', '--evidence-file']),
    /Missing value for --evidence-file/,
  )
})

test('parseReportArgs throws when out-file value is missing', () => {
  assert.throws(
    () => parseReportArgs(['node', 'scripts/sovereign-week1-report.mjs', '--out-file']),
    /Missing value for --out-file/,
  )
})

test('parseReportArgs throws on unknown options', () => {
  assert.throws(
    () => parseReportArgs(['node', 'scripts/sovereign-week1-report.mjs', '--unknown']),
    /Unknown option for report CLI/,
  )
})

test('parseReportArgs throws on unknown short options', () => {
  assert.throws(
    () => parseReportArgs(['node', 'scripts/sovereign-week1-report.mjs', '-x']),
    /Unknown option for report CLI/,
  )
})

test('parseReportArgs throws on positional arguments', () => {
  assert.throws(
    () => parseReportArgs(['node', 'scripts/sovereign-week1-report.mjs', 'unexpected']),
    /Unexpected positional argument/,
  )
})

test('report CLI reads evidence and writes markdown report file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'week1-report-'))
  const evidenceFile = join(dir, 'evidence.json')
  const outFile = join(dir, 'report.md')

  await writeFile(
    evidenceFile,
    JSON.stringify({
      date: '2026-04-02',
      runtimeReachable: true,
      modelCount: 2,
      metrics: { sampleCount: 2, firstTokenLatencyMsAvg: 470, tokensPerSecondAvg: 34 },
      targets: { latencyPass: true, throughputPass: true, latencyLimitMs: 500, throughputMinimumTps: 30 },
      gate: { readyForDemo: true, reason: 'All Week 1 gate signals are green' },
    }),
    'utf8',
  )

  const { stdout } = await execFileAsync(process.execPath, [
    'scripts/sovereign-week1-report.mjs',
    '--evidence-file',
    evidenceFile,
    '--out-file',
    outFile,
  ])

  const payload = JSON.parse(stdout)
  assert.equal(payload.evidenceFile, evidenceFile)
  assert.equal(payload.outFile, outFile)

  const markdown = await readFile(outFile, 'utf8')
  assert.match(markdown, /Date: 2026-04-02/)
  assert.match(markdown, /Overall readiness: Ready/)
})

test('report --help prints usage text', async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    'scripts/sovereign-week1-report.mjs',
    '--help',
  ])

  assert.match(stdout, /Usage: node scripts\/sovereign-week1-report\.mjs/)
  assert.match(stdout, /--out-file <path>/)
})
