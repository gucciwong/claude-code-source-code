import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMessaging } from './useMessaging'
import { useMessagingStore } from '../store/messagingStore'

describe('useMessaging', () => {
  beforeEach(() => {
    useMessagingStore.setState({
      platforms: [],
      messageLog: [],
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('configurePlatform POSTs to /platforms/configure and returns true on 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    const { result } = renderHook(() => useMessaging())
    const success = await act(() =>
      result.current.configurePlatform({
        platform: 'telegram',
        allowed_user_ids: [],
        enabled: true,
      })
    )
    expect(success).toBe(true)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8012/platforms/configure',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('configurePlatform returns false when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const { result } = renderHook(() => useMessaging())
    const success = await act(() =>
      result.current.configurePlatform({
        platform: 'slack',
        allowed_user_ids: [],
        enabled: true,
      })
    )
    expect(success).toBe(false)
  })

  it('listPlatforms GETs /platforms and calls setPlatforms', async () => {
    const mockData = [{ platform: 'telegram', allowed_user_ids: [], enabled: true, bot_token: 'tok', connected: true }]
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockData) })
    )
    const { result } = renderHook(() => useMessaging())
    await act(() => result.current.listPlatforms())
    expect(useMessagingStore.getState().platforms).toHaveLength(1)
    expect(useMessagingStore.getState().platforms[0].platform).toBe('telegram')
    expect(fetch).toHaveBeenCalledWith('http://localhost:8012/platforms')
  })

  it('listPlatforms returns empty array when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')))
    const { result } = renderHook(() => useMessaging())
    const platforms = await act(() => result.current.listPlatforms())
    expect(platforms).toEqual([])
  })

  it('removePlatform DELETEs /platforms/{name} and returns true on 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    const { result } = renderHook(() => useMessaging())
    const success = await act(() => result.current.removePlatform('telegram'))
    expect(success).toBe(true)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8012/platforms/telegram',
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('removePlatform returns false on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')))
    const { result } = renderHook(() => useMessaging())
    const success = await act(() => result.current.removePlatform('telegram'))
    expect(success).toBe(false)
  })

  it('checkHealth returns true on 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    const { result } = renderHook(() => useMessaging())
    const healthy = await act(() => result.current.checkHealth())
    expect(healthy).toBe(true)
  })

  it('checkHealth returns false on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')))
    const { result } = renderHook(() => useMessaging())
    const healthy = await act(() => result.current.checkHealth())
    expect(healthy).toBe(false)
  })
})
