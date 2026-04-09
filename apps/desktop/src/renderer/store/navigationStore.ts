import { create } from 'zustand'

export type NavSection = 'dashboard' | 'models' | 'chat' | 'coding' | 'developer' | 'training' | 'research' | 'federation' | 'knowledge' | 'enterprise' | 'datahub' | 'decisiongraph' | 'orchestration' | 'orgintelligence' | 'personacouncil' | 'analytics' | 'messaging' | 'semanticsearch' | 'plugins' | 'prreview' | 'finetune' | 'codecompletion' | 'memory' | 'awards' | 'health' | 'settings'

interface NavigationState {
  active: NavSection
  setActive: (section: NavSection) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  active: 'dashboard',
  setActive: (section) => set({ active: section }),
}))
