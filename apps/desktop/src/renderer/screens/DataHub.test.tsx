import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { DataHub } from './DataHub'
import { useDataHubStore } from '../store/dataHubStore'

beforeEach(() => {
  useDataHubStore.setState({
    connectors: useDataHubStore.getState().connectors.map(c => ({
      ...c,
      status: 'disconnected' as const,
      lastSyncAt: null,
    })),
    syncLog: [],
  })
})

describe('DataHub screen', () => {
  it('renders the screen testid', () => {
    render(<DataHub />)
    expect(screen.getByTestId('screen-datahub')).toBeInTheDocument()
  })

  it('shows Data Hub heading', () => {
    render(<DataHub />)
    expect(screen.getByText('Data Hub')).toBeInTheDocument()
  })

  it('shows HRM Systems tab', () => {
    render(<DataHub />)
    expect(screen.getByText('HRM Systems')).toBeInTheDocument()
  })

  it('shows Personal Data tab', () => {
    render(<DataHub />)
    expect(screen.getByText('Personal Data')).toBeInTheDocument()
  })

  it('shows Sync Log tab', () => {
    render(<DataHub />)
    expect(screen.getByText('Sync Log')).toBeInTheDocument()
  })

  it('renders all 12 HRM connector names in HRM tab (default)', () => {
    render(<DataHub />)
    const hrmNames = [
      'Microsoft Active Directory',
      'Workday',
      'SAP SuccessFactors',
      'BambooHR',
      'Rippling',
      'Personio',
      'Deel',
      'Zoho People',
      'HiBob',
      'Leapsome',
      'PeopleForce',
      'Factorial',
    ]
    for (const name of hrmNames) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })
})
