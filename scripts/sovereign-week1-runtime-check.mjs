#!/usr/bin/env node

/**
 * Week 1 implementation starter for Sovereign Coder Foundation.
 *
 * What it does:
 * 1) Checks local Ollama runtime reachability and model listing.
 * 2) Recommends model profiles by VRAM tier.
 * 3) Emits JSON or human-readable output for automation and demos.
 */

const DEFAULT_HOST = '127.0.0.1'
const DEFAULT_PORT = 11434

const PROFILE_MATRIX = {
  '6GB': ['qwen2.5-coder:7b', 'deepseek-coder:6.7b'],
  '8GB': ['starcoder2:15b-q4', 'qwen2.5-coder:14b-q4'],
  '12GB': ['qwen2.5-coder:32b-q4', 'phi4-coder:14b-q4'],
  '24GB': ['deepseek-coder:33b-q4', 'qwen2.5-coder:32b-q6'],
}

export function parseRuntimeCheckArgs(argv) {
  const knownOptions = new Set([
    '--host',
    '--port',
    '--vram',
    '--timeout-ms',
    '--json',
    '--help',
    '-h',
  ])

  const args = {
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    vram: null,
    json: false,
    timeoutMs: 3000,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]
    const next = argv[i + 1]

    if (token === '--host' && !next) {
      throw new Error('Missing value for --host.')
    } else if (token === '--host' && next) {
      args.host = next
      i += 1
    } else if (token === '--port' && !next) {
      throw new Error('Missing value for --port.')
    } else if (token === '--port' && next) {
      const parsedPort = Number(next)
      if (!Number.isInteger(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
        throw new Error(`Invalid --port value: ${next}`)
      }
      args.port = parsedPort
      i += 1
    } else if (token === '--vram' && !next) {
      throw new Error('Missing value for --vram.')
    } else if (token === '--vram' && next) {
      args.vram = next.toUpperCase()
      i += 1
    } else if (token === '--timeout-ms' && !next) {
      throw new Error('Missing value for --timeout-ms.')
    } else if (token === '--timeout-ms' && next) {
      const parsedTimeoutMs = Number(next)
      if (!Number.isFinite(parsedTimeoutMs) || parsedTimeoutMs <= 0) {
        throw new Error(`Invalid --timeout-ms value: ${next}`)
      }
      args.timeoutMs = parsedTimeoutMs
      i += 1
    } else if (token === '--json') {
      args.json = true
    } else if (token === '--help' || token === '-h') {
      printHelp()
      process.exit(0)
    } else if (token.startsWith('--') && !knownOptions.has(token)) {
      throw new Error(`Unknown option for runtime-check CLI: ${token}`)
    }
  }

  return args
}

function printHelp() {
  console.log('Usage: node scripts/sovereign-week1-runtime-check.mjs [options]')
  console.log('')
  console.log('Options:')
  console.log('  --host <host>         Ollama host (default: 127.0.0.1)')
  console.log('  --port <port>         Ollama port (default: 11434)')
  console.log('  --vram <tier>         VRAM tier: 6GB | 8GB | 12GB | 24GB')
  console.log('  --timeout-ms <ms>     Request timeout in ms (default: 3000)')
  console.log('  --json                Output machine-readable JSON')
  console.log('  --help, -h            Show this help')
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs)
    }),
  ])
}

async function fetchJson(url, timeoutMs) {
  const response = await withTimeout(fetch(url), timeoutMs)
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json()
}

export function normalizeTier(vram) {
  if (!vram) return null
  const normalized = vram.replace(/\s+/g, '').toUpperCase()
  if (normalized === '6GB' || normalized === '8GB' || normalized === '12GB' || normalized === '24GB') {
    return normalized
  }
  return null
}

function buildResult(args, runtime, models, error) {
  const tier = normalizeTier(args.vram)
  const recommendations = tier ? PROFILE_MATRIX[tier] : null

  return {
    timestamp: new Date().toISOString(),
    runtime: {
      host: args.host,
      port: args.port,
      reachable: runtime,
      error: error ?? null,
    },
    models: {
      count: models.length,
      names: models,
    },
    profile: {
      requestedTier: args.vram,
      normalizedTier: tier,
      recommendations,
      supportedTiers: Object.keys(PROFILE_MATRIX),
    },
  }
}

function printHuman(result) {
  const endpoint = `${result.runtime.host}:${result.runtime.port}`
  console.log(`Sovereign Week 1 Runtime Check`)
  console.log(`Endpoint: ${endpoint}`)
  console.log(`Reachable: ${result.runtime.reachable ? 'yes' : 'no'}`)

  if (result.runtime.error) {
    console.log(`Error: ${result.runtime.error}`)
  }

  console.log(`Models discovered: ${result.models.count}`)
  if (result.models.count > 0) {
    for (const model of result.models.names) {
      console.log(`- ${model}`)
    }
  }

  if (result.profile.requestedTier) {
    if (!result.profile.normalizedTier) {
      console.log(`VRAM tier '${result.profile.requestedTier}' is invalid. Use one of: ${result.profile.supportedTiers.join(', ')}`)
    } else {
      console.log(`Recommended models for ${result.profile.normalizedTier}:`)
      for (const model of result.profile.recommendations ?? []) {
        console.log(`- ${model}`)
      }
    }
  }
}

async function main() {
  const args = parseRuntimeCheckArgs(process.argv)
  const baseUrl = `http://${args.host}:${args.port}`

  let reachable = false
  let models = []
  let runtimeError = null

  try {
    const payload = await fetchJson(`${baseUrl}/api/tags`, args.timeoutMs)
    reachable = true
    const raw = Array.isArray(payload?.models) ? payload.models : []
    models = raw
      .map(model => model?.name)
      .filter(name => typeof name === 'string')
      .sort((a, b) => a.localeCompare(b))
  } catch (error) {
    runtimeError = error instanceof Error ? error.message : String(error)
  }

  const result = buildResult(args, reachable, models, runtimeError)

  if (args.json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    printHuman(result)
  }

  if (!reachable) {
    process.exitCode = 2
  }
}

import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const thisFilePath = fileURLToPath(import.meta.url)
const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null

if (invokedPath && thisFilePath === invokedPath) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
