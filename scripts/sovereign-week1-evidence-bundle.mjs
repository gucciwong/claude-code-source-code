#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function buildEvidenceBundle({ date, runtime, benchmark }) {
  if (!date) {
    throw new Error('date is required')
  }

  return {
    date,
    runtimeReachable: Boolean(runtime?.runtime?.reachable),
    runtimeEndpoint: runtime?.runtime
      ? `${runtime.runtime.host}:${runtime.runtime.port}`
      : null,
    runtimeError: runtime?.runtime?.error ?? null,
    modelCount: runtime?.models?.count ?? 0,
    modelNames: runtime?.models?.names ?? [],
    metrics: {
      sampleCount: benchmark?.metrics?.sampleCount ?? 0,
      firstTokenLatencyMsAvg: benchmark?.metrics?.firstTokenLatencyMsAvg ?? null,
      tokensPerSecondAvg: benchmark?.metrics?.tokensPerSecondAvg ?? null,
    },
    targets: {
      latencyPass: Boolean(benchmark?.targets?.latencyPass),
      throughputPass: Boolean(benchmark?.targets?.throughputPass),
      latencyLimitMs: benchmark?.targets?.latencyLimitMs ?? null,
      throughputMinimumTps: benchmark?.targets?.throughputMinimumTps ?? null,
    },
  }
}

export function summarizeGateSignals(bundle) {
  if (!bundle.runtimeReachable) {
    return { readyForDemo: false, reason: 'Runtime is unreachable' }
  }

  if (!bundle.targets?.latencyPass) {
    return { readyForDemo: false, reason: 'Latency target failed' }
  }

  if (!bundle.targets?.throughputPass) {
    return { readyForDemo: false, reason: 'Throughput target failed' }
  }

  return { readyForDemo: true, reason: 'All Week 1 gate signals are green' }
}

export function parseEvidenceBundleArgs(argv) {
  const knownOptions = new Set([
    '--date',
    '--runtime-file',
    '--benchmark-file',
    '--json',
    '--help',
    '-h',
  ])

  const args = {
    date: new Date().toISOString().slice(0, 10),
    runtimeFile: null,
    benchmarkFile: null,
    json: false,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]
    const next = argv[i + 1]

    if (token === '--date' && !next) {
      throw new Error('Missing value for --date.')
    } else if (token === '--date' && next) {
      args.date = next
      i += 1
    } else if (token === '--runtime-file' && !next) {
      throw new Error('Missing value for --runtime-file.')
    } else if (token === '--runtime-file' && next) {
      args.runtimeFile = next
      i += 1
    } else if (token === '--benchmark-file' && !next) {
      throw new Error('Missing value for --benchmark-file.')
    } else if (token === '--benchmark-file' && next) {
      args.benchmarkFile = next
      i += 1
    } else if (token === '--json') {
      args.json = true
    } else if (token === '--help' || token === '-h') {
      printHelp()
      process.exit(0)
    } else if (token.startsWith('--') && !knownOptions.has(token)) {
      throw new Error(`Unknown option for evidence-bundle CLI: ${token}`)
    } else if (token.startsWith('-')) {
      throw new Error(`Unknown option for evidence-bundle CLI: ${token}`)
    } else {
      throw new Error(`Unexpected positional argument: ${token}`)
    }
  }

  return args
}

function printHelp() {
  console.log('Usage: node scripts/sovereign-week1-evidence-bundle.mjs --runtime-file <path> --benchmark-file <path> [options]')
  console.log('')
  console.log('Options:')
  console.log('  --date <YYYY-MM-DD>          Evidence date (default: today)')
  console.log('  --runtime-file <path>        JSON output from sovereign-week1-runtime-check')
  console.log('  --benchmark-file <path>      JSON output from sovereign-week1-benchmark')
  console.log('  --json                       Emit JSON output')
  console.log('  --help, -h                   Show this help')
}

function printHuman(bundle, gate) {
  console.log('Sovereign Week 1 Evidence Bundle')
  console.log(`Date: ${bundle.date}`)
  console.log(`Runtime reachable: ${bundle.runtimeReachable ? 'yes' : 'no'}`)
  console.log(`Models discovered: ${bundle.modelCount}`)
  console.log(`Latency avg: ${bundle.metrics.firstTokenLatencyMsAvg} ms`) 
  console.log(`Throughput avg: ${bundle.metrics.tokensPerSecondAvg} tps`)
  console.log(`Ready for demo: ${gate.readyForDemo ? 'yes' : 'no'}`)
  console.log(`Reason: ${gate.reason}`)
}

async function runCli() {
  const args = parseEvidenceBundleArgs(process.argv)

  if (!args.runtimeFile || !args.benchmarkFile) {
    throw new Error('both --runtime-file and --benchmark-file are required')
  }

  const runtime = JSON.parse(await readFile(args.runtimeFile, 'utf8'))
  const benchmark = JSON.parse(await readFile(args.benchmarkFile, 'utf8'))

  const bundle = buildEvidenceBundle({ date: args.date, runtime, benchmark })
  const gate = summarizeGateSignals(bundle)
  const output = { ...bundle, gate }

  if (args.json) {
    console.log(JSON.stringify(output, null, 2))
  } else {
    printHuman(bundle, gate)
  }

  if (!gate.readyForDemo) {
    process.exitCode = 2
  }
}

const thisFilePath = fileURLToPath(import.meta.url)
const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null

if (invokedPath && thisFilePath === invokedPath) {
  runCli().catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
