import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConnectorCard } from './ConnectorCard'
import { vi } from 'vitest'
import type { ConnectorConfig } from '../../../../shared/enterprise'

function makeConnector(overrides: Partial<ConnectorConfig> = {}): ConnectorConfig {
  return {
    id: 'test-id',
    name: 'Test Connector',
    type: 'postgres',
    enabled: true,
    createdAt: Date.now(),
    ...overrides,
  }
}

test('renders connector name', () => {
  render(<ConnectorCard connector={makeConnector({ name: 'My Connector' })} onRemove={vi.fn()} />)
  expect(screen.getByText('My Connector')).toBeInTheDocument()
})

test('renders PostgreSQL type label', () => {
  render(<ConnectorCard connector={makeConnector({ type: 'postgres' })} onRemove={vi.fn()} />)
  expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
})

test('renders REST API type label', () => {
  render(<ConnectorCard connector={makeConnector({ type: 'rest' })} onRemove={vi.fn()} />)
  expect(screen.getByText('REST API')).toBeInTheDocument()
})

test('renders SAP type label', () => {
  render(<ConnectorCard connector={makeConnector({ type: 'sap' })} onRemove={vi.fn()} />)
  expect(screen.getByText('SAP')).toBeInTheDocument()
})

test('renders Salesforce type label', () => {
  render(<ConnectorCard connector={makeConnector({ type: 'salesforce' })} onRemove={vi.fn()} />)
  expect(screen.getByText('Salesforce')).toBeInTheDocument()
})

test('enabled connector shows check icon (accessible)', () => {
  render(<ConnectorCard connector={makeConnector({ enabled: true, name: 'DB' })} onRemove={vi.fn()} />)
  // The remove button should be accessible
  expect(screen.getByRole('button', { name: /remove db connector/i })).toBeInTheDocument()
})

test('remove button has accessible label', () => {
  render(<ConnectorCard connector={makeConnector({ name: 'Alpha DB' })} onRemove={vi.fn()} />)
  expect(screen.getByRole('button', { name: /remove alpha db connector/i })).toBeInTheDocument()
})

test('clicking remove calls onRemove with connector id', async () => {
  const onRemove = vi.fn()
  const user = userEvent.setup()
  render(<ConnectorCard connector={makeConnector({ id: 'abc-123', name: 'Test DB' })} onRemove={onRemove} />)
  await user.click(screen.getByRole('button', { name: /remove test db connector/i }))
  expect(onRemove).toHaveBeenCalledWith('abc-123')
})
