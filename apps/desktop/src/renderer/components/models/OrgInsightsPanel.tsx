import { Users, Star, FlaskConical, Shield, Download } from 'lucide-react'
import { useOrgModelsStore, OrgRecommendation, OrgTrainedModel } from '../../store/orgModelsStore'

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

function RecommendationCard({ rec }: { rec: OrgRecommendation }) {
  const recommenderText =
    rec.recommenders.length === 1
      ? rec.recommenders[0]
      : `${rec.recommenders.slice(0, 2).join(', ')}${rec.recommenders.length > 2 ? ` +${rec.recommenders.length - 2}` : ''}`

  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4 flex flex-col gap-3">
      {/* Model header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="bg-accent-500/10 text-accent-400 text-xs px-2 py-0.5 rounded font-mono flex-shrink-0">
            {rec.params}
          </span>
          <span className="bg-bg-surface-3 text-text-secondary text-xs px-2 py-0.5 rounded flex-shrink-0">
            {rec.arch}
          </span>
          <span className="text-sm font-medium text-text-primary min-w-0">{rec.modelName}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Star size={12} className="text-yellow-400" aria-hidden="true" />
          <span className="text-xs font-semibold text-yellow-400">{rec.endorsements}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-text-secondary line-clamp-2">{rec.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Users size={12} className="text-text-muted flex-shrink-0" aria-hidden="true" />
          <span className="text-xs text-text-muted truncate">{recommenderText}</span>
        </div>
        <button
          type="button"
          className="bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-text-primary text-sm font-medium px-4 py-1.5 rounded-md cursor-pointer flex items-center gap-1.5 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          aria-label={`Download ${rec.modelName}`}
        >
          <Download size={14} aria-hidden="true" />
          Download
        </button>
      </div>
    </div>
  )
}

interface TrainedModelCardProps {
  model: OrgTrainedModel
  isMostTrained: boolean
}

function TrainedModelCard({ model, isMostTrained }: TrainedModelCardProps) {
  return (
    <div
      className={[
        'bg-bg-surface-2 rounded-lg p-4 flex flex-col gap-3',
        model.isUniqueToOrg ? 'border border-accent-500/40' : 'border border-border-default',
      ].join(' ')}
    >
      {/* Model header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="bg-accent-500/10 text-accent-400 text-xs px-2 py-0.5 rounded font-mono flex-shrink-0">
            {model.params}
          </span>
          <span className="bg-bg-surface-3 text-text-secondary text-xs px-2 py-0.5 rounded flex-shrink-0">
            {model.arch}
          </span>
          <span className="text-sm font-medium text-text-primary min-w-0">{model.displayName}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
          {isMostTrained && (
            <span className="bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded">
              Most trained
            </span>
          )}
          {model.isUniqueToOrg && (
            <span className="bg-accent-500/10 text-accent-400 text-xs px-2 py-0.5 rounded flex items-center gap-1">
              <Shield size={10} aria-hidden="true" />
              Unique to org
            </span>
          )}
        </div>
      </div>

      {/* Base model */}
      <p className="text-xs text-text-muted">Base: {model.baseModel}</p>

      {/* Stats + action */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-xs text-text-secondary">
            <FlaskConical size={12} aria-hidden="true" />
            {model.trainingRuns} training runs
          </span>
          <span className="text-xs text-text-muted">
            Last: {formatDate(model.lastTrainedAt)}
          </span>
        </div>
        <button
          type="button"
          className="border border-border-default text-text-secondary hover:bg-bg-surface-3 text-sm px-3 py-1.5 rounded-md cursor-pointer flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          aria-label={`Load ${model.displayName}`}
        >
          Load
        </button>
      </div>
    </div>
  )
}

export function OrgInsightsPanel() {
  const { recommendations, trainedModels } = useOrgModelsStore()
  const sortedRecs = [...recommendations].sort((a, b) => b.endorsements - a.endorsements)
  const sortedTrained = [...trainedModels].sort((a, b) => b.trainingRuns - a.trainingRuns)
  const maxRuns = sortedTrained[0]?.trainingRuns ?? 0

  return (
    <div className="p-6 flex flex-col gap-8 max-w-3xl">
      {/* Screen header */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Org Insights</h2>
        <p className="text-sm text-text-secondary mt-1">
          Model intelligence sourced from within your organization
        </p>
      </div>

      {/* Recommended by team */}
      <section aria-labelledby="org-recommendations-heading">
        <div className="flex items-center gap-2 mb-1">
          <Users size={15} className="text-accent-400" aria-hidden="true" />
          <h3
            id="org-recommendations-heading"
            className="text-sm font-semibold text-text-secondary uppercase tracking-wide"
          >
            Recommended by Your Team
          </h3>
        </div>
        <p className="text-xs text-text-muted mb-4">
          Models endorsed by your colleagues for specific use cases
        </p>
        <ul role="list" className="flex flex-col gap-3 list-none p-0 m-0">
          {sortedRecs.map(rec => (
            <li key={rec.modelId}>
              <RecommendationCard rec={rec} />
            </li>
          ))}
        </ul>
      </section>

      {/* Org trained models */}
      <section aria-labelledby="org-trained-heading">
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical size={15} className="text-accent-400" aria-hidden="true" />
          <h3
            id="org-trained-heading"
            className="text-sm font-semibold text-text-secondary uppercase tracking-wide"
          >
            Your Org&rsquo;s Trained Models
          </h3>
        </div>
        <p className="text-xs text-text-muted mb-4">
          Models your organization has uniquely fine-tuned — your AI assets
        </p>
        <ul role="list" className="flex flex-col gap-3 list-none p-0 m-0">
          {sortedTrained.map(model => (
            <li key={model.modelId}>
              <TrainedModelCard model={model} isMostTrained={model.trainingRuns === maxRuns} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
