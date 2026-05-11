/**
 * Tests for localToken.ts (W3-T8c).
 * Run via `cd apps/desktop && npm test`.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  TOKEN_ENV_NAME,
  TOKEN_FILE_ENV_NAME,
  generateToken,
  initLocalToken,
  readExistingToken,
  tokenFilePath,
  _resetTokenEnvForTests,
} from './localToken'

let workDir: string
let tokenPath: string

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'sovereign-token-test-'))
  tokenPath = join(workDir, '.sovereign-code', 'local.token')
  _resetTokenEnvForTests()
})

afterEach(() => {
  _resetTokenEnvForTests()
  try {
    rmSync(workDir, { recursive: true, force: true })
  } catch {
    // best-effort cleanup; some platforms hold open handles briefly
  }
})

describe('generateToken', () => {
  it('produces 64-char hex strings', () => {
    const t = generateToken()
    expect(t).toMatch(/^[0-9a-f]{64}$/)
  })

  it('returns a different value on each call', () => {
    const a = generateToken()
    const b = generateToken()
    expect(a).not.toBe(b)
  })
})

describe('tokenFilePath', () => {
  it('honors the SOVEREIGN_LOCAL_TOKEN_FILE override', () => {
    process.env[TOKEN_FILE_ENV_NAME] = '/custom/path/.tok'
    expect(tokenFilePath()).toBe('/custom/path/.tok')
  })

  it('falls back to ~/.sovereign-code/local.token', () => {
    delete process.env[TOKEN_FILE_ENV_NAME]
    const p = tokenFilePath('/users/fakehome')
    expect(p.replace(/\\/g, '/')).toBe('/users/fakehome/.sovereign-code/local.token')
  })
})

describe('readExistingToken', () => {
  it('returns null when file missing', () => {
    expect(readExistingToken(tokenPath)).toBeNull()
  })

  it('returns null when file is whitespace-only', () => {
    const dir = join(workDir, '.sovereign-code')
    require('node:fs').mkdirSync(dir, { recursive: true })
    writeFileSync(tokenPath, '   \n\t\n', 'utf-8')
    expect(readExistingToken(tokenPath)).toBeNull()
  })

  it('returns the trimmed token when file is valid', () => {
    const dir = join(workDir, '.sovereign-code')
    require('node:fs').mkdirSync(dir, { recursive: true })
    writeFileSync(tokenPath, 'abc-123\n', 'utf-8')
    expect(readExistingToken(tokenPath)).toBe('abc-123')
  })
})

describe('initLocalToken', () => {
  it('creates the token file on first run', () => {
    const token = initLocalToken(tokenPath)
    expect(existsSync(tokenPath)).toBe(true)
    expect(token).toMatch(/^[0-9a-f]{64}$/)
    expect(readFileSync(tokenPath, 'utf-8').trim()).toBe(token)
  })

  it('sets the SOVEREIGN_LOCAL_TOKEN env var to the created token', () => {
    const token = initLocalToken(tokenPath)
    expect(process.env[TOKEN_ENV_NAME]).toBe(token)
  })

  it('sets SOVEREIGN_LOCAL_TOKEN_FILE to the resolved path', () => {
    initLocalToken(tokenPath)
    expect(process.env[TOKEN_FILE_ENV_NAME]).toBe(tokenPath)
  })

  it('is idempotent: existing token is preserved across calls', () => {
    const first = initLocalToken(tokenPath)
    _resetTokenEnvForTests()
    const second = initLocalToken(tokenPath)
    expect(second).toBe(first)
  })

  it('writes with mode 0600 on POSIX (skipped on Windows)', () => {
    if (process.platform === 'win32') return
    initLocalToken(tokenPath)
    const mode = statSync(tokenPath).mode & 0o777
    expect(mode).toBe(0o600)
  })
})
