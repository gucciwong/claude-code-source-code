#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export function buildDailyPaths({ outDir, date }) {
  const base = outDir || 'artifacts'
  return {
    runtimeFile: `${base}/week1-runtime-${date}.json`,
    benchmarkFile: `${base}/week1-benchmark-${date}.json`,
    evidenceFile: `${base}/week1-evidence-${date}.json`,
  }
}

export function buildCommands({ date, tier, sampleFile, runtimeFile, benchmarkFile, evidenceFile }) {
  return [
    `node scripts/sovereign-week1-runtime-check.mjs --json > ${runtimeFile}`,
    `node scripts/sovereign-week1-benchmark.mjs --file ${sampleFile} --tier ${tier} --json > ${benchmarkFile}`,
    `node scripts/sovereign-week1-evidence-bundle.mjs --runtime-file ${runtimeFile} --benchmark-file ${benchmarkFile} --date ${date} --json > ${evidenceFile}`,
  ]
}

function parseArgs(argv) {
  const today = new Date().toISOString().slice(0, 10)
  const args = {
    date: today,
    tier: '8GB',
    outDir: 'artifacts',
    sampleFile: 'scripts/tests/fixtures/week1-samples.json',
    dryRun: false,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]
    const next = argv[i + 1]

    if (token === '--date' && next) {
      args.date = next
      i += 1
    } else if (token === '--tier' && next) {
      args.tier = next
      i += 1
    } else if (token === '--out-dir' && next) {
      args.outDir = next
      i += 1
    } else if (token === '--sample-file' && next) {
      args.sampleFile = next
      i += 1
    } else if (token === '--dry-run') {
      args.dryRun = true
    } else if (token === '--help' || token === '-h') {
      printHelp()
      process.exit(0)
    }
  }

  return args
}

function printHelp() {
  console.log('Usage: node scripts/sovereign-week1-daily-run.mjs [options]')
  console.log('')
  console.log('Options:')
  console.log('  --date <YYYY-MM-DD>          Date key for output files')
  console.log('  --tier <tier>                6GB | 8GB | 12GB | 24GB (default: 8GB)')
  console.log('  --out-dir <path>             Output directory (default: artifacts)')
  console.log('  --sample-file <path>         Benchmark sample JSON file')
  console.log('  --dry-run                    Print command plan only')
  console.log('  --help, -h                   Show this help')
}

async function ensureParent(path) {
  await mkdir(dirname(path), { recursive: true })
}

export function extractStdoutFromExecError(error) {
  if (error && typeof error === 'object' && typeof error.stdout === 'string') {
    return error.stdout
  }
  return null
}

async function runNodeScript(scriptPath, scriptArgs) {
  try {
    const { stdout } = await execFileAsync(process.execPath, [scriptPath, ...scriptArgs], {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024,
    })
    return stdout
  } catch (error) {
    const recovered = extractStdoutFromExecError(error)
    if (recovered !== null && recovered.trim().length > 0) {
      return recovered
    }
    throw error
  }
}

async function runCli() {
  const args = parseArgs(process.argv)
  const paths = buildDailyPaths({ outDir: args.outDir, date: args.date })
  const commands = buildCommands({
    date: args.date,
    tier: args.tier,
    sampleFile: args.sampleFile,
    runtimeFile: paths.runtimeFile,
    benchmarkFile: paths.benchmarkFile,
    evidenceFile: paths.evidenceFile,
  })

  if (args.dryRun) {
    console.log(JSON.stringify({ paths, commands }, null, 2))
    return
  }

  await ensureParent(paths.runtimeFile)
  await ensureParent(paths.benchmarkFile)
  await ensureParent(paths.evidenceFile)

  const runtimeOut = await runNodeScript('scripts/sovereign-week1-runtime-check.mjs', ['--json'])
  await writeFile(paths.runtimeFile, runtimeOut, 'utf8')

  const benchmarkOut = await runNodeScript('scripts/sovereign-week1-benchmark.mjs', [
    '--file',
    args.sampleFile,
    '--tier',
    args.tier,
    '--json',
  ])
  await writeFile(paths.benchmarkFile, benchmarkOut, 'utf8')

  const evidenceOut = await runNodeScript('scripts/sovereign-week1-evidence-bundle.mjs', [
    '--runtime-file',
    paths.runtimeFile,
    '--benchmark-file',
    paths.benchmarkFile,
    '--date',
    args.date,
    '--json',
  ])
  await writeFile(paths.evidenceFile, evidenceOut, 'utf8')

  console.log(JSON.stringify({
    date: args.date,
    tier: args.tier,
    output: paths,
  }, null, 2))
}

const thisFilePath = fileURLToPath(import.meta.url)
const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null

if (invokedPath && thisFilePath === invokedPath) {
  runCli().catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
