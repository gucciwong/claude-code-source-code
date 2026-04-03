import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlatformCard } from './PlatformCard'
import type { PlatformStatus } from '../../../shared/messaging'
import { IM_PLATFORM_LABELS } from '../../../shared/messaging'

const connected: PlatformStatus = {
  platform: 'slack',
  connected: true,
  bot_token: 'xoxb-secret',
  webhook_url: 'https://hooks.slack.com/test',
  allowed_user_ids: ['u1', 'u2'],
  enabled: true,
}

const disconnected: PlatformStatus = {
  platform: 'telegram',
  connected: false,
  allowed_user_ids: [],
  enabled: false,
}

describe('PlatformCard', () => {
  it('renders the platform label', () => {
    render(<PlatformCard platform={connected} onConfigure={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText(IM_PLATFORM_LABELS['slack'])).toBeInTheDocument()
  })

  it('shows Connected when connected', () => {
    render(<PlatformCard platform={connected} onConfigure={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText(/Connected/)).toBeInTheDocument()
  })

  it('shows Not configured when disconnected', () => {
    render(<PlatformCard platform={disconnected} onConfigure={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText('Not configured')).toBeInTheDocument()
  })

  it('shows authorized user count', () => {
    render(<PlatformCard platform={connected} onConfigure={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText(/2 authorized user\(s\)/)).toBeInTheDocument()
  })

  it('configure button has correct aria-label', () => {
    render(<PlatformCard platform={connected} onConfigure={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByRole('button', { name: `Configure ${IM_PLATFORM_LABELS['slack']}` })).toBeInTheDocument()
  })

  it('remove button has correct aria-label', () => {
    render(<PlatformCard platform={connected} onConfigure={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByRole('button', { name: `Remove ${IM_PLATFORM_LABELS['slack']}` })).toBeInTheDocument()
  })

  it('calls onConfigure with platform id', async () => {
    const user = userEvent.setup()
    const onConfigure = vi.fn()
    render(<PlatformCard platform={connected} onConfigure={onConfigure} onRemove={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: `Configure ${IM_PLATFORM_LABELS['slack']}` }))
    expect(onConfigure).toHaveBeenCalledWith('slack')
  })

  it('calls onRemove with platform id', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(<PlatformCard platform={connected} onConfigure={vi.fn()} onRemove={onRemove} />)
    await user.click(screen.getByRole('button', { name: `Remove ${IM_PLATFORM_LABELS['slack']}` }))
    expect(onRemove).toHaveBeenCalledWith('slack')
  })
})
