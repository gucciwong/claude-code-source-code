import { ShieldCheck, ShieldAlert } from 'lucide-react'
import { useEnterpriseStore } from '../../store/enterpriseStore'

export function AuditLogTable() {
  const { auditLog, auditChainValid } = useEnterpriseStore()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {auditChainValid === true && (
          <span className="flex items-center gap-1 text-green-500 text-xs">
            <ShieldCheck size={14} aria-hidden="true" />
            Chain valid
          </span>
        )}
        {auditChainValid === false && (
          <span className="flex items-center gap-1 text-red-400 text-xs">
            <ShieldAlert size={14} aria-hidden="true" />
            Chain TAMPERED
          </span>
        )}
        {auditChainValid === null && (
          <span className="text-text-muted text-xs">Chain status unknown</span>
        )}
      </div>

      {auditLog.length === 0 ? (
        <p className="text-text-muted text-sm py-8 text-center">No audit entries yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Audit log">
            <thead>
              <tr className="border-b border-border-default text-text-muted text-xs">
                <th className="text-left py-2 px-3 font-medium">Time</th>
                <th className="text-left py-2 px-3 font-medium">Connector</th>
                <th className="text-left py-2 px-3 font-medium">Rows</th>
                <th className="text-left py-2 px-3 font-medium">PII Masked</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map(entry => (
                <tr key={entry.id} className="border-b border-border-subtle hover:bg-bg-surface-2">
                  <td className="py-2 px-3 text-text-secondary">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-3 text-text-primary font-mono text-xs">
                    {entry.connectorId.slice(0, 8)}
                  </td>
                  <td className="py-2 px-3 text-text-secondary">{entry.rowsReturned}</td>
                  <td className="py-2 px-3 text-text-secondary">{entry.piiEntitiesMasked}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
