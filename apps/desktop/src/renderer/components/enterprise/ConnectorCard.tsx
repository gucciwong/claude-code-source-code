import { Trash2, Database, CheckCircle2, XCircle } from 'lucide-react'
import type { ConnectorConfig } from '../../../../shared/enterprise'

interface Props {
  connector: ConnectorConfig
  onRemove: (id: string) => void
}

export function ConnectorCard({ connector, onRemove }: Props) {
  const typeLabel = {
    postgres: 'PostgreSQL',
    rest: 'REST API',
    sap: 'SAP',
    salesforce: 'Salesforce',
  }[connector.type]

  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Database size={16} aria-hidden="true" className="text-accent-400" />
        <div>
          <p className="text-text-primary text-sm font-medium">{connector.name}</p>
          <p className="text-text-muted text-xs">{typeLabel}</p>
        </div>
        {connector.enabled
          ? <CheckCircle2 size={14} aria-hidden="true" className="text-green-500" />
          : <XCircle size={14} aria-hidden="true" className="text-red-400" />
        }
      </div>
      <button
        onClick={() => onRemove(connector.id)}
        aria-label={`Remove ${connector.name} connector`}
        className="text-text-muted hover:text-red-400 cursor-pointer"
      >
        <Trash2 size={14} aria-hidden="true" />
      </button>
    </div>
  )
}
