import { Info } from 'lucide-react'
import { useDataHubStore } from '../../store/dataHubStore'
import { ConnectorCard } from './ConnectorCard'

export function PersonalDataPanel() {
  const connectors = useDataHubStore(s => s.connectors)
  const connectConnector = useDataHubStore(s => s.connectConnector)
  const disconnectConnector = useDataHubStore(s => s.disconnectConnector)
  const importFile = useDataHubStore(s => s.importFile)

  const socialConnectors = connectors.filter(c => c.category === 'social')
  const exportOnly = socialConnectors.filter(c => !c.apiAvailable)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-text-secondary text-sm">
        Optionally connect personal accounts or import data exports to help the model understand
        your communication style, interests, and history. All data stays local.
      </p>

      {exportOnly.length > 0 && (
        <div className="flex items-start gap-2 bg-bg-surface-3 border border-border-subtle rounded-lg px-4 py-3">
          <Info size={14} aria-hidden="true" className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-text-secondary text-xs">
            <span className="text-blue-400 font-medium">Export-only platforms: </span>
            {exportOnly.map(c => c.name).join(', ')} don't provide a live API.
            Use their official <span className="text-text-primary">Settings → Download Your Data</span> export,
            then click <span className="text-text-primary">Import File</span> to load the zip.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {socialConnectors.map(connector => (
          <ConnectorCard
            key={connector.id}
            connector={connector}
            onConnect={connectConnector}
            onDisconnect={disconnectConnector}
            onImport={importFile}
          />
        ))}
      </div>
    </div>
  )
}
