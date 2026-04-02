import { create } from 'zustand'
import type { ConnectorConfig, AuditEntry } from '../../../shared/enterprise'

type EnterpriseStore = {
  connectors: ConnectorConfig[]
  auditLog: AuditEntry[]
  auditChainValid: boolean | null
  setConnectors: (connectors: ConnectorConfig[]) => void
  addConnector: (connector: ConnectorConfig) => void
  removeConnector: (id: string) => void
  setAuditLog: (entries: AuditEntry[]) => void
  setAuditChainValid: (valid: boolean) => void
  clearConnectors: () => void
}

export const useEnterpriseStore = create<EnterpriseStore>(set => ({
  connectors: [],
  auditLog: [],
  auditChainValid: null,
  setConnectors: connectors => set({ connectors }),
  addConnector: connector => set(s => ({ connectors: [...s.connectors, connector] })),
  removeConnector: id => set(s => ({ connectors: s.connectors.filter(c => c.id !== id) })),
  setAuditLog: auditLog => set({ auditLog }),
  setAuditChainValid: valid => set({ auditChainValid: valid }),
  clearConnectors: () => set({ connectors: [] }),
}))
