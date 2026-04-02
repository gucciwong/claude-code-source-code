export interface ConnectorConfig {
  id: string
  name: string
  type: 'postgres' | 'rest' | 'sap' | 'salesforce'
  connectionString?: string
  baseUrl?: string
  headers?: Record<string, string>
  allowedTables?: string[]
  enabled: boolean
  createdAt: number
}

export interface AuditEntry {
  id: number
  timestamp: string
  userId: string
  connectorId: string
  queryHash: string
  rowsReturned: number
  piiEntitiesMasked: number
  rowHash: string
}

export interface TraceEvent {
  line: number
  vars?: Record<string, unknown>
  call?: string
  duration_ms?: number
}

export interface DecisionNode {
  id: string
  type: 'ArchitectureDecision' | 'Refactor' | 'BugFix' | 'FeatureAdd' | 'DependencyChange'
  summary: string
  rationale: string
  timestamp: number
  commitHash: string
  author: string
  filesChanged: string[]
}

export interface SchemaTable {
  name: string
  columns: string[]
}

export interface QueryResult {
  rows: Record<string, unknown>[]
  masked_count: number
  duration_ms: number
}

export interface EnterpriseContextBlock {
  enterprise_context: string
}
