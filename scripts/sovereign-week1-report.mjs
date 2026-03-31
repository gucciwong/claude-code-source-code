#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function summarizeReadiness(evidence) {
  const ready = Boolean(evidence?.gate?.readyForDemo)
  return {
    status: ready ? 'Ready' : 'Blocked',
    message: evidence?.gate?.reason ?? (ready ? 'Ready for demo' : 'Gate not satisfied'),
  }
}

export function buildMarkdownReport(evidence) {
  const readiness = summarizeReadiness(evidence)

  const date = evidence?.date ?? 'unknown'
  const runtimeReachable = evidence?.runtimeReachable ? 'yes' : 'no'
  const modelCount = evidence?.modelCount ?? 0
  const latency = evidence?.metrics?.firstTokenLatencyMsAvg ?? 'n/a'
  const throughput = evidence?.metrics?.tokensPerSecondAvg ?? 'n/a'
  const samples = evidence?.metrics?.sampleCount ?? 0
  const latencyPass = evidence?.targets?.latencyPass ? 'pass' : 'fail'
  const throughputPass = evidence?.targets?.throughputPass ? 'pass' : 'fail'
  const latencyLimit = evidence?.targets?.latencyLimitMs ?? 'n/a'
  const throughputLimit = evidence?.targets?.throughputMinimumTps ?? 'n/a'

  return [
    '# Sovereign Week 1 Daily Report',
    '',
    `Date: ${date}`,
    '',
    '## Runtime',
    `- Runtime reachable: ${runtimeReachable}`,
    `- Models discovered: ${modelCount}`,
    '',
    '## Benchmark',
    `- Samples: ${samples}`,
    `- Average first-token latency (ms): ${latency}`,
    `- Average throughput (tps): ${throughput}`,
    `- Latency target (${latencyLimit} ms): ${latencyPass}`,
    `- Throughput target (${throughputLimit} tps): ${throughputPass}`,
    '',
    '## Readiness',
    `- Overall readiness: ${readiness.status}`,
    `- Gate reason: ${readiness.message}`,
    '',
  ].join('\n')
}

export function parseReportArgs(argv) {
  const knownOptions = new Set([
    '--evidence-file',
    '--out-file',
    '--help',
    '-h',
  ])

  const args = {
    evidenceFile: null,
    outFile: null,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]
    const next = argv[i + 1]

    if (token === '--evidence-file' && !next) {
      throw new Error('Missing value for --evidence-file.')
    } else if (token === '--evidence-file' && next) {
      args.evidenceFile = next
      i += 1
    } else if (token === '--out-file' && !next) {
      throw new Error('Missing value for --out-file.')
    } else if (token === '--out-file' && next) {
      args.outFile = next
      i += 1
    } else if (token === '--help' || token === '-h') {
      printHelp()
      process.exit(0)
    } else if (token.startsWith('--') && !knownOptions.has(token)) {
      throw new Error(`Unknown option for report CLI: ${token}`)
    } else if (token.startsWith('-')) {
      throw new Error(`Unknown option for report CLI: ${token}`)
    } else {
      throw new Error(`Unexpected positional argument: ${token}`)
    }
  }

  return args
}

function printHelp() {
  console.log('Usage: node scripts/sovereign-week1-report.mjs --evidence-file <path> --out-file <path>')
}

async function runCli() {
  const args = parseReportArgs(process.argv)
  if (!args.evidenceFile || !args.outFile) {
    throw new Error('both --evidence-file and --out-file are required')
  }

  const evidence = JSON.parse(await readFile(args.evidenceFile, 'utf8'))
  const markdown = buildMarkdownReport(evidence)
  await writeFile(args.outFile, markdown, 'utf8')

  console.log(JSON.stringify({
    evidenceFile: args.evidenceFile,
    outFile: args.outFile,
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
