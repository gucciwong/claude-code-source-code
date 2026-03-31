import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import {
  computeTrendMetrics,
  buildTrendReport,
  sortSummariesByDate,
  parseTrendArgs,
  isWeek1SummaryFileName,
} from '../sovereign-week1-trend.mjs'

const execFileAsync = promisify(execFile)

test('sortSummariesByDate sorts ascending by date key', () => {
  const sorted = sortSummariesByDate([
    { date: '2026-04-03' },
    { date: '2026-04-01' },
    { date: '2026-04-02' },
  ])

  assert.deepEqual(sorted.map(item => item.date), [
    '2026-04-01',
    '2026-04-02',
    '2026-04-03',
  ])
})

test('computeTrendMetrics returns readiness rate and reason breakdown', () => {
  const metrics = computeTrendMetrics([
    { date: '2026-04-01', readyForDemo: false, reason: 'Runtime is unreachable' },
    { date: '2026-04-02', readyForDemo: true, reason: 'Ready for demo' },
    { date: '2026-04-03', readyForDemo: false, reason: 'Throughput below threshold' },
  ])

  assert.equal(metrics.totalDays, 3)
  assert.equal(metrics.readyDays, 1)
  assert.equal(metrics.blockedDays, 2)
  assert.equal(metrics.readinessRate, 0.333)
  assert.equal(metrics.latestBlockedStreak, 1)
  assert.equal(metrics.readinessTargetPass, false)
  assert.equal(metrics.window.startDate, '2026-04-01')
  assert.equal(metrics.window.endDate, '2026-04-03')
  assert.equal(metrics.blockedReasonCounts['Runtime is unreachable'], 1)
  assert.equal(metrics.blockedReasonCounts['Throughput below threshold'], 1)
})

test('computeTrendMetrics returns zero metrics for empty input', () => {
  const metrics = computeTrendMetrics([])

  assert.equal(metrics.totalDays, 0)
  assert.equal(metrics.readyDays, 0)
  assert.equal(metrics.readinessRate, 0)
  assert.equal(metrics.latestBlockedStreak, 0)
  assert.strictEqual(metrics.window.startDate, null)
  assert.strictEqual(metrics.window.endDate, null)
  assert.deepStrictEqual(metrics.blockedReasonCounts, {})
})

test('computeTrendMetrics handles all-ready days with zero blocked streak', () => {
  const metrics = computeTrendMetrics([
    { date: '2026-04-01', readyForDemo: true, reason: 'All green' },
    { date: '2026-04-02', readyForDemo: true, reason: 'All green' },
  ])

  assert.equal(metrics.readyDays, 2)
  assert.equal(metrics.blockedDays, 0)
  assert.equal(metrics.latestBlockedStreak, 0)
  assert.deepStrictEqual(metrics.blockedReasonCounts, {})
})

test('computeTrendMetrics uses Unknown reason fallback for items with no reason field', () => {
  const metrics = computeTrendMetrics([
    { date: '2026-04-01', readyForDemo: false },
  ])

  assert.equal(metrics.blockedReasonCounts['Unknown reason'], 1)
})

test('computeTrendMetrics allows custom readiness threshold and computes blocked streak', () => {
  const metrics = computeTrendMetrics(
    [
      { date: '2026-04-01', readyForDemo: true, reason: 'Ready for demo' },
      { date: '2026-04-02', readyForDemo: false, reason: 'Runtime is unreachable' },
      { date: '2026-04-03', readyForDemo: false, reason: 'Runtime is unreachable' },
    ],
    { readinessThreshold: 0.3 },
  )

  assert.equal(metrics.latestBlockedStreak, 2)
  assert.equal(metrics.readinessTargetPass, true)
})

test('computeTrendMetrics uses default readiness threshold when option is invalid', () => {
  const metrics = computeTrendMetrics(
    [
      { date: '2026-04-01', readyForDemo: true },
      { date: '2026-04-02', readyForDemo: false, reason: 'Runtime is unreachable' },
    ],
    { readinessThreshold: Number.NaN },
  )

  assert.equal(metrics.readinessThreshold, 0.6)
  assert.equal(metrics.readinessTargetPass, false)
})

test('buildTrendReport includes high-level metrics and top blocked reasons', () => {
  const report = buildTrendReport({
    totalDays: 4,
    readyDays: 3,
    blockedDays: 1,
    readinessRate: 0.75,
    readinessTargetPass: true,
    latestBlockedStreak: 0,
    window: {
      startDate: '2026-04-01',
      endDate: '2026-04-04',
    },
    blockedReasonCounts: {
      'Runtime is unreachable': 1,
    },
  })

  assert.match(report, /Sovereign Week1 Trend Report/)
  assert.match(report, /Readiness rate: 75\.0%/)
  assert.match(report, /Readiness target pass: true/)
  assert.match(report, /Latest blocked streak: 0 day\(s\)/)
  assert.match(report, /Window: 2026-04-01 to 2026-04-04/)
  assert.match(report, /Runtime is unreachable: 1/)
})

test('buildTrendReport renders None when there are no blocked reasons', () => {
  const report = buildTrendReport({
    totalDays: 3,
    readyDays: 3,
    blockedDays: 0,
    readinessRate: 1.0,
    readinessTargetPass: true,
    latestBlockedStreak: 0,
    window: { startDate: '2026-04-01', endDate: '2026-04-03' },
    blockedReasonCounts: {},
  })

  assert.match(report, /- None/)
})

test('parseTrendArgs throws when readiness-threshold value is missing', () => {
  assert.throws(
    () => parseTrendArgs(['node', 'scripts/sovereign-week1-trend.mjs', '--readiness-threshold']),
    /Missing value for --readiness-threshold/,
  )
})

test('parseTrendArgs throws when --readiness-threshold value is invalid', () => {
  assert.throws(
    () => parseTrendArgs(['node', 'scripts/sovereign-week1-trend.mjs', '--readiness-threshold', '1.5']),
    /Invalid --readiness-threshold/,
  )
})

test('parseTrendArgs throws when --dir value is missing', () => {
  assert.throws(
    () => parseTrendArgs(['node', 'scripts/sovereign-week1-trend.mjs', '--dir']),
    /Missing value for --dir/,
  )
})

test('parseTrendArgs parses explicit values and json flag', () => {
  const args = parseTrendArgs([
    'node',
    'scripts/sovereign-week1-trend.mjs',
    '--dir',
    'custom-artifacts',
    '--readiness-threshold',
    '0.75',
    '--json',
  ])

  assert.equal(args.dir, 'custom-artifacts')
  assert.equal(args.readinessThreshold, 0.75)
  assert.equal(args.json, true)
})

test('parseTrendArgs throws on unknown options', () => {
  assert.throws(
    () => parseTrendArgs(['node', 'scripts/sovereign-week1-trend.mjs', '--unknown-flag']),
    /Unknown option for trend CLI/,
  )
})

test('parseTrendArgs throws on unknown short options', () => {
  assert.throws(
    () => parseTrendArgs(['node', 'scripts/sovereign-week1-trend.mjs', '-x']),
    /Unknown option for trend CLI/,
  )
})

test('parseTrendArgs throws on positional arguments', () => {
  assert.throws(
    () => parseTrendArgs(['node', 'scripts/sovereign-week1-trend.mjs', 'unexpected']),
    /Unexpected positional argument/,
  )
})

test('isWeek1SummaryFileName accepts both date and numeric run keys', () => {
  assert.equal(isWeek1SummaryFileName('week1-summary-2026-04-01.json'), true)
  assert.equal(isWeek1SummaryFileName('week1-summary-1042.json'), true)
  assert.equal(isWeek1SummaryFileName('week1-summary-.json'), false)
  assert.equal(isWeek1SummaryFileName('week1-report-2026-04-01.md'), false)
})

test('trend CLI reads summary files from directory and emits JSON metrics', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'week1-trend-'))

  await writeFile(
    join(dir, 'week1-summary-2026-04-01.json'),
    JSON.stringify({ date: '2026-04-01', readyForDemo: true, reason: 'Ready' }),
    'utf8',
  )
  await writeFile(
    join(dir, 'week1-summary-2026-04-02.json'),
    JSON.stringify({ date: '2026-04-02', readyForDemo: false, reason: 'Runtime is unreachable' }),
    'utf8',
  )
  await writeFile(join(dir, 'ignore-me.json'), JSON.stringify({ ok: true }), 'utf8')

  const { stdout } = await execFileAsync(process.execPath, [
    'scripts/sovereign-week1-trend.mjs',
    '--dir',
    dir,
    '--json',
  ])

  const metrics = JSON.parse(stdout)
  assert.equal(metrics.totalDays, 2)
  assert.equal(metrics.readyDays, 1)
  assert.equal(metrics.blockedDays, 1)
  assert.equal(metrics.window.startDate, '2026-04-01')
  assert.equal(metrics.window.endDate, '2026-04-02')
})
