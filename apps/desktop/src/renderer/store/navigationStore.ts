import { create } from 'zustand'

export type NavSection = 'dashboard' | 'models' | 'chat' | 'training' | 'federation' | 'knowledge' | 'enterprise' | 'settings'

interface NavigationState {
  active: NavSection
  setActive: (section: NavSection) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  active: 'dashboard',
  setActive: (section) => set({ active: section }),
}))
