import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus, X, Database } from 'lucide-react'
import { useEnterpriseStore } from '../../store/enterpriseStore'
import { useEnterpriseData } from '../../hooks/useEnterpriseData'
import { ConnectorCard } from './ConnectorCard'
import type { ConnectorConfig } from '../../../../shared/enterprise'

export function ConnectorList() {
  const { connectors, setConnectors, addConnector, removeConnector } = useEnterpriseStore()
  const { listConnectors, registerConnector, removeConnector: apiRemove } = useEnterpriseData()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'postgres' as ConnectorConfig['type'],
    connectionString: '',
    baseUrl: '',
  })

  useEffect(() => {
    listConnectors().then(setConnectors)
  }, [])

  const handleAdd = async () => {
    const result = await registerConnector({
      name: form.name,
      type: form.type,
      connectionString: form.connectionString || undefined,
      baseUrl: form.baseUrl || undefined,
      enabled: true,
    })
    if (result) {
      addConnector(result)
      setDialogOpen(false)
      setForm({ name: '', type: 'postgres', connectionString: '', baseUrl: '' })
    }
  }

  const handleRemove = async (id: string) => {
    await apiRemove(id)
    removeConnector(id)
  }

  const addDialog = (
    <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[480px] bg-bg-surface-2 border border-border-default rounded-lg p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <Dialog.Title className="text-text-primary font-semibold">Add Connector</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Close dialog" className="text-text-muted hover:text-text-primary cursor-pointer">
                <X size={16} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-text-secondary text-sm">Name</span>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-text-secondary text-sm">Type</span>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as ConnectorConfig['type'] }))}
                className="bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <option value="postgres">PostgreSQL</option>
                <option value="rest">REST API</option>
                <option value="sap">SAP</option>
                <option value="salesforce">Salesforce</option>
              </select>
            </label>
            {form.type === 'postgres' && (
              <label className="flex flex-col gap-1">
                <span className="text-text-secondary text-sm">Connection String</span>
                <input
                  value={form.connectionString}
                  onChange={e => setForm(f => ({ ...f, connectionString: e.target.value }))}
                  placeholder="postgresql://user:pass@host:5432/db"
                  className="bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </label>
            )}
            {form.type === 'rest' && (
              <label className="flex flex-col gap-1">
                <span className="text-text-secondary text-sm">Base URL</span>
                <input
                  value={form.baseUrl}
                  onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))}
                  placeholder="https://api.example.com/v1"
                  className="bg-bg-surface-3 border border-border-default rounded-md px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </label>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Dialog.Close asChild>
              <button className="border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-3 py-2 text-sm cursor-pointer">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleAdd}
              disabled={!form.name}
              className="bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-text-primary text-sm px-4 py-2 rounded-md cursor-pointer"
            >
              Add
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )

  if (connectors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Database size={48} aria-hidden="true" className="text-text-muted" />
        <p className="text-text-muted text-sm">No connectors registered yet.</p>
        <button
          onClick={() => setDialogOpen(true)}
          className="bg-accent-500 hover:bg-accent-400 text-text-primary text-sm px-4 py-2 rounded-md cursor-pointer flex items-center gap-2"
        >
          <Plus size={16} aria-hidden="true" />
          Add Connector
        </button>
        {addDialog}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <span className="text-text-secondary text-sm">
          {connectors.length} connector{connectors.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => setDialogOpen(true)}
          className="bg-accent-500 hover:bg-accent-400 text-text-primary text-sm px-3 py-1.5 rounded-md cursor-pointer flex items-center gap-2"
        >
          <Plus size={14} aria-hidden="true" /> Add Connector
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {connectors.map(c => (
          <ConnectorCard key={c.id} connector={c} onRemove={handleRemove} />
        ))}
      </div>
      {addDialog}
    </div>
  )
}
