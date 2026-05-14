/**
 * Tests for the W7-T20 onboarding store.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  useOnboardingStore,
  pickStarter,
  _resetOnboardingStoreForTests,
  _STARTER_MODELS_FOR_TESTS,
} from './onboardingStore'

beforeEach(() => {
  _resetOnboardingStoreForTests()
})

afterEach(() => {
  _resetOnboardingStoreForTests()
})

describe('pickStarter()', () => {
  it('returns the 3B fallback when VRAM is null', () => {
    const m = pickStarter(null)
    expect(m.display).toMatch(/3B/)
  })

  it('returns the 3B fallback when VRAM is undefined', () => {
    const m = pickStarter(undefined as unknown as number)
    expect(m.display).toMatch(/3B/)
  })

  it('returns the 3B fallback when VRAM is NaN', () => {
    const m = pickStarter(Number.NaN)
    expect(m.display).toMatch(/3B/)
  })

  it('returns the 3B fallback when VRAM is below 6GB', () => {
    expect(pickStarter(4).display).toMatch(/3B/)
    expect(pickStarter(5.5).display).toMatch(/3B/)
  })

  it('returns the 7B model for the 6–10 GB tier', () => {
    expect(pickStarter(6).display).toMatch(/7B/)
    expect(pickStarter(8).display).toMatch(/7B/)
    expect(pickStarter(9.9).display).toMatch(/7B/)
  })

  it('returns the 14B model for the 10–22 GB tier', () => {
    expect(pickStarter(10).display).toMatch(/14B/)
    expect(pickStarter(16).display).toMatch(/14B/)
    expect(pickStarter(21.9).display).toMatch(/14B/)
  })

  it('returns the 32B model when VRAM ≥ 22 GB', () => {
    expect(pickStarter(22).display).toMatch(/32B/)
    expect(pickStarter(48).display).toMatch(/32B/)
  })

  it('starter list is sorted by vram_min_gb ascending', () => {
    // We rely on this ordering in pickStarter — guard it explicitly.
    const tiers = _STARTER_MODELS_FOR_TESTS.slice(0, -1).map(m => m.vram_min_gb)
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i]).toBeGreaterThanOrEqual(tiers[i - 1])
    }
  })
})

describe('useOnboardingStore', () => {
  it('starts in pending step with no completion', () => {
    const s = useOnboardingStore.getState()
    expect(s.step).toBe('pending')
    expect(s.hasCompleted).toBe(false)
    expect(s.recommended).toBeNull()
    expect(s.downloadProgress).toBe(0)
    expect(s.error).toBeNull()
  })

  it('startDetection picks a model based on VRAM and moves to detect', () => {
    useOnboardingStore.getState().startDetection(16)
    const s = useOnboardingStore.getState()
    expect(s.step).toBe('detect')
    expect(s.recommended).not.toBeNull()
    expect(s.recommended!.display).toMatch(/14B/)
  })

  it('confirmChoice only fires when a recommendation exists', () => {
    // No recommendation yet — confirmChoice should be a no-op.
    useOnboardingStore.getState().confirmChoice()
    expect(useOnboardingStore.getState().step).toBe('pending')

    useOnboardingStore.getState().startDetection(8)
    useOnboardingStore.getState().confirmChoice()
    expect(useOnboardingStore.getState().step).toBe('choose')
  })

  it('setDownloadProgress clamps to 0..100 and rounds', () => {
    useOnboardingStore.getState().setDownloadProgress(-5)
    expect(useOnboardingStore.getState().downloadProgress).toBe(0)
    useOnboardingStore.getState().setDownloadProgress(42.7)
    expect(useOnboardingStore.getState().downloadProgress).toBe(43)
    useOnboardingStore.getState().setDownloadProgress(150)
    expect(useOnboardingStore.getState().downloadProgress).toBe(100)
  })

  it('finishDownload moves to warmup at 100%', () => {
    useOnboardingStore.getState().setDownloadProgress(50)
    useOnboardingStore.getState().finishDownload()
    const s = useOnboardingStore.getState()
    expect(s.step).toBe('warmup')
    expect(s.downloadProgress).toBe(100)
  })

  it('finishWarmup moves to ready', () => {
    useOnboardingStore.getState().finishWarmup()
    expect(useOnboardingStore.getState().step).toBe('ready')
  })

  it('complete sets hasCompleted true and lands on ready', () => {
    useOnboardingStore.getState().complete()
    const s = useOnboardingStore.getState()
    expect(s.hasCompleted).toBe(true)
    expect(s.step).toBe('ready')
  })

  it('fail() records error without changing step', () => {
    useOnboardingStore.getState().startDetection(8)
    useOnboardingStore.getState().fail('disk full')
    const s = useOnboardingStore.getState()
    expect(s.step).toBe('detect') // unchanged
    expect(s.error).toBe('disk full')
  })

  it('reset() returns to initial state', () => {
    useOnboardingStore.getState().startDetection(16)
    useOnboardingStore.getState().complete()
    useOnboardingStore.getState().reset()
    const s = useOnboardingStore.getState()
    expect(s.step).toBe('pending')
    expect(s.hasCompleted).toBe(false)
    expect(s.recommended).toBeNull()
  })
})
