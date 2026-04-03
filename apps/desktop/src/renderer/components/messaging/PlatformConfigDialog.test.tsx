import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlatformConfigDialog } from './PlatformConfigDialog'
import { IM_PLATFORM_LABELS } from '../../../shared/messaging'

vi.mock('../../hooks/useMessaging', () => ({
  useMessaging: () => ({
    configurePlatform: vi.fn().mockResolvedValue(true),
  }),
}))

describe('PlatformConfigDialog', () => {
  it('renders the platform name in the dialog title', () => {
    render(
      <PlatformConfigDialog
        open={true}
        platform="slack"
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    )
    expect(screen.getByText(`Configure ${IM_PLATFORM_LABELS['slack']}`)).toBeInTheDocument()
  })

  it('renders bot token input', () => {
    render(
      <PlatformConfigDialog
        open={true}
        platform="slack"
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/bot token/i)).toBeInTheDocument()
  })

  it('renders webhook url input', () => {
    render(
      <PlatformConfigDialog
        open={true}
        platform="slack"
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/webhook url/i)).toBeInTheDocument()
  })

  it('renders allowed user ids input', () => {
    render(
      <PlatformConfigDialog
        open={true}
        platform="slack"
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/authorized user ids/i)).toBeInTheDocument()
  })

  it('calls onClose when Cancel button clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <PlatformConfigDialog
        open={true}
        platform="slack"
        onClose={onClose}
        onSaved={vi.fn()}
      />
    )
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('renders null when platform is null', () => {
    const { container } = render(
      <PlatformConfigDialog
        open={false}
        platform={null}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })
})
