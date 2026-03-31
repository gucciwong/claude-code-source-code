import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildDailyPaths,
  buildCommands,
  extractStdoutFromExecError,
  buildRunSummary,
  evaluateExitCode,
  parseDailyRunArgs,
} from '../sovereign-week1-daily-run.mjs'

test('buildDailyPaths creates stable output file names', () => {
  const paths = buildDailyPaths({
    outDir: 'artifacts',
    date: '2026-04-01',
  })

  assert.equal(paths.runtimeFile, 'artifacts/week1-runtime-2026-04-01.json')
  assert.equal(paths.benchmarkFile, 'artifacts/week1-benchmark-2026-04-01.json')
  assert.equal(paths.evidenceFile, 'artifacts/week1-evidence-2026-04-01.json')
  assert.equal(paths.reportFile, 'artifacts/week1-report-2026-04-01.md')
  assert.equal(paths.checkpointFile, 'artifacts/week1-checkpoint-2026-04-01.txt')
})

test('buildDailyPaths defaults to artifacts when outDir is omitted', () => {
  const paths = buildDailyPaths({ date: '2026-04-01' })
  assert.equal(paths.runtimeFile, 'artifacts/week1-runtime-2026-04-01.json')
})

test('buildCommands wires runtime, benchmark, and evidence steps in order', () => {
  const commands = buildCommands({
    date: '2026-04-01',
    tier: '8GB',
    sampleFile: 'samples.json',
    runtimeFile: 'runtime.json',
    benchmarkFile: 'benchmark.json',
    evidenceFile: 'evidence.json',
    reportFile: 'report.md',
    checkpointFile: 'checkpoint.txt',
  })

  assert.equal(commands.length, 5)
  assert.match(commands[0], /sovereign-week1-runtime-check/)
  assert.match(commands[1], /sovereign-week1-benchmark/)
  assert.match(commands[2], /sovereign-week1-evidence-bundle/)
  assert.match(commands[3], /sovereign-week1-report/)
  assert.match(commands[4], /sovereign-week1-checkpoint/)
  assert.match(commands[2], /runtime\.json/)
  assert.match(commands[2], /benchmark\.json/)
  assert.match(commands[3], /report\.md/)
  assert.match(commands[4], /checkpoint\.txt/)
})

test('extractStdoutFromExecError returns stdout when command exits non-zero', () => {
  const error = {
    stdout: '{"runtime":{"reachable":false}}\n',
    stderr: 'failed',
    code: 2,
  }

  const stdout = extractStdoutFromExecError(error)
  assert.equal(stdout, '{"runtime":{"reachable":false}}\n')
})

test('extractStdoutFromExecError returns null for non-object or missing stdout', () => {
  assert.equal(extractStdoutFromExecError(null), null)
  assert.equal(extractStdoutFromExecError({}), null)
  assert.equal(extractStdoutFromExecError({ stdout: 123 }), null)
})

test('buildRunSummary returns compact machine-readable status object', () => {
  const summary = buildRunSummary({
    date: '2026-04-01',
    tier: '8GB',
    evidence: {
      gate: {
        readyForDemo: false,
        reason: 'Runtime is unreachable',
      },
    },
    output: {
      runtimeFile: 'a.json',
      benchmarkFile: 'b.json',
      evidenceFile: 'c.json',
      reportFile: 'd.md',
      checkpointFile: 'e.txt',
    },
  })

  assert.equal(summary.date, '2026-04-01')
  assert.equal(summary.tier, '8GB')
  assert.equal(summary.readyForDemo, false)
  assert.equal(summary.reason, 'Runtime is unreachable')
  assert.equal(summary.output.evidenceFile, 'c.json')
})

test('buildRunSummary returns readyForDemo true when gate is satisfied', () => {
  const summary = buildRunSummary({
    date: '2026-04-01',
    tier: '8GB',
    evidence: {
      gate: { readyForDemo: true, reason: 'All Week 1 gate signals are green' },
    },
    output: {},
  })

  assert.equal(summary.readyForDemo, true)
})

test('buildRunSummary uses fallback reason when evidence gate reason is absent', () => {
  const summary = buildRunSummary({
    date: '2026-04-01',
    tier: '8GB',
    evidence: null,
    output: {},
  })

  assert.equal(summary.readyForDemo, false)
  assert.match(summary.reason, /No gate reason available/)
})

test('evaluateExitCode returns 2 only when strict gate mode is enabled and run is blocked', () => {
  assert.equal(evaluateExitCode({ strictGate: false, readyForDemo: false }), 0)
  assert.equal(evaluateExitCode({ strictGate: true, readyForDemo: true }), 0)
  assert.equal(evaluateExitCode({ strictGate: true, readyForDemo: false }), 2)
})

test('parseDailyRunArgs throws when --tier value is missing', () => {
  assert.throws(
    () => parseDailyRunArgs(['node', 'scripts/sovereign-week1-daily-run.mjs', '--tier']),
    /Missing value for --tier/,
  )
})

test('parseDailyRunArgs throws when --date value is missing', () => {
  assert.throws(
    () => parseDailyRunArgs(['node', 'scripts/sovereign-week1-daily-run.mjs', '--date']),
    /Missing value for --date/,
  )
})

test('parseDailyRunArgs throws when --sample-file value is missing', () => {
  assert.throws(
    () => parseDailyRunArgs(['node', 'scripts/sovereign-week1-daily-run.mjs', '--sample-file']),
    /Missing value for --sample-file/,
  )
})

test('parseDailyRunArgs throws when --out-dir value is missing', () => {
  assert.throws(
    () => parseDailyRunArgs(['node', 'scripts/sovereign-week1-daily-run.mjs', '--out-dir']),
    /Missing value for --out-dir/,
  )
})

test('parseDailyRunArgs throws when --tier value is unsupported', () => {
  assert.throws(
    () => parseDailyRunArgs(['node', 'scripts/sovereign-week1-daily-run.mjs', '--tier', '16GB']),
    /Unsupported --tier value/,
  )
})

test('parseDailyRunArgs parses provided values and booleans', () => {
  const args = parseDailyRunArgs([
    'node',
    'scripts/sovereign-week1-daily-run.mjs',
    '--date',
    '2026-04-01',
    '--tier',
    '12GB',
    '--out-dir',
    'custom-artifacts',
    '--sample-file',
    'samples.json',
    '--dry-run',
    '--strict-gate',
  ])

  assert.equal(args.date, '2026-04-01')
  assert.equal(args.tier, '12GB')
  assert.equal(args.outDir, 'custom-artifacts')
  assert.equal(args.sampleFile, 'samples.json')
  assert.equal(args.dryRun, true)
  assert.equal(args.strictGate, true)
})

test('parseDailyRunArgs throws on unknown options', () => {
  assert.throws(
    () => parseDailyRunArgs(['node', 'scripts/sovereign-week1-daily-run.mjs', '--unknown-flag']),
    /Unknown option for daily-run CLI/,
  )
})

test('parseDailyRunArgs throws on unknown short options', () => {
  assert.throws(
    () => parseDailyRunArgs(['node', 'scripts/sovereign-week1-daily-run.mjs', '-x']),
    /Unknown option for daily-run CLI/,
  )
})

test('parseDailyRunArgs throws on positional arguments', () => {
  assert.throws(
    () => parseDailyRunArgs(['node', 'scripts/sovereign-week1-daily-run.mjs', 'unexpected']),
    /Unexpected positional argument/,
  )
})
