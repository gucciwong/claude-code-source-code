import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildDailyPaths,
  buildCommands,
} from '../sovereign-week1-daily-run.mjs'

test('buildDailyPaths creates stable output file names', () => {
  const paths = buildDailyPaths({
    outDir: 'artifacts',
    date: '2026-04-01',
  })

  assert.equal(paths.runtimeFile, 'artifacts/week1-runtime-2026-04-01.json')
  assert.equal(paths.benchmarkFile, 'artifacts/week1-benchmark-2026-04-01.json')
  assert.equal(paths.evidenceFile, 'artifacts/week1-evidence-2026-04-01.json')
})

test('buildCommands wires runtime, benchmark, and evidence steps in order', () => {
  const commands = buildCommands({
    date: '2026-04-01',
    tier: '8GB',
    sampleFile: 'samples.json',
    runtimeFile: 'runtime.json',
    benchmarkFile: 'benchmark.json',
    evidenceFile: 'evidence.json',
  })

  assert.equal(commands.length, 3)
  assert.match(commands[0], /sovereign-week1-runtime-check/)
  assert.match(commands[1], /sovereign-week1-benchmark/)
  assert.match(commands[2], /sovereign-week1-evidence-bundle/)
  assert.match(commands[2], /runtime\.json/)
  assert.match(commands[2], /benchmark\.json/)
})
