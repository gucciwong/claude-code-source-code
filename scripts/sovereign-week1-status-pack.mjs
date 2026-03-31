#!/usr/bin/env node

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  computeTrendMetrics,
  sortSummariesByDate,
  isWeek1SummaryFileName,
} from './sovereign-week1-trend.mjs'

export function deriveOverallStatus({ readinessRate, blockedDays, totalDays }) {
  if (totalDays === 0) {
    return 'RED'
  }
  if (readinessRate >= 0.75 && blockedDays <= 1) {
    return 'GREEN'
  }
  if (readinessRate >= 0.4) {
    return 'YELLOW'
  }
  return 'RED'
}

export function buildExecutiveSummary({ overallStatus, trend, latest }) {
  const readinessPercent = (trend.readinessRate * 100).toFixed(1)
  const latestState = latest.readyForDemo ? 'ready' : 'blocked'

  const lines = [
    '# Sovereign Week1 Executive Status Pack',
    '',
    `Overall status: ${overallStatus}`,
    `Window: ${trend.window.startDate ?? 'N/A'} to ${trend.window.endDate ?? 'N/A'}`,
    `Readiness rate: ${readinessPercent}%`,
    `Readiness target pass: ${Boolean(trend.readinessTargetPass)}`,
    `Latest blocked streak: ${trend.latestBlockedStreak ?? 0} day(s)`,
    `Ready days: ${trend.readyDays} / ${trend.totalDays}`,
    `Blocked days: ${trend.blockedDays}`,
    `Latest day: ${latest.date} (${latestState})`,
    `Latest reason: ${latest.reason ?? 'N/A'}`,
    '',
    'Blocked reason breakdown:',
  ]

  const reasons = Object.entries(trend.blockedReasonCounts).sort((a, b) => b[1] - a[1])
  if (reasons.length === 0) {
    lines.push('- None')
  } else {
    for (const [reason, count] of reasons) {
      lines.push(`- ${reason}: ${count}`)
    }
  }

  return `${lines.join('\n')}\n`
}

async function readSummaries(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = entries
    .filter(entry => entry.isFile() && isWeek1SummaryFileName(entry.name))
    .map(entry => `${dir}/${entry.name}`)

  const summaries = []
  for (const file of files) {
    const raw = await readFile(file, 'utf8')
    summaries.push(JSON.parse(raw))
  }

  return sortSummariesByDate(summaries)
}

export function parseStatusPackArgs(argv) {
  const args = {
    dir: 'artifacts',
    outFile: 'artifacts/week1-executive-status.md',
    json: false,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]
    const next = argv[i + 1]

    if (token === '--dir' && next) {
      args.dir = next
      i += 1
    } else if (token === '--out-file' && !next) {
      throw new Error('Missing value for --out-file.')
    } else if (token === '--out-file' && next) {
      args.outFile = next
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
  console.log('Usage: node scripts/sovereign-week1-status-pack.mjs [options]')
  console.log('')
  console.log('Options:')
  console.log('  --dir <path>                 Directory containing week1 summary JSON files')
  console.log('  --out-file <path>            Markdown output path (default: artifacts/week1-executive-status.md)')
  console.log('  --json                       Print compact JSON summary to stdout')
  console.log('  --help, -h                   Show this help')
}

async function runCli() {
  const args = parseStatusPackArgs(process.argv)
  const summaries = await readSummaries(args.dir)

  if (summaries.length === 0) {
    throw new Error(`No summary files found in ${args.dir}`)
  }

  const trend = computeTrendMetrics(summaries)
  const latest = summaries[summaries.length - 1]
  const overallStatus = deriveOverallStatus(trend)

  const markdown = buildExecutiveSummary({
    overallStatus,
    trend,
    latest,
  })

  await mkdir(dirname(args.outFile), { recursive: true })
  await writeFile(args.outFile, markdown, 'utf8')

  const payload = {
    overallStatus,
    trend,
    latest,
    outFile: args.outFile,
  }

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2))
    return
  }

  console.log(JSON.stringify(payload, null, 2))
}

const thisFilePath = fileURLToPath(import.meta.url)
const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null

if (invokedPath && thisFilePath === invokedPath) {
  runCli().catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
