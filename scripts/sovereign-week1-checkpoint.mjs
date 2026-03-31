#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function buildCheckpointSummary(evidence) {
  return {
    date: evidence?.date ?? 'unknown',
    readiness: evidence?.gate?.readyForDemo ? 'Ready' : 'Blocked',
    latencyMs: evidence?.metrics?.firstTokenLatencyMsAvg ?? 'n/a',
    throughputTps: evidence?.metrics?.tokensPerSecondAvg ?? 'n/a',
    reason: evidence?.gate?.reason ?? 'No gate reason available',
  }
}

export function toCheckpointText(summary) {
  return [
    `Week 1 Checkpoint (${summary.date})`,
    `Readiness: ${summary.readiness}`,
    `Latency: ${summary.latencyMs} ms`,
    `Throughput: ${summary.throughputTps} tps`,
    `Reason: ${summary.reason}`,
    '',
  ].join('\n')
}

function parseArgs(argv) {
  const args = {
    evidenceFile: null,
    outFile: null,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]
    const next = argv[i + 1]

    if (token === '--evidence-file' && next) {
      args.evidenceFile = next
      i += 1
    } else if (token === '--out-file' && next) {
      args.outFile = next
      i += 1
    } else if (token === '--help' || token === '-h') {
      console.log('Usage: node scripts/sovereign-week1-checkpoint.mjs --evidence-file <path> --out-file <path>')
      process.exit(0)
    }
  }

  return args
}

async function runCli() {
  const args = parseArgs(process.argv)
  if (!args.evidenceFile || !args.outFile) {
    throw new Error('both --evidence-file and --out-file are required')
  }

  const evidence = JSON.parse(await readFile(args.evidenceFile, 'utf8'))
  const summary = buildCheckpointSummary(evidence)
  const text = toCheckpointText(summary)

  await writeFile(args.outFile, text, 'utf8')

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
