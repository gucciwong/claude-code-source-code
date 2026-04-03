import { create } from 'zustand'

export type ConnectorStatus = 'disconnected' | 'connected' | 'syncing' | 'error'
export type ConnectorCategory = 'hrm' | 'social'
export type AuthType = 'oauth2' | 'apikey' | 'service-token' | 'gdpr-export'

export interface Connector {
  id: string
  name: string
  category: ConnectorCategory
  authType: AuthType
  /** false = no live API; user must import a GDPR data export file */
  apiAvailable: boolean
  status: ConnectorStatus
  lastSyncAt: string | null
  errorMessage?: string
}

export interface SyncEvent {
  id: string
  connectorId: string
  connectorName: string
  eventType: 'connect' | 'sync' | 'disconnect' | 'import'
  status: 'success' | 'failed'
  timestamp: string
  detail?: string
}

const HRM_CONNECTORS: Connector[] = [
  { id: 'msgraph', name: 'Microsoft Active Directory', category: 'hrm', authType: 'oauth2', apiAvailable: true, status: 'disconnected', lastSyncAt: null },
  { id: 'workday', name: 'Workday', category: 'hrm', authType: 'oauth2', apiAvailable: true, status: 'disconnected', lastSyncAt: null },
  { id: 'sapsuccessfactors', name: 'SAP SuccessFactors', category: 'hrm', authType: 'oauth2', apiAvailable: true, status: 'disconnected', lastSyncAt: null },
  { id: 'bamboohr', name: 'BambooHR', category: 'hrm', authType: 'apikey', apiAvailable: true, status: 'disconnected', lastSyncAt: null },
  { id: 'rippling', name: 'Rippling', category: 'hrm', authType: 'oauth2', apiAvailable: true, status: 'disconnected', lastSyncAt: null },
  { id: 'personio', name: 'Personio', category: 'hrm', authType: 'oauth2', apiAvailable: true, status: 'disconnected', lastSyncAt: null },
  { id: 'deel', name: 'Deel', category: 'hrm', authType: 'apikey', apiAvailable: true, status: 'disconnected', lastSyncAt: null },
  { id: 'zohopeople', name: 'Zoho People', category: 'hrm', authType: 'oauth2', apiAvailable: true, status: 'disconnected', lastSyncAt: null },
  { id: 'hibob', name: 'HiBob', category: 'hrm', authType: 'service-token', apiAvailable: true, status: 'disconnected', lastSyncAt: null },
  { id: 'leapsome', name: 'Leapsome', category: 'hrm', authType: 'apikey', apiAvailable: true, status: 'disconnected', lastSyncAt: null },
  { id: 'peopleforce', name: 'PeopleForce', category: 'hrm', authType: 'apikey', apiAvailable: true, status: 'disconnected', lastSyncAt: null },
  { id: 'factorial', name: 'Factorial', category: 'hrm', authType: 'oauth2', apiAvailable: true, status: 'disconnected', lastSyncAt: null },
]

const SOCIAL_CONNECTORS: Connector[] = [
  { id: 'googledrive', name: 'Google Drive / Docs', category: 'social', authType: 'oauth2', apiAvailable: true, status: 'disconnected', lastSyncAt: null },
  { id: 'linkedin', name: 'LinkedIn', category: 'social', authType: 'oauth2', apiAvailable: true, status: 'disconnected', lastSyncAt: null },
  { id: 'tiktok', name: 'TikTok', category: 'social', authType: 'oauth2', apiAvailable: true, status: 'disconnected', lastSyncAt: null },
  { id: 'douyin', name: 'Douyin (抖音)', category: 'social', authType: 'oauth2', apiAvailable: true, status: 'disconnected', lastSyncAt: null },
  { id: 'weibo', name: 'Weibo (微博)', category: 'social', authType: 'oauth2', apiAvailable: true, status: 'disconnected', lastSyncAt: null },
  { id: 'facebook', name: 'Facebook', category: 'social', authType: 'gdpr-export', apiAvailable: false, status: 'disconnected', lastSyncAt: null },
  { id: 'instagram', name: 'Instagram', category: 'social', authType: 'gdpr-export', apiAvailable: false, status: 'disconnected', lastSyncAt: null },
  { id: 'xiaohongshu', name: 'Xiaohongshu (小红书)', category: 'social', authType: 'gdpr-export', apiAvailable: false, status: 'disconnected', lastSyncAt: null },
]

const DEFAULT_CONNECTORS = [...HRM_CONNECTORS, ...SOCIAL_CONNECTORS]

interface DataHubState {
  connectors: Connector[]
  syncLog: SyncEvent[]
  connectConnector: (id: string) => void
  disconnectConnector: (id: string) => void
  importFile: (id: string, fileName: string) => void
}

export const useDataHubStore = create<DataHubState>((set, get) => ({
  connectors: DEFAULT_CONNECTORS,
  syncLog: [],

  connectConnector: (id) => {
    const connector = get().connectors.find(c => c.id === id)
    if (!connector) return
    set(state => ({
      connectors: state.connectors.map(c =>
        c.id === id ? { ...c, status: 'connected', lastSyncAt: new Date().toISOString() } : c
      ),
      syncLog: [
        {
          id: crypto.randomUUID(),
          connectorId: id,
          connectorName: connector.name,
          eventType: 'connect',
          status: 'success',
          timestamp: new Date().toISOString(),
        },
        ...state.syncLog,
      ],
    }))
  },

  disconnectConnector: (id) => {
    const connector = get().connectors.find(c => c.id === id)
    if (!connector) return
    set(state => ({
      connectors: state.connectors.map(c =>
        c.id === id ? { ...c, status: 'disconnected', lastSyncAt: null, errorMessage: undefined } : c
      ),
      syncLog: [
        {
          id: crypto.randomUUID(),
          connectorId: id,
          connectorName: connector.name,
          eventType: 'disconnect',
          status: 'success',
          timestamp: new Date().toISOString(),
        },
        ...state.syncLog,
      ],
    }))
  },

  importFile: (id, fileName) => {
    const connector = get().connectors.find(c => c.id === id)
    if (!connector) return
    set(state => ({
      connectors: state.connectors.map(c =>
        c.id === id ? { ...c, status: 'connected', lastSyncAt: new Date().toISOString() } : c
      ),
      syncLog: [
        {
          id: crypto.randomUUID(),
          connectorId: id,
          connectorName: connector.name,
          eventType: 'import',
          status: 'success',
          timestamp: new Date().toISOString(),
          detail: `Imported: ${fileName}`,
        },
        ...state.syncLog,
      ],
    }))
  },
}))
