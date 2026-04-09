import React from 'react'
import type { MemberAward } from '../../../shared/awards'
import { AwardBadge } from './AwardBadge'

interface LeaderboardTableProps {
  members: MemberAward[]
  onSelectMember?: (member: MemberAward) => void
}

export function LeaderboardTable({ members, onSelectMember }: LeaderboardTableProps) {
  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted text-sm">No members on the leaderboard yet.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" role="table">
        <thead>
          <tr className="border-b border-border-subtle text-text-secondary">
            <th className="text-left py-3 px-4 font-medium" scope="col">Rank</th>
            <th className="text-left py-3 px-4 font-medium" scope="col">Member</th>
            <th className="text-left py-3 px-4 font-medium" scope="col">Tier</th>
            <th className="text-right py-3 px-4 font-medium" scope="col">Score</th>
            <th className="text-right py-3 px-4 font-medium" scope="col">Training (h)</th>
            <th className="text-right py-3 px-4 font-medium" scope="col">Arena ★</th>
            <th className="text-right py-3 px-4 font-medium" scope="col">Skills</th>
            <th className="text-right py-3 px-4 font-medium" scope="col">Issues</th>
            <th className="text-right py-3 px-4 font-medium" scope="col">Knowledge %</th>
          </tr>
        </thead>
        <tbody>
          {members.map(member => (
            <tr
              key={member.member_id}
              onClick={() => onSelectMember?.(member)}
              className="border-b border-border-subtle hover:bg-bg-surface-2 transition-colors cursor-pointer"
              role="row"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') onSelectMember?.(member) }}
            >
              <td className="py-3 px-4 text-text-primary font-semibold">#{member.rank}</td>
              <td className="py-3 px-4 text-text-primary">{member.member_name}</td>
              <td className="py-3 px-4"><AwardBadge tier={member.tier} size="sm" /></td>
              <td className="py-3 px-4 text-right text-text-primary font-mono">{member.composite_score.toFixed(1)}</td>
              <td className="py-3 px-4 text-right text-text-secondary">{member.scores.training_hours}</td>
              <td className="py-3 px-4 text-right text-text-secondary">{member.scores.arena_stars}</td>
              <td className="py-3 px-4 text-right text-text-secondary">{member.scores.skills_developed}</td>
              <td className="py-3 px-4 text-right text-text-secondary">{member.scores.issues_solved}</td>
              <td className="py-3 px-4 text-right text-text-secondary">{member.scores.knowledge_contribution_pct.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
