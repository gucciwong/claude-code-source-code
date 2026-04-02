import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MirrorSelector } from './MirrorSelector'
import * as useModelManagerModule from '../../hooks/useModelManager'

describe('MirrorSelector', () => {
  const mockGetMirrorInfo = vi.fn()
  const mockGetSwitchMirrorInstructions = vi.fn()

  beforeEach(() => {
    vi.spyOn(useModelManagerModule, 'useModelManager').mockReturnValue({
      getMirrorInfo: mockGetMirrorInfo,
      getSwitchMirrorInstructions: mockGetSwitchMirrorInstructions,
      loading: false,
      error: null,
    } as any)
    mockGetMirrorInfo.mockResolvedValue({ current_mirror: 'huggingface' })
    mockGetSwitchMirrorInstructions.mockResolvedValue({ success: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('renders 3 mirror options', async () => {
    render(<MirrorSelector />)
    expect(screen.getByText('HuggingFace (Official)')).toBeInTheDocument()
    expect(screen.getByText('HF-Mirror (China)')).toBeInTheDocument()
    expect(screen.getByText('ModelScope')).toBeInTheDocument()
  })

  test('loads and selects current mirror on mount', async () => {
    render(<MirrorSelector />)
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /HuggingFace/i })).toBeChecked()
    })
  })

  test('calls switch API when selecting new mirror', async () => {
    render(<MirrorSelector />)
    fireEvent.click(screen.getByText('HF-Mirror (China)'))
    await waitFor(() => {
      expect(mockGetSwitchMirrorInstructions).toHaveBeenCalled()
    })
  })

  test('shows success feedback after switching', async () => {
    render(<MirrorSelector />)
    fireEvent.click(screen.getByText('HF-Mirror (China)'))
    await waitFor(() => {
      expect(screen.getByText(/Mirror updated/i)).toBeInTheDocument()
    })
  })

  test('shows error feedback when switch fails', async () => {
    mockGetSwitchMirrorInstructions.mockResolvedValue(null)
    render(<MirrorSelector />)
    fireEvent.click(screen.getByText('HF-Mirror (China)'))
    await waitFor(() => {
      expect(screen.getByText(/Failed to switch/i)).toBeInTheDocument()
    })
  })
})
