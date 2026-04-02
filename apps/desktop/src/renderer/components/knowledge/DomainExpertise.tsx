import { DomainStat } from '../../store/knowledgeLibraryStore'

interface DomainExpertiseProps {
  domains: DomainStat[]
}

export function DomainExpertise({ domains }: DomainExpertiseProps) {
  if (domains.length === 0) {
    return <p className="text-text-muted text-sm">No domain expertise tracked yet.</p>
  }

  const maxCount = Math.max(...domains.map((d) => d.count), 1)

  return (
    <div className="flex flex-col gap-3">
      {domains.map((domain) => (
        <div key={`${domain.domain}-${domain.language}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-text-primary text-sm">{domain.domain}</span>
            <span className="text-text-muted text-xs">{domain.count}</span>
          </div>
          <div className="bg-bg-surface-3 rounded-full h-1.5">
            <div
              className="bg-accent-500 rounded-full h-1.5 transition-all"
              style={{ width: `${(domain.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
