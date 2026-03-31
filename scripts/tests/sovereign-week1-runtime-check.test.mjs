import test from 'node:test'
import assert from 'node:assert/strict'

import {
  parseRuntimeCheckArgs,
  normalizeTier,
} from '../sovereign-week1-runtime-check.mjs'

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
