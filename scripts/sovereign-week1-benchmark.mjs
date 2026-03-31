#!/usr/bin/env node

/**
 * Week 1 benchmark helper for Sovereign Coder.
 *
 * Input samples represent local runs from completion/inference traces.
 * Each sample must include:
 * - firstTokenLatencyMs (number > 0)
 * - tokensPerSecond (number > 0)
 */

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const LATENCY_LIMIT_BY_TIER = {
  '6GB': 1000,
  '8GB': 500,
  '12GB': 500,
  '24GB': 1000,
}

const THROUGHPUT_MIN_TPS = 30

export function validateSamples(samples) {
  if (!Array.isArray(samples) || samples.length === 0) {
    throw new Error('samples must be a non-empty array')
  }

  for (const sample of samples) {
    if (typeof sample?.firstTokenLatencyMs !== 'number' || sample.firstTokenLatencyMs <= 0) {
      throw new Error('each sample.firstTokenLatencyMs must be a number > 0')
    }

    if (typeof sample?.tokensPerSecond !== 'number' || sample.tokensPerSecond <= 0) {
      throw new Error('each sample.tokensPerSecond must be a number > 0')
    }
  }
}

export function computeMetrics(samples) {
  validateSamples(samples)

  const latencySum = samples.reduce((acc, sample) => acc + sample.firstTokenLatencyMs, 0)
  const tpsSum = samples.reduce((acc, sample) => acc + sample.tokensPerSecond, 0)

  const sampleCount = samples.length

  return {
    sampleCount,
    firstTokenLatencyMsAvg: Math.round(latencySum / sampleCount),
    tokensPerSecondAvg: Math.round(tpsSum / sampleCount),
  }
}

function normalizeTier(tier) {
  if (!tier) return null
  const normalized = tier.replace(/\s+/g, '').toUpperCase()
  if (normalized === '6GB' || normalized === '8GB' || normalized === '12GB' || normalized === '24GB') {
    return normalized
  }
  return null
}

export function buildReport({ tier, samples }) {
  const metrics = computeMetrics(samples)
  const normalizedTier = normalizeTier(tier)
  const latencyLimitMs = normalizedTier ? LATENCY_LIMIT_BY_TIER[normalizedTier] : 500

  return {
    timestamp: new Date().toISOString(),
    profile: {
      requestedTier: tier ?? null,
      normalizedTier,
    },
    metrics,
    targets: {
      latencyLimitMs,
      throughputMinimumTps: THROUGHPUT_MIN_TPS,
      latencyPass: metrics.firstTokenLatencyMsAvg <= latencyLimitMs,
      throughputPass: metrics.tokensPerSecondAvg >= THROUGHPUT_MIN_TPS,
    },
  }
}

function parseArgs(argv) {
  const args = {
    file: null,
    tier: null,
    json: false,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]
    const next = argv[i + 1]

    if (token === '--file' && next) {
      args.file = next
      i += 1
    } else if (token === '--tier' && next) {
      args.tier = next
      i += 1
    } else if (token === '--json') {
      args.json = true
    } else if (token === '--help' || token === '-h') {
      printHelp()
      process.exit(0)
    }
  }

  return args
}

function printHelp() {
  console.log('Usage: node scripts/sovereign-week1-benchmark.mjs --file <samples.json> [options]')
  console.log('')
  console.log('Options:')
  console.log('  --file <path>     JSON file with sample array')
  console.log('  --tier <tier>     6GB | 8GB | 12GB | 24GB')
  console.log('  --json            Emit JSON output')
  console.log('  --help, -h        Show this help')
}

function printHuman(report) {
  console.log('Sovereign Week 1 Benchmark Report')
  console.log(`Tier: ${report.profile.normalizedTier ?? 'default'}`)
  console.log(`Samples: ${report.metrics.sampleCount}`)
  console.log(`Avg first-token latency: ${report.metrics.firstTokenLatencyMsAvg} ms`)
  console.log(`Avg throughput: ${report.metrics.tokensPerSecondAvg} tps`)
  console.log(`Latency target (${report.targets.latencyLimitMs} ms): ${report.targets.latencyPass ? 'PASS' : 'FAIL'}`)
  console.log(`Throughput target (${report.targets.throughputMinimumTps} tps): ${report.targets.throughputPass ? 'PASS' : 'FAIL'}`)
}

async function runCli() {
  const args = parseArgs(process.argv)

  if (!args.file) {
    throw new Error('missing required argument: --file <samples.json>')
  }

  const raw = await readFile(args.file, 'utf8')
  const samples = JSON.parse(raw)
  const report = buildReport({ tier: args.tier, samples })

  if (args.json) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    printHuman(report)
  }

  if (!report.targets.latencyPass || !report.targets.throughputPass) {
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
