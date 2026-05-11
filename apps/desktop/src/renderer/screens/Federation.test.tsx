/**
 * Federation.tsx is a backwards-compat re-export of FederationCore.
 * The full behavioural test suite lives in FederationCore.test.tsx.
 *
 * This file used to duplicate that suite (legacy mock-data screen had its
 * own assertions); it now only verifies the re-export wiring so the test
 * runner doesn't execute identical assertions twice.
 *
 * Cleanup: W1-T2 in docs/plans/2026-05-11-ga-runway-plan.md.
 */
import { describe, it, expect } from 'vitest'
import { Federation } from './Federation'
import { FederationCore } from './FederationCore'

describe('Federation re-export', () => {
  it('exports the same component as FederationCore', () => {
    expect(Federation).toBe(FederationCore)
  })
})
