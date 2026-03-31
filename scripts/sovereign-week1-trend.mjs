#!/usr/bin/env node

import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

export function sortSummariesByDate(summaries) {
  return [...summaries].sort((a, b) => String(a.date).localeCompare(String(b.date)))
}

export function computeTrendMetrics(summaries, options = {}) {
  const readinessThreshold = Number.isFinite(options.readinessThreshold)
    ? options.readinessThreshold
    : 0.6

  const ordered = sortSummariesByDate(summaries)
  const totalDays = ordered.length
  const readyDays = ordered.filter(item => item.readyForDemo === true).length
  const blockedDays = totalDays - readyDays
  const readinessRate = totalDays === 0 ? 0 : Number((readyDays / totalDays).toFixed(3))

  let latestBlockedStreak = 0
  for (let i = ordered.length - 1; i >= 0; i -= 1) {
    if (ordered[i].readyForDemo === true) {
      break
    }
    latestBlockedStreak += 1
  }

  const blockedReasonCounts = {}
  for (const item of ordered) {
    if (item.readyForDemo === true) {
      continue
    }
    const reason = item.reason || 'Unknown reason'
    blockedReasonCounts[reason] = (blockedReasonCounts[reason] || 0) + 1
  }

  return {
    totalDays,
    readyDays,
    blockedDays,
    readinessRate,
    readinessThreshold,
    readinessTargetPass: readinessRate >= readinessThreshold,
    latestBlockedStreak,
    window: {
      startDate: ordered[0]?.date ?? null,
      endDate: ordered[ordered.length - 1]?.date ?? null,
    },
    blockedReasonCounts,
  }
}

export function buildTrendReport(metrics) {
  const readinessPercent = (metrics.readinessRate * 100).toFixed(1)
  const lines = [
    '# Sovereign Week1 Trend Report',
    '',
    `Window: ${metrics.window.startDate ?? 'N/A'} to ${metrics.window.endDate ?? 'N/A'}`,
    `Total days: ${metrics.totalDays}`,
    `Ready days: ${metrics.readyDays}`,
    `Blocked days: ${metrics.blockedDays}`,
    `Readiness rate: ${readinessPercent}%`,
    `Readiness target pass: ${Boolean(metrics.readinessTargetPass)}`,
    `Latest blocked streak: ${metrics.latestBlockedStreak ?? 0} day(s)`,
    '',
    'Blocked reasons:',
  ]

  const reasonEntries = Object.entries(metrics.blockedReasonCounts)
    .sort((a, b) => b[1] - a[1])

  if (reasonEntries.length === 0) {
    lines.push('- None')
  } else {
    for (const [reason, count] of reasonEntries) {
      lines.push(`- ${reason}: ${count}`)
    }
  }

  return `${lines.join('\n')}\n`
}

async function readSummaryFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const summaryFiles = entries
    .filter(entry => entry.isFile() && /^week1-summary-\d{4}-\d{2}-\d{2}\.json$/.test(entry.name))
    .map(entry => `${dir}/${entry.name}`)

  const summaries = []
  for (const path of summaryFiles) {
    const raw = await readFile(path, 'utf8')
    summaries.push(JSON.parse(raw))
  }

  return summaries
}

function parseArgs(argv) {
  const args = {
    dir: 'artifacts',
    json: false,
    readinessThreshold: 0.6,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]
    const next = argv[i + 1]

    if (token === '--dir' && next) {
      args.dir = next
      i += 1
    } else if (token === '--readiness-threshold' && next) {
      const parsed = Number(next)
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
        throw new Error('Invalid --readiness-threshold. Use a number between 0 and 1.')
      }
      args.readinessThreshold = parsed
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
  console.log('Usage: node scripts/sovereign-week1-trend.mjs [options]')
  console.log('')
  console.log('Options:')
  console.log('  --dir <path>                 Directory containing week1-summary-YYYY-MM-DD.json files')
  console.log('  --readiness-threshold <0-1>  Target readiness rate (default: 0.6)')
  console.log('  --json                       Print metrics as JSON')
  console.log('  --help, -h                   Show this help')
}

async function runCli() {
  const args = parseArgs(process.argv)
  const summaries = await readSummaryFiles(args.dir)
  const metrics = computeTrendMetrics(summaries, {
    readinessThreshold: args.readinessThreshold,
  })

  if (args.json) {
    console.log(JSON.stringify(metrics, null, 2))
    return
  }

  process.stdout.write(buildTrendReport(metrics))
}

const thisFilePath = fileURLToPath(import.meta.url)
const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null

if (invokedPath && thisFilePath === invokedPath) {
  runCli().catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
