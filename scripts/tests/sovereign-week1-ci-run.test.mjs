import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import {
  parseCiArgs,
  buildDailyRunArgs,
  classifyExitCode,
} from '../sovereign-week1-ci-run.mjs'

const execFileAsync = promisify(execFile)

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

test('parseCiArgs throws when --mode value is unsupported', () => {
  assert.throws(
    () => parseCiArgs(['node', 'scripts/sovereign-week1-ci-run.mjs', '--mode', 'medium']),
    /Unsupported mode/,
  )
})

test('parseCiArgs forwards args after -- separator without wrapper validation', () => {
  const parsed = parseCiArgs([
    'node',
    'scripts/sovereign-week1-ci-run.mjs',
    '--mode',
    'soft',
    '--',
    '--future-flag',
    'x',
  ])

  assert.equal(parsed.mode, 'soft')
  assert.deepEqual(parsed.forwardArgs, ['--future-flag', 'x'])
})

test('parseCiArgs throws on unknown short options', () => {
  assert.throws(
    () => parseCiArgs(['node', 'scripts/sovereign-week1-ci-run.mjs', '-x']),
    /Unknown option for CI wrapper/,
  )
})

test('parseCiArgs throws on positional arguments', () => {
  assert.throws(
    () => parseCiArgs(['node', 'scripts/sovereign-week1-ci-run.mjs', 'unexpected']),
    /Unexpected positional argument/,
  )
})

test('parseCiArgs treats token after value-taking flag as forwarded value even if it starts with dash', () => {
  const parsed = parseCiArgs([
    'node',
    'scripts/sovereign-week1-ci-run.mjs',
    '--out-dir',
    '-tmp-artifacts',
    '--sample-file',
    'samples.json',
  ])

  assert.deepEqual(parsed.forwardArgs, ['--out-dir', '-tmp-artifacts', '--sample-file', 'samples.json'])
})

test('parseCiArgs consumes value slot for forward flags before wrapper validation', () => {
  const parsed = parseCiArgs([
    'node',
    'scripts/sovereign-week1-ci-run.mjs',
    '--date',
    '--tier',
  ])

  assert.deepEqual(parsed.forwardArgs, ['--date', '--tier'])
})

test('buildDailyRunArgs always enforces strict gate once', () => {
  const args = buildDailyRunArgs(['--date', '2026-04-01'])
  const strictGateArgs = args.filter(value => value === '--strict-gate')

  assert.equal(strictGateArgs.length, 1)
  assert.deepEqual(args, ['--strict-gate', '--date', '2026-04-01'])
})

test('buildDailyRunArgs does not duplicate --strict-gate when already present', () => {
  const args = buildDailyRunArgs(['--strict-gate', '--date', '2026-04-01'])
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

test('classifyExitCode returns zero exit and no gate block on success', () => {
  const result = classifyExitCode({ childExitCode: 0, mode: 'soft' })

  assert.equal(result.exitCode, 0)
  assert.equal(result.gateBlocked, false)
})

test('ci-run hard mode exits with code 2 when daily run is gate-blocked', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'week1-ci-hard-'))
  const sampleFile = join(dir, 'degraded-samples.json')

  await writeFile(
    sampleFile,
    JSON.stringify([
      { firstTokenLatencyMs: 900, tokensPerSecond: 20 },
      { firstTokenLatencyMs: 950, tokensPerSecond: 18 },
    ]),
    'utf8',
  )

  await assert.rejects(
    execFileAsync(process.execPath, [
      'scripts/sovereign-week1-ci-run.mjs',
      '--mode',
      'hard',
      '--date',
      '2026-04-01',
      '--sample-file',
      sampleFile,
      '--out-dir',
      dir,
    ]),
    error => {
      assert.equal(error.code, 2)
      return true
    },
  )
})

test('ci-run soft mode downgrades gate block to warning and exits zero', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'week1-ci-soft-'))
  const sampleFile = join(dir, 'degraded-samples.json')

  await writeFile(
    sampleFile,
    JSON.stringify([
      { firstTokenLatencyMs: 900, tokensPerSecond: 20 },
      { firstTokenLatencyMs: 950, tokensPerSecond: 18 },
    ]),
    'utf8',
  )

  const { stderr } = await execFileAsync(process.execPath, [
    'scripts/sovereign-week1-ci-run.mjs',
    '--mode',
    'soft',
    '--date',
    '2026-04-01',
    '--sample-file',
    sampleFile,
    '--out-dir',
    dir,
  ])

  assert.match(stderr, /treated as warning in soft mode/)
})

test('ci-run propagates non-gate child failure exit code and stderr', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'week1-ci-invalid-tier-'))
  const sampleFile = join(dir, 'samples.json')
  await writeFile(
    sampleFile,
    JSON.stringify([{ firstTokenLatencyMs: 450, tokensPerSecond: 33 }]),
    'utf8',
  )

  await assert.rejects(
    execFileAsync(process.execPath, [
      'scripts/sovereign-week1-ci-run.mjs',
      '--mode',
      'soft',
      '--tier',
      '16GB',
      '--sample-file',
      sampleFile,
      '--out-dir',
      dir,
    ]),
    error => {
      assert.equal(error.code, 1)
      assert.match(error.stderr, /Unsupported --tier value/)
      return true
    },
  )
})

test('ci-run --help prints usage text', async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    'scripts/sovereign-week1-ci-run.mjs',
    '--help',
  ])

  assert.match(stdout, /Usage: node scripts\/sovereign-week1-ci-run\.mjs/)
  assert.match(stdout, /--mode <soft\|hard>/)
})

test('ci-run exits with parse error when wrapper arguments are invalid', async () => {
  await assert.rejects(
    execFileAsync(process.execPath, [
      'scripts/sovereign-week1-ci-run.mjs',
      '--mode',
      'invalid',
    ]),
    error => {
      assert.equal(error.code, 1)
      assert.match(error.stderr, /Unsupported mode: invalid/)
      return true
    },
  )
})
