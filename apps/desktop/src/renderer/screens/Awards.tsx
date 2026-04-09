import React, { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { useAwards } from '../hooks/useAwards'
import { useAwardStore } from '../store/awardStore'
import { LeaderboardTable, MemberAwardCard } from '../components/awards'
import type { MemberAward } from '../../shared/awards'

const DEFAULT_ORG = 'default-org'

export function Awards() {
  const { fetchLeaderboard, seedDemoData } = useAwards()
  const { leaderboard, selectedMember, isLoading, error, setSelectedMember } = useAwardStore()
  const [orgId] = useState(DEFAULT_ORG)

  useEffect(() => {
    fetchLeaderboard(orgId)
  }, [fetchLeaderboard, orgId])

  const handleSeedDemo = async () => {
    await seedDemoData(orgId)
  }

  const handleSelectMember = (member: MemberAward) => {
    setSelectedMember(member)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Trophy size={20} aria-hidden="true" className="text-accent-400" />
              <h1 className="text-text-primary text-xl font-semibold">Awards</h1>
            </div>
            <p className="text-text-secondary text-sm">
              Member recognition based on training, arena stars, skills, issues solved, and knowledge contributions
            </p>
          </div>
          <button
            onClick={handleSeedDemo}
            className="bg-accent-500 hover:bg-accent-400 text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            Load Demo Data
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-300 text-sm" role="alert">
            {error}
          </div>
        )}

        {isLoading && !leaderboard && (
          <p className="text-text-muted text-sm text-center py-8">Loading awards…</p>
        )}

        {selectedMember && (
          <div className="mb-6">
            <MemberAwardCard award={selectedMember} onClose={() => setSelectedMember(null)} />
          </div>
        )}

        {leaderboard ? (
          <LeaderboardTable members={leaderboard.members} onSelectMember={handleSelectMember} />
        ) : (
          !isLoading && (
            <div className="text-center py-12">
              <Trophy size={48} aria-hidden="true" className="text-text-muted mx-auto mb-4" />
              <p className="text-text-primary text-lg font-medium mb-2">No award data yet</p>
              <p className="text-text-secondary text-sm mb-4">Click &quot;Load Demo Data&quot; to populate the leaderboard with sample members</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
