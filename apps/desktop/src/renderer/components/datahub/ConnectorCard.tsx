import { useState, useRef } from 'react'
import { CheckCircle2, Loader2, XCircle, Link, Unlink, Upload, Settings } from 'lucide-react'
import type { Connector } from '../../store/dataHubStore'
import { useDataHubStore } from '../../store/dataHubStore'
import { CONNECTOR_META } from '../../store/connectorMeta'

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

export function ConnectorCard({ connector, onDisconnect, onImport }: Omit<Props, 'onConnect'> & { onConnect?: (id: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [localCreds, setLocalCreds] = useState<Record<string, string>>({})
  const [isConnecting, setIsConnecting] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)

  const { setCredentials, connectWithCredentials } = useDataHubStore()
  const meta = CONNECTOR_META[connector.id]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImport(connector.id, file.name)
      e.target.value = ''
    }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return null
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  }

  const handleSaveAndConnect = async () => {
    setIsConnecting(true)
    setCredentials(connector.id, localCreds)
    const ok = await connectWithCredentials(connector.id)
    setIsConnecting(false)
    if (ok) setIsConfiguring(false)
  }

  const isActive = connector.status === 'connected' || connector.status === 'syncing'

  return (
    <div
      data-testid={`connector-card-${connector.id}`}
      className="bg-bg-surface-2 border border-border-default rounded-lg p-4 flex flex-col gap-3"
    >
      {/* Header row: logo + status dot + name + auth badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Logo with colored-initial fallback */}
          {meta && !logoFailed ? (
            <img
              src={meta.logoUrl}
              alt=""
              aria-hidden="true"
              onError={() => setLogoFailed(true)}
              className="w-6 h-6 rounded object-contain shrink-0 bg-bg-surface-3"
            />
          ) : meta ? (
            <span
              className="w-6 h-6 rounded text-white text-[10px] font-bold flex items-center justify-center shrink-0 select-none"
              style={{ backgroundColor: meta.logoColor }}
              aria-hidden="true"
            >
              {meta.logoInitial}
            </span>
          ) : null}

          <span className={STATUS_DOT[connector.status]} aria-hidden="true" />
          <p className="text-text-primary text-sm font-medium truncate">{connector.name}</p>
          {connector.status === 'syncing' && <Loader2 size={14} aria-hidden="true" className="text-yellow-400 animate-spin shrink-0" />}
          {connector.status === 'connected' && <CheckCircle2 size={14} aria-hidden="true" className="text-green-500 shrink-0" />}
          {connector.status === 'error' && <XCircle size={14} aria-hidden="true" className="text-red-400 shrink-0" />}
        </div>
        <span className="bg-bg-surface-3 text-text-muted text-xs px-2 py-0.5 rounded shrink-0">
          {AUTH_LABEL[connector.authType]}
        </span>
      </div>

      {/* Description */}
      {meta?.description && (
        <p className="text-text-muted text-xs leading-relaxed line-clamp-2">{meta.description}</p>
      )}

      {/* Error message (when not configuring) */}
      {connector.errorMessage && !isConfiguring && (
        <p className="text-red-400 text-xs bg-red-400/10 rounded px-2 py-1">{connector.errorMessage}</p>
      )}

      {/* Inline credential form */}
      {isConfiguring && meta?.credentialFields && meta.credentialFields.length > 0 && (
        <div className="flex flex-col gap-2 border border-border-default rounded-md p-3 bg-bg-surface-3">
          {meta.credentialFields.map(field => (
            <div key={field.key} className="flex flex-col gap-1">
              <label className="text-text-secondary text-xs font-medium">{field.label}</label>
              <input
                type={field.secret ? 'password' : 'text'}
                placeholder={field.placeholder}
                value={localCreds[field.key] ?? ''}
                onChange={e => setLocalCreds(prev => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full bg-bg-surface-2 border border-border-default rounded px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
              {field.hint && <p className="text-text-muted text-[11px]">{field.hint}</p>}
            </div>
          ))}

          {connector.errorMessage && (
            <p className="text-red-400 text-xs mt-1">{connector.errorMessage}</p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSaveAndConnect}
              disabled={isConnecting}
              className="bg-accent-500 hover:bg-accent-400 active:bg-accent-600 disabled:opacity-50 text-text-primary rounded px-3 py-1.5 text-xs cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              {isConnecting ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Link size={12} aria-hidden="true" />}
              {isConnecting ? 'Connecting…' : 'Save & Connect'}
            </button>
            <button
              onClick={() => setIsConfiguring(false)}
              disabled={isConnecting}
              className="border border-border-default text-text-secondary hover:bg-bg-surface-2 rounded px-3 py-1.5 text-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Footer: last sync + action buttons */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-text-muted text-xs">
          {connector.lastSyncAt ? `Last sync: ${formatDate(connector.lastSyncAt)}` : 'Never synced'}
        </p>

        <div className="flex items-center gap-2 shrink-0">
          {connector.apiAvailable ? (
            isActive ? (
              <button
                onClick={() => onDisconnect(connector.id)}
                className="border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded px-2 py-1 text-xs cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                <Unlink size={12} aria-hidden="true" />
                Disconnect
              </button>
            ) : !isConfiguring ? (
              <button
                onClick={() => { setIsConfiguring(true); setLocalCreds({}) }}
                className="bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-text-primary rounded px-2 py-1 text-xs cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                <Settings size={12} aria-hidden="true" />
                Configure
              </button>
            ) : null
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
