import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import {
  parseRuntimeCheckArgs,
  normalizeTier,
} from '../sovereign-week1-runtime-check.mjs'

const execFileAsync = promisify(execFile)

test('normalizeTier accepts supported tiers and normalizes casing/spacing', () => {
  assert.equal(normalizeTier('8gb'), '8GB')
  assert.equal(normalizeTier(' 12 GB '), '12GB')
  assert.equal(normalizeTier('24GB'), '24GB')
})

test('normalizeTier returns null for unsupported tiers', () => {
  assert.equal(normalizeTier('16GB'), null)
  assert.equal(normalizeTier(''), null)
  assert.equal(normalizeTier(null), null)
  assert.equal(normalizeTier(undefined), null)
})

test('parseRuntimeCheckArgs throws when --port value is missing', () => {
  assert.throws(
    () => parseRuntimeCheckArgs(['node', 'scripts/sovereign-week1-runtime-check.mjs', '--port']),
    /Missing value for --port/,
  )
})

test('parseRuntimeCheckArgs throws when --port is invalid', () => {
  assert.throws(
    () => parseRuntimeCheckArgs(['node', 'scripts/sovereign-week1-runtime-check.mjs', '--port', 'abc']),
    /Invalid --port value/,
  )
})

test('parseRuntimeCheckArgs throws when --port is out of range', () => {
  assert.throws(
    () => parseRuntimeCheckArgs(['node', 'scripts/sovereign-week1-runtime-check.mjs', '--port', '70000']),
    /Invalid --port value/,
  )
})

test('parseRuntimeCheckArgs throws when --host value is missing', () => {
  assert.throws(
    () => parseRuntimeCheckArgs(['node', 'scripts/sovereign-week1-runtime-check.mjs', '--host']),
    /Missing value for --host/,
  )
})

test('parseRuntimeCheckArgs throws when --vram value is missing', () => {
  assert.throws(
    () => parseRuntimeCheckArgs(['node', 'scripts/sovereign-week1-runtime-check.mjs', '--vram']),
    /Missing value for --vram/,
  )
})

test('parseRuntimeCheckArgs throws when --timeout-ms value is missing', () => {
  assert.throws(
    () => parseRuntimeCheckArgs(['node', 'scripts/sovereign-week1-runtime-check.mjs', '--timeout-ms']),
    /Missing value for --timeout-ms/,
  )
})

test('parseRuntimeCheckArgs throws when --timeout-ms value is invalid', () => {
  assert.throws(
    () => parseRuntimeCheckArgs(['node', 'scripts/sovereign-week1-runtime-check.mjs', '--timeout-ms', '0']),
    /Invalid --timeout-ms value/,
  )
})

test('parseRuntimeCheckArgs parses valid explicit values', () => {
  const args = parseRuntimeCheckArgs([
    'node',
    'scripts/sovereign-week1-runtime-check.mjs',
    '--host',
    'localhost',
    '--port',
    '11555',
    '--vram',
    '8gb',
    '--timeout-ms',
    '5000',
    '--json',
  ])

  assert.equal(args.host, 'localhost')
  assert.equal(args.port, 11555)
  assert.equal(args.vram, '8GB')
  assert.equal(args.timeoutMs, 5000)
  assert.equal(args.json, true)
})

test('parseRuntimeCheckArgs throws on unknown options', () => {
  assert.throws(
    () => parseRuntimeCheckArgs(['node', 'scripts/sovereign-week1-runtime-check.mjs', '--unknown']),
    /Unknown option for runtime-check CLI/,
  )
})

test('parseRuntimeCheckArgs throws on unknown short options', () => {
  assert.throws(
    () => parseRuntimeCheckArgs(['node', 'scripts/sovereign-week1-runtime-check.mjs', '-x']),
    /Unknown option for runtime-check CLI/,
  )
})

test('parseRuntimeCheckArgs throws on positional arguments', () => {
  assert.throws(
    () => parseRuntimeCheckArgs(['node', 'scripts/sovereign-week1-runtime-check.mjs', 'unexpected']),
    /Unexpected positional argument/,
  )
})

test('runtime-check CLI emits JSON for reachable local runtime endpoint', async () => {
  const server = createServer((req, res) => {
    if (req.url === '/api/tags') {
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ models: [{ name: 'model-b' }, { name: 'model-a' }] }))
      return
    }
    res.statusCode = 404
    res.end('not found')
  })

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0

  try {
    const { stdout } = await execFileAsync(process.execPath, [
      'scripts/sovereign-week1-runtime-check.mjs',
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--vram',
      '8GB',
      '--json',
    ])

    const payload = JSON.parse(stdout)
    assert.equal(payload.runtime.reachable, true)
    assert.deepEqual(payload.models.names, ['model-a', 'model-b'])
    assert.equal(payload.profile.normalizedTier, '8GB')
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
})

test('runtime-check CLI exits with code 2 when runtime is unreachable', async () => {
  await assert.rejects(
    execFileAsync(process.execPath, [
      'scripts/sovereign-week1-runtime-check.mjs',
      '--host',
      '127.0.0.1',
      '--port',
      '1',
      '--json',
      '--timeout-ms',
      '20',
    ]),
    error => {
      assert.equal(error.code, 2)
      const payload = JSON.parse(error.stdout)
      assert.equal(payload.runtime.reachable, false)
      assert.equal(typeof payload.runtime.error, 'string')
      return true
    },
  )
})

test('runtime-check --help prints usage text', async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    'scripts/sovereign-week1-runtime-check.mjs',
    '--help',
  ])

  assert.match(stdout, /Usage: node scripts\/sovereign-week1-runtime-check\.mjs/)
  assert.match(stdout, /--timeout-ms <ms>/)
})

test('runtime-check CLI prints human-readable output and invalid VRAM hint', async () => {
  const server = createServer((req, res) => {
    if (req.url === '/api/tags') {
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ models: [{ name: 'model-a' }] }))
      return
    }
    res.statusCode = 404
    res.end('not found')
  })

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0

  try {
    const { stdout } = await execFileAsync(process.execPath, [
      'scripts/sovereign-week1-runtime-check.mjs',
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--vram',
      '16GB',
    ])

    assert.match(stdout, /Sovereign Week 1 Runtime Check/)
    assert.match(stdout, /Reachable: yes/)
    assert.match(stdout, /Models discovered: 1/)
    assert.match(stdout, /VRAM tier '16GB' is invalid/)
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
})

test('runtime-check CLI prints recommended models for valid VRAM tier in human output', async () => {
  const server = createServer((req, res) => {
    if (req.url === '/api/tags') {
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ models: [{ name: 'model-a' }] }))
      return
    }
    res.statusCode = 404
    res.end('not found')
  })

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0

  try {
    const { stdout } = await execFileAsync(process.execPath, [
      'scripts/sovereign-week1-runtime-check.mjs',
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--vram',
      '8GB',
    ])

    assert.match(stdout, /Recommended models for 8GB:/)
    assert.match(stdout, /starcoder2:15b-q4/)
    assert.match(stdout, /qwen2\.5-coder:14b-q4/)
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
})

test('runtime-check CLI reports timeout error when endpoint hangs beyond timeout', async () => {
  const server = createServer((req, res) => {
    if (req.url === '/api/tags') {
      setTimeout(() => {
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify({ models: [{ name: 'late-model' }] }))
      }, 200)
      return
    }
    res.statusCode = 404
    res.end('not found')
  })

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0

  try {
    await assert.rejects(
      execFileAsync(process.execPath, [
        'scripts/sovereign-week1-runtime-check.mjs',
        '--host',
        '127.0.0.1',
        '--port',
        String(port),
        '--json',
        '--timeout-ms',
        '30',
      ]),
      error => {
        assert.equal(error.code, 2)
        const payload = JSON.parse(error.stdout)
        assert.equal(payload.runtime.reachable, false)
        assert.match(payload.runtime.error, /timeout after/i)
        return true
      },
    )
  } finally {
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections()
    }
    await new Promise(resolve => server.close(resolve))
  }
})

test('runtime-check CLI exits with parse error for unknown option', async () => {
  await assert.rejects(
    execFileAsync(process.execPath, [
      'scripts/sovereign-week1-runtime-check.mjs',
      '--unknown-flag',
    ]),
    error => {
      assert.equal(error.code, 1)
      assert.match(error.stderr, /Unknown option for runtime-check CLI/)
      return true
    },
  )
})
