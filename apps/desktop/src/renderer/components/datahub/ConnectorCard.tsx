import { useRef } from 'react'
import { CheckCircle2, Loader2, XCircle, Link, Unlink, Upload } from 'lucide-react'
import type { Connector } from '../../store/dataHubStore'

const AUTH_LABEL: Record<string, string> = {
  oauth2: 'OAuth 2.0',
  apikey: 'API Key',
  'service-token': 'Service Token',
  'gdpr-export': 'Export only',
}

const STATUS_DOT: Record<string, string> = {
  connected: 'w-2 h-2 rounded-full bg-green-500',
  syncing: 'w-2 h-2 rounded-full bg-yellow-400',
  error: 'w-2 h-2 rounded-full bg-red-400',
  disconnected: 'w-2 h-2 rounded-full bg-border-default',
}

interface Props {
  connector: Connector
  onConnect: (id: string) => void
  onDisconnect: (id: string) => void
  onImport: (id: string, fileName: string) => void
}

export function ConnectorCard({ connector, onConnect, onDisconnect, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImport(connector.id, file.name)
      // reset so same file can be re-imported
      e.target.value = ''
    }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return null
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  }

  const StatusIcon = () => {
    if (connector.status === 'syncing') return <Loader2 size={14} aria-hidden="true" className="text-yellow-400 animate-spin" />
    if (connector.status === 'connected') return <CheckCircle2 size={14} aria-hidden="true" className="text-green-500" />
    if (connector.status === 'error') return <XCircle size={14} aria-hidden="true" className="text-red-400" />
    return null
  }

  return (
    <div
      data-testid={`connector-card-${connector.id}`}
      className="bg-bg-surface-2 border border-border-default rounded-lg p-4 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={STATUS_DOT[connector.status]} aria-hidden="true" />
          <p className="text-text-primary text-sm font-medium truncate">{connector.name}</p>
          <StatusIcon />
        </div>
        <span className="bg-bg-surface-3 text-text-muted text-xs px-2 py-0.5 rounded shrink-0">
          {AUTH_LABEL[connector.authType]}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        {connector.lastSyncAt && (
          <p className="text-text-muted text-xs">
            Last sync: {formatDate(connector.lastSyncAt)}
          </p>
        )}
        {connector.errorMessage && (
          <p className="text-red-400 text-xs truncate">{connector.errorMessage}</p>
        )}
        {!connector.lastSyncAt && !connector.errorMessage && (
          <p className="text-text-muted text-xs">Never synced</p>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {connector.apiAvailable ? (
            connector.status === 'connected' || connector.status === 'syncing' ? (
              <button
                onClick={() => onDisconnect(connector.id)}
                className="border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded px-2 py-1 text-xs cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                <Unlink size={12} aria-hidden="true" />
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => onConnect(connector.id)}
                className="bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-text-primary rounded px-2 py-1 text-xs cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                <Link size={12} aria-hidden="true" />
                Connect
              </button>
            )
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".zip,.json,.html"
                onChange={handleFileChange}
                aria-label={`Import export file for ${connector.name}`}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded px-2 py-1 text-xs cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                <Upload size={12} aria-hidden="true" />
                Import File
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
