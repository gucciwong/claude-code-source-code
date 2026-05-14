/**
 * Local Token Manager — W3-T8c
 *
 * Generates and persists a per-installation random secret used by the
 * desktop renderer (and spawned services) to authenticate against the
 * local FastAPI services. Matches the contract in
 * `services/_shared/auth.py` (verify_local_token).
 *
 * Storage path: $HOME/.sovereign-code/local.token (mode 0600, dir 0700).
 *
 * Lifecycle:
 *  1. On Electron app ready, call `initLocalToken()` BEFORE spawning
 *     services so the token is propagated via `SOVEREIGN_LOCAL_TOKEN` env.
 *  2. Renderer fetches it via IPC `local-token:get` (registered in main).
 *  3. Services read it via env var or the same file path; identical
 *     value, so renderer-to-service auth always succeeds.
 *
 * The token is rotated only when the user manually deletes the file.
 * That's intentional: rotation forces a desktop restart so all running
 * service processes pick up the new value together.
 */

import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export const TOKEN_DIR_NAME = '.sovereign-code'
export const TOKEN_FILE_NAME = 'local.token'
export const TOKEN_ENV_NAME = 'SOVEREIGN_LOCAL_TOKEN'
export const TOKEN_FILE_ENV_NAME = 'SOVEREIGN_LOCAL_TOKEN_FILE'

/** Resolved absolute path to the token file. Override-able via env for tests. */
export function tokenFilePath(home: string = homedir()): string {
  const override = process.env[TOKEN_FILE_ENV_NAME]
  if (override && override.trim()) return override.trim()
  return join(home, TOKEN_DIR_NAME, TOKEN_FILE_NAME)
}

/**
 * Generate a fresh 32-byte token, hex-encoded (64 chars).
 * Exposed for unit tests.
 */
export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Read the on-disk token, or return null if missing / unreadable / empty.
 * Pure read — never creates anything.
 */
export function readExistingToken(path: string = tokenFilePath()): string | null {
  try {
    if (!existsSync(path)) return null
    const raw = readFileSync(path, { encoding: 'utf-8' })
    const trimmed = raw.trim()
    return trimmed.length > 0 ? trimmed : null
  } catch {
    return null
  }
}

/**
 * Ensure a token file exists; return its contents.
 *
 *  - If the file already exists with a non-empty value, return that value
 *    (idempotent — survives Electron restarts).
 *  - Otherwise generate a new token, persist it with restrictive perms,
 *    and return the new value.
 *
 * Side effects on the calling process:
 *  - Sets `process.env.SOVEREIGN_LOCAL_TOKEN` so child services spawned
 *    afterwards inherit it via FastAPI's `os.getenv(...)` path.
 *  - Sets `process.env.SOVEREIGN_LOCAL_TOKEN_FILE` to the resolved path
 *    so services with no env access still find the file deterministically.
 */
export function initLocalToken(path: string = tokenFilePath()): string {
  const existing = readExistingToken(path)
  if (existing) {
    process.env[TOKEN_ENV_NAME] = existing
    process.env[TOKEN_FILE_ENV_NAME] = path
    return existing
  }

  const dir = dirname(path)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 })
  }

  const token = generateToken()
  writeFileSync(path, token + '\n', { encoding: 'utf-8', mode: 0o600 })
  // On some platforms (e.g. Windows) mode in writeFileSync is advisory; ensure 0600 explicitly.
  try {
    chmodSync(path, 0o600)
  } catch {
    // Windows ignores POSIX perms — ACLs handle isolation. Not fatal.
  }

  process.env[TOKEN_ENV_NAME] = token
  process.env[TOKEN_FILE_ENV_NAME] = path
  return token
}

/**
 * Test/integration helper: clear the in-process env so subsequent calls
 * to `initLocalToken` behave as a fresh boot.
 */
export function _resetTokenEnvForTests(): void {
  delete process.env[TOKEN_ENV_NAME]
  delete process.env[TOKEN_FILE_ENV_NAME]
}
