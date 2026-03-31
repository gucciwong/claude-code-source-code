import test from 'node:test'
import assert from 'node:assert/strict'

import {
  parseCiArgs,
  buildDailyRunArgs,
  classifyExitCode,
} from '../sovereign-week1-ci-run.mjs'

test('parseCiArgs defaults to soft mode and forwards no extra args', () => {
  const parsed = parseCiArgs(['node', 'scripts/sovereign-week1-ci-run.mjs'])

  assert.equal(parsed.mode, 'soft')
  assert.deepEqual(parsed.forwardArgs, [])
})

test('parseCiArgs accepts hard mode and forwards remaining args', () => {
  const parsed = parseCiArgs([
    'node',
    'scripts/sovereign-week1-ci-run.mjs',
    '--mode',
    'hard',
    '--date',
    '2026-04-01',
    '--tier',
    '8GB',
  ])

  assert.equal(parsed.mode, 'hard')
  assert.deepEqual(parsed.forwardArgs, ['--date', '2026-04-01', '--tier', '8GB'])
})

test('parseCiArgs throws when --mode is provided without value', () => {
  assert.throws(
    () => parseCiArgs(['node', 'scripts/sovereign-week1-ci-run.mjs', '--mode']),
    /Missing value for --mode/,
  )
})

test('parseCiArgs throws on unknown wrapper options', () => {
  assert.throws(
    () => parseCiArgs(['node', 'scripts/sovereign-week1-ci-run.mjs', '--unknown-flag']),
    /Unknown option for CI wrapper/,
  )
})

test('buildDailyRunArgs always enforces strict gate once', () => {
  const args = buildDailyRunArgs(['--date', '2026-04-01'])
  const strictGateArgs = args.filter(value => value === '--strict-gate')

  assert.equal(strictGateArgs.length, 1)
  assert.deepEqual(args, ['--strict-gate', '--date', '2026-04-01'])
})

test('classifyExitCode softens gate-blocked run in soft mode', () => {
  const result = classifyExitCode({ childExitCode: 2, mode: 'soft' })

  assert.equal(result.exitCode, 0)
  assert.equal(result.gateBlocked, true)
})

test('classifyExitCode keeps gate-blocked run failing in hard mode', () => {
  const result = classifyExitCode({ childExitCode: 2, mode: 'hard' })

  assert.equal(result.exitCode, 2)
  assert.equal(result.gateBlocked, true)
})

test('classifyExitCode passes through non-gate errors in all modes', () => {
  assert.equal(classifyExitCode({ childExitCode: 1, mode: 'soft' }).exitCode, 1)
  assert.equal(classifyExitCode({ childExitCode: 1, mode: 'hard' }).exitCode, 1)
})
