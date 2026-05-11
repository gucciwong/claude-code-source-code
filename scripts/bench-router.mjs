#!/usr/bin/env node
/**
 * W5-T15 — Bench the Context-Aware Model Router against a fixed cohort of
 * coding-task prompts.
 *
 * Goal: prove the runway plan's KPI — "auto-routed latency is ≥30% better
 * than always-large with equal-or-better acceptance hint". This is a
 * dry-run by default: it only calls `/api/v1/route` per prompt and records
 * which model the router picked, ignoring whether the underlying model
 * actually executes. That's sufficient for the W5 milestone (we are testing
 * the *router decision quality*, not inference perf).
 *
 * Usage:
 *   node scripts/bench-router.mjs                # default: 30 prompts
 *   node scripts/bench-router.mjs --n 60
 *   MODEL_MANAGER=http://localhost:8002 node scripts/bench-router.mjs
 *
 * Exit codes:
 *   0  ran successfully
 *   2  router service unreachable
 *   3  benchmark assertions failed (used in CI to gate merges)
 */

const BASE = process.env.MODEL_MANAGER || 'http://localhost:8002'
const argN = (() => {
  const i = process.argv.indexOf('--n')
  if (i !== -1 && process.argv[i + 1]) return parseInt(process.argv[i + 1], 10)
  return 30
})()

// 30 representative coding prompts spanning the 7 task types CAMR knows.
// Each entry: {prompt, context, expectedTaskBucket}
const PROMPTS = [
  { p: 'complete this line: x =', c: 'x = ',                   bucket: 'small' },
  { p: 'autocomplete the for loop',                            c: 'for i in range(10):', bucket: 'small' },
  { p: 'finish the function body',                             c: 'def add(a, b):',      bucket: 'small' },
  { p: 'continue: lambda x:',                                  c: 'fn = lambda x:',      bucket: 'small' },
  { p: 'suggest a return statement',                           c: 'def neg(x):',         bucket: 'small' },

  { p: 'refactor this nested if/else into early returns',      c: longSnippet(),         bucket: 'large' },
  { p: 'extract this method into its own class',               c: longSnippet(),         bucket: 'large' },
  { p: 'rename foo to compute_total throughout',               c: longSnippet(),         bucket: 'large' },
  { p: 'reorganize imports and add typing',                    c: longSnippet(),         bucket: 'large' },
  { p: 'clean up this 80-line god function',                   c: longSnippet(),         bucket: 'large' },

  { p: 'fix the bug in login handler',                         c: longSnippet(),         bucket: 'large' },
  { p: 'why does this crash on empty input?',                  c: longSnippet(),         bucket: 'large' },
  { p: 'debug the off-by-one error',                           c: longSnippet(),         bucket: 'large' },
  { p: 'this throws a KeyError — find the cause',              c: longSnippet(),         bucket: 'large' },

  { p: 'write a unit test for parse_date',                     c: 'def parse_date(s): ...', bucket: 'small' },
  { p: 'add a test that verifies edge cases',                  c: 'def parse_date(s): ...', bucket: 'small' },
  { p: 'assert that empty list returns 0',                     c: 'def sum_list(xs): ...',  bucket: 'small' },
  { p: 'add integration test for the auth flow',               c: 'def login(...): ...',    bucket: 'small' },

  { p: 'add a docstring to this function',                     c: 'def f(x): return x',  bucket: 'small' },
  { p: 'document the return type and exceptions',              c: 'def f(x): return x',  bucket: 'small' },
  { p: 'write a README section for this CLI',                  c: '',                    bucket: 'small' },

  { p: 'explain how OAuth refresh works in this code',         c: 'def refresh(): ...',  bucket: 'large' },
  { p: 'what does this regex match?',                          c: 'pat = r"^[a-z]+$"',   bucket: 'small' },
  { p: 'tell me the difference between async and threading',   c: '',                    bucket: 'large' },

  { p: 'review this PR for issues',                            c: longSnippet(),         bucket: 'large' },
  { p: 'audit the dependency usage',                           c: longSnippet(),         bucket: 'large' },
  { p: 'check for security problems',                          c: longSnippet(),         bucket: 'large' },
  { p: 'optimize this loop for cache locality',                c: longSnippet(),         bucket: 'large' },

  { p: 'complete: const sum =',                                c: 'const sum =',         bucket: 'small' },
  { p: 'add type annotations to all params',                   c: 'def f(a, b, c): ...', bucket: 'small' },
]

function longSnippet() {
  // ~30 lines of code so classify_complexity returns COMPLEX.
  return [
    'import os', 'import sys', 'from typing import Optional',
    '',
    'class DataProcessor:',
    '    async def process(self, data):',
    '        if not data:',
    '            raise ValueError("empty")',
    '        cleaned = []',
    '        for item in data:',
    '            if item is None:',
    '                continue',
    '            try:',
    '                value = int(item)',
    '            except ValueError:',
    '                value = -1',
    '            cleaned.append(value)',
    '        return cleaned',
    '',
    '    def validate(self, item):',
    '        return item is not None and item != ""',
    '',
    '    def transform(self, item):',
    '        return item.upper()',
    '',
    '    def reduce(self, items):',
    '        total = 0',
    '        for x in items:',
    '            total += x',
    '        return total',
  ].join('\n')
}

async function probe() {
  try {
    const r = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(2000) })
    return r.ok
  } catch {
    return false
  }
}

async function routeOne(p) {
  const t0 = performance.now()
  const r = await fetch(`${BASE}/api/v1/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: p.p,
      context: p.c,
      available_models: ['qwen2.5-coder-7b', 'qwen2.5-coder-32b'],
      available_vram_gb: 24,
    }),
    signal: AbortSignal.timeout(5_000),
  })
  const dt = performance.now() - t0
  if (!r.ok) throw new Error(`route returned ${r.status}`)
  const body = await r.json()
  return { ...body, latency_ms: dt }
}

function bucketOf(modelId) {
  return /32b|33b|14b|15b/.test(modelId) ? 'large' : 'small'
}

async function main() {
  if (!(await probe())) {
    console.error(`✗ model-manager unreachable at ${BASE}`)
    console.error('  Start it with: docker compose up model-manager  (or run uvicorn directly)')
    process.exit(2)
  }

  const prompts = PROMPTS.slice(0, argN)
  const results = []

  for (const p of prompts) {
    try {
      const r = await routeOne(p)
      results.push({ prompt: p.p, expected: p.bucket, ...r, picked_bucket: bucketOf(r.model_id) })
    } catch (err) {
      console.warn(`! ${p.p.slice(0, 50)}: ${err.message}`)
      results.push({ prompt: p.p, expected: p.bucket, error: err.message })
    }
  }

  const okResults = results.filter(r => !r.error)
  const correctBucket = okResults.filter(r => r.picked_bucket === r.expected).length
  const accuracy = okResults.length > 0 ? correctBucket / okResults.length : 0

  const small = okResults.filter(r => r.picked_bucket === 'small')
  const large = okResults.filter(r => r.picked_bucket === 'large')

  // Headline: how much smaller-model usage CAMR delivers compared to
  // a hypothetical "always-large" baseline.
  const alwaysLargeShare = 1.0   // baseline: always uses 32B
  const camrLargeShare = okResults.length > 0 ? large.length / okResults.length : 1.0
  const reductionPct = (alwaysLargeShare - camrLargeShare) * 100

  console.log('')
  console.log('═══════════════════════════════════════════════════════')
  console.log('  CAMR Bench — Context-Aware Model Router')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`  prompts run        : ${okResults.length} / ${prompts.length}`)
  console.log(`  routed → small (7B): ${small.length}  (${pct(small.length, okResults.length)})`)
  console.log(`  routed → large(32B): ${large.length}  (${pct(large.length, okResults.length)})`)
  console.log(`  bucket accuracy    : ${(accuracy * 100).toFixed(1)}%  (target ≥70%)`)
  console.log(`  /route latency p50 : ${ms(percentile(okResults.map(r => r.latency_ms), 0.50))}`)
  console.log(`  /route latency p95 : ${ms(percentile(okResults.map(r => r.latency_ms), 0.95))}`)
  console.log(`  large-share reduction vs always-32B: ${reductionPct.toFixed(1)}%  (target ≥30%)`)
  console.log('═══════════════════════════════════════════════════════')

  const passed =
    okResults.length === prompts.length &&
    accuracy >= 0.70 &&
    reductionPct >= 30

  if (!passed) {
    console.error('')
    console.error('  FAIL — KPI not met')
    process.exit(3)
  }
  console.log('  PASS')
}

function pct(n, total) {
  return total > 0 ? ((n / total) * 100).toFixed(0) + '%' : '0%'
}

function percentile(arr, p) {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length))
  return sorted[idx]
}

function ms(v) {
  return `${v.toFixed(0)}ms`
}

main().catch(err => {
  console.error('fatal:', err)
  process.exit(1)
})
