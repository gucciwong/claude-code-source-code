import { CheckCircle2, XCircle } from 'lucide-react'
import { useDataHubStore } from '../../store/dataHubStore'

const EVENT_LABEL: Record<string, string> = {
  connect: 'Connected',
  disconnect: 'Disconnected',
  sync: 'Synced',
  import: 'Imported',
}

export function SyncLogTable() {
  const syncLog = useDataHubStore(s => s.syncLog)

  if (syncLog.length === 0) {
    return (
      <p className="text-text-muted text-sm text-center py-8">
        No sync events yet — connect a data source to get started.
      </p>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr>
            {(['Connector', 'Event', 'Status', 'Time', 'Detail'] as const).map(h => (
              <th
                key={h}
                className="text-left text-text-muted font-medium text-xs px-3 py-2 border-b border-border-default"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {syncLog.map(event => (
            <tr key={event.id} className="hover:bg-bg-surface-3">
              <td className="px-3 py-2 text-text-primary border-b border-border-subtle">
                {event.connectorName}
              </td>
              <td className="px-3 py-2 text-text-secondary border-b border-border-subtle">
                {EVENT_LABEL[event.eventType] ?? event.eventType}
              </td>
              <td className="px-3 py-2 border-b border-border-subtle">
                <span className="flex items-center gap-1">
                  {event.status === 'success'
                    ? <CheckCircle2 size={13} aria-hidden="true" className="text-green-500" />
                    : <XCircle size={13} aria-hidden="true" className="text-red-400" />
                  }
                  <span className={event.status === 'success' ? 'text-green-500' : 'text-red-400'}>
                    {event.status === 'success' ? 'OK' : 'Failed'}
                  </span>
                </span>
              </td>
              <td className="px-3 py-2 text-text-muted text-xs border-b border-border-subtle whitespace-nowrap">
                {new Date(event.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
              </td>
              <td className="px-3 py-2 text-text-muted text-xs border-b border-border-subtle">
                {event.detail ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
