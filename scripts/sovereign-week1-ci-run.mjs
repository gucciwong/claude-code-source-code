#!/usr/bin/env node

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const execFileAsync = promisify(execFile)

export function parseCiArgs(argv) {
  const knownForwardFlags = new Set([
    '--date',
    '--tier',
    '--out-dir',
    '--sample-file',
    '--dry-run',
    '--strict-gate',
  ])

  const forwardValueFlags = new Set([
    '--date',
    '--tier',
    '--out-dir',
    '--sample-file',
  ])

  const result = {
    mode: 'soft',
    forwardArgs: [],
  }

  let expectingForwardValue = false

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]
    const next = argv[i + 1]

    if (token === '--') {
      result.forwardArgs.push(...argv.slice(i + 1))
      break
    }

    if (expectingForwardValue) {
      result.forwardArgs.push(token)
      expectingForwardValue = false
      continue
    }

    if (token === '--mode' && !next) {
      throw new Error('Missing value for --mode. Use soft or hard.')
    }

    if (token === '--mode' && next) {
      result.mode = next
      i += 1
      continue
    }

    if (token === '--help' || token === '-h') {
      printHelp()
      process.exit(0)
    }

    if (token.startsWith('--') && !knownForwardFlags.has(token)) {
      throw new Error(`Unknown option for CI wrapper: ${token}`)
    }

    if (!token.startsWith('--') && token.startsWith('-')) {
      throw new Error(`Unknown option for CI wrapper: ${token}`)
    }

    if (!token.startsWith('-')) {
      throw new Error(`Unexpected positional argument: ${token}`)
    }

    result.forwardArgs.push(token)
    if (forwardValueFlags.has(token)) {
      expectingForwardValue = true
    }
  }

  if (result.mode !== 'soft' && result.mode !== 'hard') {
    throw new Error(`Unsupported mode: ${result.mode}. Use soft or hard.`)
  }

  return result
}

export function buildDailyRunArgs(forwardArgs) {
  const hasStrictGate = forwardArgs.includes('--strict-gate')
  if (hasStrictGate) {
    return [...forwardArgs]
  }
  return ['--strict-gate', ...forwardArgs]
}

export function classifyExitCode({ childExitCode, mode }) {
  const gateBlocked = childExitCode === 2

  if (!gateBlocked) {
    return {
      exitCode: childExitCode,
      gateBlocked: false,
    }
  }

  if (mode === 'soft') {
    return {
      exitCode: 0,
      gateBlocked: true,
    }
  }

  return {
    exitCode: 2,
    gateBlocked: true,
  }
}

function printHelp() {
  console.log('Usage: node scripts/sovereign-week1-ci-run.mjs [options] [daily-run args]')
  console.log('')
  console.log('Options:')
  console.log('  --mode <soft|hard>           soft treats gate block as warning (default: soft)')
  console.log('  --help, -h                   Show this help')
  console.log('')
  console.log('All remaining args are forwarded to sovereign-week1-daily-run.mjs.')
}

async function runCli() {
  const { mode, forwardArgs } = parseCiArgs(process.argv)
  const args = buildDailyRunArgs(forwardArgs)

  let childExitCode = 0
  try {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      ['scripts/sovereign-week1-daily-run.mjs', ...args],
      { cwd: process.cwd(), maxBuffer: 1024 * 1024 },
    )
    if (stdout) {
      process.stdout.write(stdout)
    }
    if (stderr) {
      process.stderr.write(stderr)
    }
  } catch (error) {
    if (error && typeof error === 'object') {
      if (typeof error.stdout === 'string' && error.stdout.length > 0) {
        process.stdout.write(error.stdout)
      }
      if (typeof error.stderr === 'string' && error.stderr.length > 0) {
        process.stderr.write(error.stderr)
      }
      if (typeof error.code === 'number') {
        childExitCode = error.code
      } else {
        childExitCode = 1
      }
    } else {
      childExitCode = 1
    }
  }

  const classified = classifyExitCode({ childExitCode, mode })

  if (classified.gateBlocked && mode === 'soft') {
    console.error('Sovereign Week1 gate blocked (exit 2) treated as warning in soft mode.')
  }

  process.exitCode = classified.exitCode
}

const thisFilePath = fileURLToPath(import.meta.url)
const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null

if (invokedPath && thisFilePath === invokedPath) {
  runCli().catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
