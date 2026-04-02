import { describe, it, expect, beforeEach } from 'vitest'
import { useMessagingStore } from './messagingStore'
import type { PlatformStatus, MessageLogEntry } from '../../shared/messaging'

describe('messagingStore', () => {
  beforeEach(() => {
    useMessagingStore.setState({
      platforms: [],
      messageLog: [],
      isLoading: false,
      error: null,
    })
  })

  it('has correct initial state', () => {
    const state = useMessagingStore.getState()
    expect(state.platforms).toEqual([])
    expect(state.messageLog).toEqual([])
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('setPlatforms updates platforms array', () => {
    const platforms: PlatformStatus[] = [
      { platform: 'telegram', allowed_user_ids: [], enabled: true, connected: false },
    ]
    useMessagingStore.getState().setPlatforms(platforms)
    expect(useMessagingStore.getState().platforms).toHaveLength(1)
    expect(useMessagingStore.getState().platforms[0].platform).toBe('telegram')
  })

  it('addLogEntry prepends to messageLog', () => {
    const entry: MessageLogEntry = {
      timestamp: Date.now() / 1000,
      platform: 'slack',
      sender_id: 'user1',
      command: 'status',
      response: 'ok',
      authorized: true,
    }
    useMessagingStore.getState().addLogEntry(entry)
    expect(useMessagingStore.getState().messageLog[0].command).toBe('status')
  })

  it('addLogEntry clamps to 100 entries', () => {
    const store = useMessagingStore.getState()
    for (let i = 0; i < 105; i++) {
      store.addLogEntry({
        timestamp: i,
        platform: 'telegram',
        sender_id: 'user',
        command: `cmd${i}`,
        response: 'r',
        authorized: true,
      })
    }
    expect(useMessagingStore.getState().messageLog).toHaveLength(100)
  })

  it('setLoading updates isLoading', () => {
    useMessagingStore.getState().setLoading(true)
    expect(useMessagingStore.getState().isLoading).toBe(true)
    useMessagingStore.getState().setLoading(false)
    expect(useMessagingStore.getState().isLoading).toBe(false)
  })

  it('setError updates error', () => {
    useMessagingStore.getState().setError('Network error')
    expect(useMessagingStore.getState().error).toBe('Network error')
  })

  it('setError to null clears error', () => {
    useMessagingStore.getState().setError('some error')
    useMessagingStore.getState().setError(null)
    expect(useMessagingStore.getState().error).toBeNull()
  })
})
