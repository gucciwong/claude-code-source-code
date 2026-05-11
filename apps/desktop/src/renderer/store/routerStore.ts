/**
 * W5-T15 — Auto-mode store for the Context-Aware Model Router.
 *
 * Owns three pieces of UI state:
 *   `mode`           — 'manual' (user picks model) or 'auto' (CAMR picks)
 *   `lastChoice`     — most recent CAMR decision so the UI can show the
 *                       "chosen because…" subtitle under the model picker
 *   `pendingDecide`  — true while a /route call is in flight (button gating)
 *
 * The store is intentionally thin — model loading + chat plumbing stay in
 * their existing stores. Auto mode just intercepts the model id at the
 * point of "user pressed Send" and returns whatever the router picked.
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { route, type RouteResponse } from '../services/routerClient'

export type RouterMode = 'manual' | 'auto'

interface RouterState {
  mode: RouterMode
  lastChoice: RouteResponse | null
  pendingDecide: boolean
}

interface RouterActions {
  setMode: (mode: RouterMode) => void
  /** Returns the chosen model id, or `null` if auto failed and caller should
   *  stick with whatever was already active. Always safe to await. */
  decide: (req: {
    prompt: string
    context?: string
    available_models?: string[]
    available_vram_gb?: number
    language?: string
  }) => Promise<string | null>
  clearLastChoice: () => void
}

export const useRouterStore = create<RouterState & RouterActions>()(
  persist(
    (set) => ({
      mode: 'manual',
      lastChoice: null,
      pendingDecide: false,

      setMode(mode) {
        set({ mode })
      },

      async decide(req) {
        set({ pendingDecide: true })
        try {
          const result = await route(req)
          if (result) {
            set({ lastChoice: result, pendingDecide: false })
            return result.model_id
          }
          set({ pendingDecide: false })
          return null
        } catch {
          set({ pendingDecide: false })
          return null
        }
      },

      clearLastChoice() {
        set({ lastChoice: null })
      },
    }),
    {
      name: 'sovereign-router-mode',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ mode: s.mode }), // only persist the user's mode choice
    },
  ),
)

/** Test-only: reset to defaults. */
export function _resetRouterStoreForTests(): void {
  useRouterStore.setState({
    mode: 'manual',
    lastChoice: null,
    pendingDecide: false,
  })
}
