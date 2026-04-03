import { useDataHubStore } from '../../store/dataHubStore'
import { ConnectorCard } from './ConnectorCard'

export function HRMPanel() {
  const connectors = useDataHubStore(s => s.connectors)
  const connectConnector = useDataHubStore(s => s.connectConnector)
  const disconnectConnector = useDataHubStore(s => s.disconnectConnector)
  const importFile = useDataHubStore(s => s.importFile)

  const hrmConnectors = connectors.filter(c => c.category === 'hrm')

  return (
    <div className="flex flex-col gap-4">
      <p className="text-text-secondary text-sm">
        Connect your organisation's HR system to give the AI model contextual awareness of your team
        structure, roles, and reporting hierarchy. Data is used locally and never sent to the cloud.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {hrmConnectors.map(connector => (
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
