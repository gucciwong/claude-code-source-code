import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Enterprise } from './Enterprise'
import { useEnterpriseStore } from '../store/enterpriseStore'
import { vi } from 'vitest'

vi.mock('../hooks/useEnterpriseData', () => ({
  useEnterpriseData: () => ({
    isLoading: false,
    error: null,
    registerConnector: vi.fn(),
    listConnectors: vi.fn().mockResolvedValue([]),
    removeConnector: vi.fn(),
    queryConnector: vi.fn(),
    getSchema: vi.fn(),
    buildContext: vi.fn(),
    checkHealth: vi.fn().mockResolvedValue(true),
  }),
}))

const baseStore = {
  connectors: [],
  auditLog: [],
  auditChainValid: null,
  setConnectors: vi.fn(),
  addConnector: vi.fn(),
  removeConnector: vi.fn(),
  setAuditLog: vi.fn(),
  setAuditChainValid: vi.fn(),
  clearConnectors: vi.fn(),
}

beforeEach(() => {
  useEnterpriseStore.setState({ ...baseStore })
})

test('renders Enterprise heading', () => {
  render(<Enterprise />)
  expect(screen.getByRole('heading', { name: /enterprise data/i })).toBeInTheDocument()
})

test('renders three tabs: Connectors, Audit Log, PII Rules', () => {
  render(<Enterprise />)
  expect(screen.getByRole('tab', { name: /connectors/i })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /audit log/i })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /pii rules/i })).toBeInTheDocument()
})

test('Connectors tab is active by default', () => {
  render(<Enterprise />)
  expect(screen.getByRole('tab', { name: /connectors/i })).toHaveAttribute('data-state', 'active')
})

test('clicking Audit Log tab shows audit content', async () => {
  const user = userEvent.setup()
  render(<Enterprise />)
  await user.click(screen.getByRole('tab', { name: /audit log/i }))
  expect(screen.getByText(/no audit entries yet/i)).toBeInTheDocument()
})

test('clicking PII Rules tab shows PII content', async () => {
  const user = userEvent.setup()
  render(<Enterprise />)
  await user.click(screen.getByRole('tab', { name: /pii rules/i }))
  expect(screen.getByText(/all data from enterprise connectors/i)).toBeInTheDocument()
})

test('ConnectorList renders empty state when no connectors', () => {
  render(<Enterprise />)
  expect(screen.getByText(/no connectors registered yet/i)).toBeInTheDocument()
})

test('ConnectorList renders connector count when connectors exist', () => {
  useEnterpriseStore.setState({
    connectors: [
      { id: 'c1', name: 'Prod DB', type: 'postgres', enabled: true, createdAt: Date.now() },
      { id: 'c2', name: 'Sales API', type: 'rest', enabled: true, createdAt: Date.now() },
    ],
  })
  render(<Enterprise />)
  expect(screen.getByText(/2 connectors/i)).toBeInTheDocument()
})

test('ConnectorCard displays connector name', () => {
  useEnterpriseStore.setState({
    connectors: [
      { id: 'c1', name: 'My Database', type: 'postgres', enabled: true, createdAt: Date.now() },
    ],
  })
  render(<Enterprise />)
  expect(screen.getByText('My Database')).toBeInTheDocument()
})

test('ConnectorCard displays type label for postgres', () => {
  useEnterpriseStore.setState({
    connectors: [
      { id: 'c1', name: 'My Database', type: 'postgres', enabled: true, createdAt: Date.now() },
    ],
  })
  render(<Enterprise />)
  expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
})

test('PIIMaskingRules shows all 6 rule categories', async () => {
  const user = userEvent.setup()
  render(<Enterprise />)
  await user.click(screen.getByRole('tab', { name: /pii rules/i }))
  expect(screen.getByText('EMAIL_ADDRESS')).toBeInTheDocument()
  expect(screen.getByText('PHONE_NUMBER')).toBeInTheDocument()
  expect(screen.getByText('US_SSN')).toBeInTheDocument()
  expect(screen.getByText('CREDIT_CARD')).toBeInTheDocument()
  expect(screen.getByText('IP_ADDRESS')).toBeInTheDocument()
  expect(screen.getByText('PERSON')).toBeInTheDocument()
})

test('AuditLogTable shows empty message when no entries', async () => {
  const user = userEvent.setup()
  render(<Enterprise />)
  await user.click(screen.getByRole('tab', { name: /audit log/i }))
  expect(screen.getByText(/no audit entries yet/i)).toBeInTheDocument()
})

test('AuditLogTable renders entries from store', async () => {
  useEnterpriseStore.setState({
    auditLog: [
      {
        id: 1,
        timestamp: new Date('2026-04-02T10:00:00Z').toISOString(),
        userId: 'user-1',
        connectorId: 'abcdef12345678',
        queryHash: 'hash1',
        rowsReturned: 42,
        piiEntitiesMasked: 3,
        rowHash: 'rowhash1',
      },
    ],
    auditChainValid: true,
  })
  const user = userEvent.setup()
  render(<Enterprise />)
  await user.click(screen.getByRole('tab', { name: /audit log/i }))
  expect(screen.getByText('42')).toBeInTheDocument()
  expect(screen.getByText('3')).toBeInTheDocument()
  expect(screen.getByText('abcdef12')).toBeInTheDocument()
})
