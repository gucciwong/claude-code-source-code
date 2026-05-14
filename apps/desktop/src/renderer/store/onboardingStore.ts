/**
 * W7-T20 — First-run onboarding state machine.
 *
 * On first launch the desktop walks the user through:
 *   1. detect → query the system VRAM via `useSystemStore` (already populated
 *      by the hardware-profile hook) and pick a `recommendedModel` from a
 *      static table keyed by VRAM tier.
 *   2. download → kick off the model-manager `/download` flow; UI polls for
 *      progress (we just store a percentage here; the actual fetch is done
 *      by the existing `useModelManager` hook).
 *   3. warmup → after download completes, hit `/api/v1/inference/warmup` so
 *      the first chat reply isn't cold-start slow.
 *   4. ready → terminal state; clicking the "Take me to Chat" button calls
 *      `complete()` which persists `hasCompleted` to localStorage so the
 *      screen never reappears.
 *
 * Mode is persisted to localStorage so a hard refresh during onboarding
 * resumes where the user left off (except `pending` ↦ `detect` on reload —
 * we want the user to see the detection animation each time).
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type OnboardingStep =
  | 'pending'    // brand-new install, screen never shown
  | 'detect'     // animated hardware-profile detection
  | 'choose'     // user picks/confirms the recommended model
  | 'download'   // download in progress
  | 'warmup'    // warm-up inference call
  | 'ready'      // finished; user can dismiss

export interface StarterModel {
  id: string           // HuggingFace canonical id, e.g. "Qwen/Qwen2.5-Coder-7B-Instruct-GGUF"
  display: string      // human-friendly name
  vram_min_gb: number  // minimum VRAM required
  size_gb: number      // approximate download size
  reason: string       // why this model for this tier
}

// Tiered recommendation table, sorted by VRAM ascending.
// Picked to match the PRD §4.2.1 hardware-requirements table.
const STARTER_MODELS: StarterModel[] = [
  {
    id: 'Qwen/Qwen2.5-Coder-7B-Instruct-GGUF',
    display: 'Qwen2.5 Coder 7B (Q4_K_M)',
    vram_min_gb: 6,
    size_gb: 4.4,
    reason: '6–12 GB VRAM — fastest first-token, great defaults for coding tasks',
  },
  {
    id: 'Qwen/Qwen2.5-Coder-14B-Instruct-GGUF',
    display: 'Qwen2.5 Coder 14B (Q4_K_M)',
    vram_min_gb: 10,
    size_gb: 8.5,
    reason: '12–16 GB VRAM — higher quality for refactors and reviews',
  },
  {
    id: 'Qwen/Qwen2.5-Coder-32B-Instruct-GGUF',
    display: 'Qwen2.5 Coder 32B (Q4_K_M)',
    vram_min_gb: 22,
    size_gb: 18,
    reason: '24+ GB VRAM — top quality for complex tasks',
  },
  {
    id: 'Qwen/Qwen2.5-Coder-3B-Instruct-GGUF',
    display: 'Qwen2.5 Coder 3B (Q4_K_M) (low-VRAM fallback)',
    vram_min_gb: 0,
    size_gb: 1.8,
    reason: 'Less than 6 GB VRAM — runs even on integrated graphics',
  },
]

export function pickStarter(vramGb: number | null | undefined): StarterModel {
  // null/undefined → conservative fallback (3B).
  if (vramGb == null || !Number.isFinite(vramGb)) {
    return STARTER_MODELS[STARTER_MODELS.length - 1]
  }
  // Pick the largest model the user can fit. STARTER_MODELS is ordered
  // ascending by vram_min_gb so we scan from the back.
  for (let i = STARTER_MODELS.length - 2; i >= 0; i--) {
    if (vramGb >= STARTER_MODELS[i].vram_min_gb) return STARTER_MODELS[i]
  }
  return STARTER_MODELS[STARTER_MODELS.length - 1]
}

interface OnboardingState {
  step: OnboardingStep
  hasCompleted: boolean
  recommended: StarterModel | null
  downloadProgress: number // 0..100
  error: string | null
}

interface OnboardingActions {
  startDetection: (vramGb: number | null | undefined) => void
  confirmChoice: () => void
  setDownloadProgress: (p: number) => void
  finishDownload: () => void
  finishWarmup: () => void
  fail: (err: string) => void
  complete: () => void
  reset: () => void   // mostly for tests; the "Reset onboarding" Settings button could call this
}

const INITIAL: OnboardingState = {
  step: 'pending',
  hasCompleted: false,
  recommended: null,
  downloadProgress: 0,
  error: null,
}

export const useOnboardingStore = create<OnboardingState & OnboardingActions>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      startDetection(vramGb) {
        // detection itself is just a UI affordance — we already have the
        // vram value at this point; pick the model immediately so the
        // next `choose` step can render the recommendation.
        const pick = pickStarter(vramGb)
        set({ step: 'detect', recommended: pick, error: null })
      },

      confirmChoice() {
        if (!get().recommended) return
        set({ step: 'choose' })
      },

      setDownloadProgress(p) {
        const clamped = Math.max(0, Math.min(100, Math.round(p)))
        set({ step: 'download', downloadProgress: clamped })
      },

      finishDownload() {
        set({ step: 'warmup', downloadProgress: 100 })
      },

      finishWarmup() {
        set({ step: 'ready' })
      },

      fail(err) {
        set({ error: err })
      },

      complete() {
        set({ hasCompleted: true, step: 'ready' })
      },

      reset() {
        set({ ...INITIAL })
      },
    }),
    {
      name: 'sovereign-onboarding',
      storage: createJSONStorage(() => localStorage),
      // We persist only the gate flag; transient progress is volatile.
      partialize: (s) => ({ hasCompleted: s.hasCompleted }),
    },
  ),
)

/** Test-only reset. */
export function _resetOnboardingStoreForTests(): void {
  useOnboardingStore.setState({ ...INITIAL })
}

// Export the table so tests can assert against the canonical list.
export const _STARTER_MODELS_FOR_TESTS = STARTER_MODELS
