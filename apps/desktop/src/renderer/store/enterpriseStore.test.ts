import { useEnterpriseStore } from './enterpriseStore'
import type { AuditEntry, ConnectorConfig } from '../../../shared/enterprise'

const makeConnector = (id: string): ConnectorConfig => ({
  id,
  name: `Connector ${id}`,
  type: 'postgres',
  enabled: true,
  createdAt: 1000,
})

const makeAuditEntry = (id: number): AuditEntry => ({
  id,
  timestamp: '2026-04-02T00:00:00Z',
  userId: 'user1',
  connectorId: 'conn1',
  queryHash: 'abc',
  rowsReturned: 5,
  piiEntitiesMasked: 2,
  rowHash: 'deadbeef',
})

beforeEach(() => {
  useEnterpriseStore.setState({
    connectors: [],
    auditLog: [],
    auditChainValid: null,
  })
})

test('initial state has empty connectors', () => {
  const { connectors } = useEnterpriseStore.getState()
  expect(connectors).toEqual([])
})

test('auditChainValid initial is null', () => {
  const { auditChainValid } = useEnterpriseStore.getState()
  expect(auditChainValid).toBeNull()
})

test('setConnectors replaces connectors list', () => {
  const list = [makeConnector('a'), makeConnector('b')]
  useEnterpriseStore.getState().setConnectors(list)
  expect(useEnterpriseStore.getState().connectors).toHaveLength(2)
  expect(useEnterpriseStore.getState().connectors[0].id).toBe('a')
})

test('addConnector appends to list', () => {
  useEnterpriseStore.getState().addConnector(makeConnector('x'))
  useEnterpriseStore.getState().addConnector(makeConnector('y'))
  const { connectors } = useEnterpriseStore.getState()
  expect(connectors).toHaveLength(2)
  expect(connectors[1].id).toBe('y')
})

test('removeConnector filters by id', () => {
  useEnterpriseStore.getState().setConnectors([makeConnector('a'), makeConnector('b'), makeConnector('c')])
  useEnterpriseStore.getState().removeConnector('b')
  const { connectors } = useEnterpriseStore.getState()
  expect(connectors).toHaveLength(2)
  expect(connectors.find(c => c.id === 'b')).toBeUndefined()
})

test('setAuditLog updates auditLog', () => {
  const entries = [makeAuditEntry(1), makeAuditEntry(2)]
  useEnterpriseStore.getState().setAuditLog(entries)
  expect(useEnterpriseStore.getState().auditLog).toHaveLength(2)
  expect(useEnterpriseStore.getState().auditLog[0].id).toBe(1)
})

test('setAuditChainValid updates flag', () => {
  useEnterpriseStore.getState().setAuditChainValid(true)
  expect(useEnterpriseStore.getState().auditChainValid).toBe(true)

  useEnterpriseStore.getState().setAuditChainValid(false)
  expect(useEnterpriseStore.getState().auditChainValid).toBe(false)
})

test('clearConnectors empties the list', () => {
  useEnterpriseStore.getState().setConnectors([makeConnector('a'), makeConnector('b')])
  expect(useEnterpriseStore.getState().connectors).toHaveLength(2)
  useEnterpriseStore.getState().clearConnectors()
  expect(useEnterpriseStore.getState().connectors).toHaveLength(0)
})
