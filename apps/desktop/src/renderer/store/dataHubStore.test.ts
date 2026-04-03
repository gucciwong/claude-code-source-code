import { describe, it, expect, beforeEach } from 'vitest'
import { useDataHubStore } from './dataHubStore'

beforeEach(() => {
  useDataHubStore.setState({
    connectors: useDataHubStore.getState().connectors.map(c => ({
      ...c,
      status: 'disconnected' as const,
      lastSyncAt: null,
      errorMessage: undefined,
    })),
    syncLog: [],
  })
})

describe('dataHubStore', () => {
  it('initialises with 12 HRM connectors', () => {
    const hrm = useDataHubStore.getState().connectors.filter(c => c.category === 'hrm')
    expect(hrm).toHaveLength(12)
  })

  it('initialises with 8 social connectors', () => {
    const social = useDataHubStore.getState().connectors.filter(c => c.category === 'social')
    expect(social).toHaveLength(8)
  })

  it('all connectors start as disconnected', () => {
    const allDisconnected = useDataHubStore.getState().connectors.every(c => c.status === 'disconnected')
    expect(allDisconnected).toBe(true)
  })

  it('connectConnector sets status to connected', () => {
    useDataHubStore.getState().connectConnector('bamboohr')
    const c = useDataHubStore.getState().connectors.find(c => c.id === 'bamboohr')
    expect(c?.status).toBe('connected')
  })

  it('connectConnector sets lastSyncAt', () => {
    useDataHubStore.getState().connectConnector('bamboohr')
    const c = useDataHubStore.getState().connectors.find(c => c.id === 'bamboohr')
    expect(c?.lastSyncAt).not.toBeNull()
  })

  it('connectConnector appends a sync event', () => {
    useDataHubStore.getState().connectConnector('bamboohr')
    const log = useDataHubStore.getState().syncLog
    expect(log).toHaveLength(1)
    expect(log[0].eventType).toBe('connect')
    expect(log[0].status).toBe('success')
    expect(log[0].connectorId).toBe('bamboohr')
  })

  it('disconnectConnector resets status to disconnected', () => {
    useDataHubStore.getState().connectConnector('bamboohr')
    useDataHubStore.getState().disconnectConnector('bamboohr')
    const c = useDataHubStore.getState().connectors.find(c => c.id === 'bamboohr')
    expect(c?.status).toBe('disconnected')
  })

  it('disconnectConnector appends a disconnect event', () => {
    useDataHubStore.getState().connectConnector('bamboohr')
    useDataHubStore.getState().disconnectConnector('bamboohr')
    const log = useDataHubStore.getState().syncLog
    expect(log[0].eventType).toBe('disconnect')
  })

  it('importFile sets status to connected', () => {
    useDataHubStore.getState().importFile('facebook', 'facebook-export.zip')
    const c = useDataHubStore.getState().connectors.find(c => c.id === 'facebook')
    expect(c?.status).toBe('connected')
  })

  it('importFile appends import event with file detail', () => {
    useDataHubStore.getState().importFile('facebook', 'facebook-export.zip')
    const log = useDataHubStore.getState().syncLog
    expect(log[0].eventType).toBe('import')
    expect(log[0].detail).toContain('facebook-export.zip')
  })

  it('export-only connectors have apiAvailable false', () => {
    const limited = useDataHubStore.getState().connectors.filter(
      c => ['facebook', 'instagram', 'xiaohongshu'].includes(c.id)
    )
    expect(limited.every(c => !c.apiAvailable)).toBe(true)
  })
})
