/**
 * W7-T20 — First-run onboarding state machine.
 *
 * The user sees four top-level phases (UI W3 — Stitch-distilled flow):
 *
 *   Phase 1 — Pick a model
 *     Internal sub-machine `step`: detect → choose → download → warmup → ready.
 *     Once `step === 'ready'` the model is loaded and the phase is done.
 *
 *   Phase 2 — Import workspace
 *     User picks (or accepts the suggested) repo root. Stored in
 *     `useCodingStore.workspaceRoot`. Skippable — user can pick later
 *     from the Coding screen.
 *
 *   Phase 3 — Enable agent
 *     Toggle agent-mode + dry-run defaults. Skippable — agent mode also
 *     lives in the Chat composer.
 *
 *   Phase 4 — Invite a federation peer (optional)
 *     Show the local node's invite code (if available). User can copy and
 *     send to a peer, or skip entirely — local-first works fine solo.
 *
 * Mode is persisted to localStorage so a hard refresh resumes where the
 * user left off. The model-pick sub-step is intentionally NOT persisted
 * (we want the detection animation to play again on reload mid-phase).
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type OnboardingStep =
  | 'pending'    // brand-new install, screen never shown
  | 'detect'     // animated hardware-profile detection
  | 'choose'     // user picks/confirms the recommended model
  | 'download'   // download in progress
  | 'warmup'    // warm-up inference call
  | 'ready'      // model-pick phase finished — user can dismiss or move on

/**
 * Top-level onboarding phase. UI W3 — Stitch-distilled flow. The model-pick
 * phase contains the existing 5-state sub-machine (`OnboardingStep`); the
 * other three phases are simple one-screen forms with skip.
 */
export type OnboardingPhase =
  | 'model'       // Phase 1 — Pick a model (uses OnboardingStep internally)
  | 'workspace'   // Phase 2 — Import workspace
  | 'agent'       // Phase 3 — Enable agent
  | 'federation'  // Phase 4 — Invite a federation peer (optional)
  | 'complete'    // terminal — screen will be dismissed

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
  /** Top-level phase the user is on (model / workspace / agent / federation). */
  phase: OnboardingPhase
  /** Sub-step within the `model` phase (detect → choose → download → …). */
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
  /** Mark the active phase done and advance to the next one. */
  advancePhase: () => void
  /** Skip the active phase (workspace / agent / federation only — the
   *  model phase isn't skippable because you can't chat without one). */
  skipPhase: () => void
  /** Final exit — flips `hasCompleted` and dismisses the screen. */
  complete: () => void
  reset: () => void   // mostly for tests; the "Reset onboarding" Settings button could call this
}

const INITIAL: OnboardingState = {
  phase: 'model',
  step: 'pending',
  hasCompleted: false,
  recommended: null,
  downloadProgress: 0,
  error: null,
}

const PHASE_ORDER: OnboardingPhase[] = ['model', 'workspace', 'agent', 'federation', 'complete']

/** Helper — get the next phase in the W3 flow. */
export function nextPhase(p: OnboardingPhase): OnboardingPhase {
  const i = PHASE_ORDER.indexOf(p)
  if (i < 0 || i >= PHASE_ORDER.length - 1) return 'complete'
  return PHASE_ORDER[i + 1]
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

      advancePhase() {
        const cur = get().phase
        const next = nextPhase(cur)
        if (next === 'complete') {
          set({ phase: 'complete', hasCompleted: true })
        } else {
          set({ phase: next, error: null })
        }
      },

      skipPhase() {
        // The model phase isn't skippable — without a loaded model the
        // first chat reply hangs forever. We silently no-op here so the
        // UI's "Skip for now" button can be wired without conditionals.
        if (get().phase === 'model') return
        get().advancePhase()
      },

      complete() {
        set({ hasCompleted: true, phase: 'complete', step: 'ready' })
      },

      reset() {
        set({ ...INITIAL })
      },
    }),
    {
      name: 'sovereign-onboarding',
      storage: createJSONStorage(() => localStorage),
      // Persist the gate flag + the active phase so a refresh resumes
      // where the user left off. Transient model-pick sub-state stays
      // volatile (we want the detection animation to play again).
      partialize: (s) => ({ hasCompleted: s.hasCompleted, phase: s.phase }),
    },
  ),
)

/** Test-only reset. */
export function _resetOnboardingStoreForTests(): void {
  useOnboardingStore.setState({ ...INITIAL })
}

// Export the table so tests can assert against the canonical list.
export const _STARTER_MODELS_FOR_TESTS = STARTER_MODELS
