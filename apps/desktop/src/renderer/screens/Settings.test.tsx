import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Settings } from './Settings'

describe('Settings Screen', () => {
  test('renders settings header', () => {
    render(<Settings />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Configure Sovereign Code preferences')).toBeInTheDocument()
  })

  test('displays three tabs: general, inference, privacy', () => {
    render(<Settings />)
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Inference')).toBeInTheDocument()
    expect(screen.getByText('Privacy')).toBeInTheDocument()
  })

  test('general tab shows display options by default', () => {
    render(<Settings />)
    expect(screen.getByText('Display')).toBeInTheDocument()
    expect(screen.getByText('Theme')).toBeInTheDocument()
    expect(screen.getByText('Font Size')).toBeInTheDocument()
  })

  test('general tab shows editor integration section', () => {
    render(<Settings />)
    expect(screen.getByText('Editor Integration')).toBeInTheDocument()
    expect(screen.getByText('Tab to accept completions')).toBeInTheDocument()
    expect(screen.getByText('Show ghost text suggestions')).toBeInTheDocument()
  })

  test('general tab shows notifications section', () => {
    render(<Settings />)
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Training complete')).toBeInTheDocument()
    expect(screen.getByText('Federation sync')).toBeInTheDocument()
  })

  test('clicking inference tab shows inference settings', async () => {
    const user = userEvent.setup()
    render(<Settings />)

    const inferenceTab = screen.getByRole('button', { name: 'Inference' })
    await user.click(inferenceTab)

    expect(screen.getByText('Backend Configuration')).toBeInTheDocument()
    expect(screen.getByText('Ollama Host')).toBeInTheDocument()
    expect(screen.getByText('Inference Parameters')).toBeInTheDocument()
  })

  test('clicking privacy tab shows privacy settings', async () => {
    const user = userEvent.setup()
    render(<Settings />)

    const privacyTab = screen.getByRole('button', { name: 'Privacy' })
    await user.click(privacyTab)

    expect(screen.getByText('Privacy Guarantees')).toBeInTheDocument()
    expect(screen.getByText('Data Storage')).toBeInTheDocument()
  })

  test('privacy tab mentions local inference', async () => {
    const user = userEvent.setup()
    render(<Settings />)

    const privacyTab = screen.getByRole('button', { name: 'Privacy' })
    await user.click(privacyTab)

    expect(screen.getByText(/All inference is local/)).toBeInTheDocument()
  })

  test('has test id', () => {
    render(<Settings />)
    expect(screen.getByTestId('screen-settings')).toBeInTheDocument()
  })

  test('general tab shows UI template section', () => {
    render(<Settings />)
    expect(screen.getByText('UI Template')).toBeInTheDocument()
    expect(screen.getByTestId('theme-card-sentry')).toBeInTheDocument()
    expect(screen.getByTestId('theme-card-sanity')).toBeInTheDocument()
    expect(screen.getByTestId('theme-card-mistral')).toBeInTheDocument()
    expect(screen.getByTestId('theme-card-replicate')).toBeInTheDocument()
  })

  test('mistral theme is selected by default', () => {
    render(<Settings />)
    expect(screen.getByTestId('theme-card-mistral')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('theme-card-sentry')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('theme-card-sanity')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('theme-card-replicate')).toHaveAttribute('aria-pressed', 'false')
  })

  test('clicking sanity card selects it', async () => {
    const user = userEvent.setup()
    render(<Settings />)

    await user.click(screen.getByTestId('theme-card-sanity'))

    expect(screen.getByTestId('theme-card-sanity')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('theme-card-sentry')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('theme-card-mistral')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('theme-card-replicate')).toHaveAttribute('aria-pressed', 'false')
  })

  test('clicking replicate card selects it', async () => {
    const user = userEvent.setup()
    render(<Settings />)

    await user.click(screen.getByTestId('theme-card-replicate'))

    expect(screen.getByTestId('theme-card-replicate')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('theme-card-sentry')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('theme-card-sanity')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('theme-card-mistral')).toHaveAttribute('aria-pressed', 'false')
  })
})
