#!/usr/bin/env node
/**
 * W7-T21 — Inference performance bench.
 *
 * Measures the two KPIs from PRD §4.2.1 against a running model-manager:
 *   1. First-token latency (ms)          target <500
 *   2. Tokens-per-second (sustained)     target ≥30
 *
 * Reference model: Qwen2.5-Coder-7B Q4_K_M (must be downloaded first).
 * The script is non-destructive — it only hits the streaming inference
 * endpoint, never starts training or downloads.
 *
 * Usage:
 *   node scripts/bench-perf.mjs
 *   MODEL=qwen2.5-coder-7b node scripts/bench-perf.mjs
 *   MODEL_MANAGER=http://localhost:8002 node scripts/bench-perf.mjs --n 5
 *
 * Exit codes:
 *   0  KPI targets met
 *   1  bench ran but KPI missed (CI advisory comment posted)
 *   2  model-manager unreachable
 *   3  no model available to bench
 *
 * CI integration: .github/workflows/perf.yml posts the JSON output as a
 * PR comment via the `gh` CLI; advisory in W7, blocking in W8 (per the
 * GA Runway Plan W8-T21 acceptance criteria).
 */

const BASE = process.env.MODEL_MANAGER || 'http://localhost:8002'
const MODEL = process.env.MODEL || 'qwen2.5-coder-7b'
const argN = (() => {
  const i = process.argv.indexOf('--n')
  return i !== -1 && process.argv[i + 1] ? parseInt(process.argv[i + 1], 10) : 5
})()

// Three representative prompts of growing complexity.
const PROMPTS = [
  {
    name: 'short_completion',
    prompt: 'Complete the Python function:\n\ndef fibonacci(n):',
    max_tokens: 64,
  },
  {
    name: 'medium_chat',
    prompt: 'Explain how Python\'s asyncio event loop schedules tasks under cooperative multitasking. Be concise (3 short paragraphs).',
    max_tokens: 256,
  },
  {
    name: 'long_refactor',
    prompt: 'Refactor this code to use early returns and add type hints:\n\n```python\ndef process(data):\n    if data is not None:\n        if len(data) > 0:\n            result = []\n            for item in data:\n                if item.get("active"):\n                    result.append(item)\n            return result\n        else:\n            return []\n    else:\n        return None\n```',
    max_tokens: 384,
  },
]

// PRD §4.2.1 KPI targets.
const TARGET_FIRST_TOKEN_MS = 500
const TARGET_TOKENS_PER_SEC = 30

async function probe() {
  try {
    const r = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(2000) })
    return r.ok
  } catch {
    return false
  }
}

async function ensureModelLoaded() {
  try {
    const r = await fetch(`${BASE}/api/v1/models`, { signal: AbortSignal.timeout(5000) })
    if (!r.ok) return false
    const body = await r.json()
    const models = body.cached_models || body.models || []
    const found = models.some(m => (m.id || m.name || '').includes(MODEL.split(/[/:]/)[0]))
    return found
  } catch {
    return false
  }
}

/**
 * Run one streaming inference and capture per-token timing.
 * Returns { firstTokenMs, totalMs, tokens, tps, error }.
 */
async function runOne(prompt, maxTokens) {
  const url = `${BASE}/api/v1/inference/stream`
  const start = performance.now()
  let firstTokenMs = null
  let tokens = 0
  let totalChars = 0

  let resp
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model_id: MODEL,
        prompt,
        max_tokens: maxTokens,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(60_000),
    })
  } catch (err) {
    return { error: `fetch failed: ${err.message}` }
  }

  if (!resp.ok) return { error: `HTTP ${resp.status}` }
  if (!resp.body) return { error: 'no body stream' }

  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (firstTokenMs === null) firstTokenMs = performance.now() - start
      const chunk = decoder.decode(value, { stream: true })
      totalChars += chunk.length
      // Rough token estimate from chars (English ≈ 4 chars/token, code closer to 3).
      tokens += Math.max(1, Math.round(chunk.length / 4))
    }
  } catch (err) {
    return { error: `stream error: ${err.message}` }
  }

  const totalMs = performance.now() - start
  const tps = totalMs > 0 ? (tokens * 1000) / totalMs : 0
  return { firstTokenMs: firstTokenMs ?? totalMs, totalMs, tokens, tps }
}

function percentile(arr, p) {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]
}

async function main() {
  if (!(await probe())) {
    console.error(`✗ model-manager unreachable at ${BASE}`)
    process.exit(2)
  }
  if (!(await ensureModelLoaded())) {
    console.error(`✗ model "${MODEL}" not loaded — run \`POST /api/v1/models/${MODEL}/download\` first`)
    process.exit(3)
  }

  const allRuns = []
  for (const p of PROMPTS) {
    console.log(`\n→ prompt "${p.name}" (max_tokens=${p.max_tokens})`)
    for (let i = 0; i < argN; i++) {
      const r = await runOne(p.prompt, p.max_tokens)
      if (r.error) {
        console.log(`  run ${i + 1}: ERROR ${r.error}`)
        continue
      }
      allRuns.push({ prompt: p.name, ...r })
      console.log(
        `  run ${i + 1}: first=${r.firstTokenMs.toFixed(0)}ms  total=${r.totalMs.toFixed(0)}ms  ` +
        `tokens=${r.tokens}  tps=${r.tps.toFixed(1)}`,
      )
    }
  }

  if (allRuns.length === 0) {
    console.error('\n✗ no successful runs')
    process.exit(1)
  }

  const firstP50 = percentile(allRuns.map(r => r.firstTokenMs), 0.50)
  const firstP95 = percentile(allRuns.map(r => r.firstTokenMs), 0.95)
  const tpsP50 = percentile(allRuns.map(r => r.tps), 0.50)
  const tpsP05 = percentile(allRuns.map(r => r.tps), 0.05)  // worst 5%

  const meetsFirstToken = firstP95 < TARGET_FIRST_TOKEN_MS
  const meetsTps = tpsP05 >= TARGET_TOKENS_PER_SEC

  console.log('')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`  Inference Perf Bench — ${MODEL} on ${BASE}`)
  console.log('═══════════════════════════════════════════════════════')
  console.log(`  runs              : ${allRuns.length} across ${PROMPTS.length} prompts`)
  console.log(`  first-token p50   : ${firstP50.toFixed(0)} ms`)
  console.log(`  first-token p95   : ${firstP95.toFixed(0)} ms     target <${TARGET_FIRST_TOKEN_MS}  ${meetsFirstToken ? '✓' : '✗'}`)
  console.log(`  tokens/sec p50    : ${tpsP50.toFixed(1)}`)
  console.log(`  tokens/sec p05    : ${tpsP05.toFixed(1)}        target ≥${TARGET_TOKENS_PER_SEC}    ${meetsTps ? '✓' : '✗'}`)
  console.log('═══════════════════════════════════════════════════════')

  // Machine-readable JSON for CI ingestion. Single line so workflows can grep.
  const summary = {
    schema_version: 1,
    model: MODEL,
    runs: allRuns.length,
    first_token_p50_ms: Math.round(firstP50),
    first_token_p95_ms: Math.round(firstP95),
    tokens_per_sec_p50: Number(tpsP50.toFixed(2)),
    tokens_per_sec_p05: Number(tpsP05.toFixed(2)),
    targets: {
      first_token_ms_p95: TARGET_FIRST_TOKEN_MS,
      tokens_per_sec_min: TARGET_TOKENS_PER_SEC,
    },
    pass: meetsFirstToken && meetsTps,
    timestamp: new Date().toISOString(),
  }
  console.log('\n' + JSON.stringify(summary))

  process.exit(meetsFirstToken && meetsTps ? 0 : 1)
}

main().catch(err => {
  console.error('fatal:', err)
  process.exit(1)
})
