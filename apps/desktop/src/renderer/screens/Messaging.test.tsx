import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Messaging } from './Messaging'
import { useMessagingStore } from '../store/messagingStore'

vi.mock('../hooks/useMessaging', () => ({
  useMessaging: () => ({
    listPlatforms: vi.fn().mockResolvedValue([]),
    removePlatform: vi.fn(),
    configurePlatform: vi.fn(),
    fetchMessageLog: vi.fn().mockResolvedValue([]),
    checkHealth: vi.fn(),
  }),
}))

describe('Messaging screen', () => {
  beforeEach(() => {
    useMessagingStore.setState({
      platforms: [],
      messageLog: [],
      isLoading: false,
      error: null,
    })
  })

  it('renders heading "IM Bridge"', () => {
    render(<Messaging />)
    expect(screen.getByText('IM Bridge')).toBeInTheDocument()
  })

  it('renders Platforms tab trigger', () => {
    render(<Messaging />)
    expect(screen.getByRole('tab', { name: 'Platforms' })).toBeInTheDocument()
  })

  it('renders Message Log tab trigger', () => {
    render(<Messaging />)
    expect(screen.getByRole('tab', { name: 'Message Log' })).toBeInTheDocument()
  })

  it('renders Commands tab trigger', () => {
    render(<Messaging />)
    expect(screen.getByRole('tab', { name: 'Commands' })).toBeInTheDocument()
  })

  it('renders Setup Guide tab trigger', () => {
    render(<Messaging />)
    expect(screen.getByRole('tab', { name: 'Setup Guide' })).toBeInTheDocument()
  })

  it('renders "Add Platform" button', () => {
    render(<Messaging />)
    expect(screen.getByText('Add Platform')).toBeInTheDocument()
  })

  it('renders "Refresh" button', () => {
    render(<Messaging />)
    expect(screen.getByText('Refresh')).toBeInTheDocument()
  })
})
