import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildDailyPaths,
  buildCommands,
  extractStdoutFromExecError,
  buildRunSummary,
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
