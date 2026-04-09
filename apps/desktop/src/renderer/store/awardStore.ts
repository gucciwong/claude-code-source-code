import { create } from 'zustand'
import type { OrgLeaderboard, MemberAward } from '../../shared/awards'

interface AwardStore {
  leaderboard: OrgLeaderboard | null
  selectedMember: MemberAward | null
  isLoading: boolean
  error: string | null
  setLeaderboard: (lb: OrgLeaderboard) => void
  setSelectedMember: (member: MemberAward | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useAwardStore = create<AwardStore>(set => ({
  leaderboard: null,
  selectedMember: null,
  isLoading: false,
  error: null,
  setLeaderboard: leaderboard => set({ leaderboard }),
  setSelectedMember: selectedMember => set({ selectedMember }),
  setLoading: isLoading => set({ isLoading }),
  setError: error => set({ error }),
}))
