import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContributePatternDialog } from './ContributePatternDialog'

vi.mock('../../hooks/useOrgIntelligence', () => ({
  useOrgIntelligence: () => ({
    contributePattern: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('../../store/orgIntelligenceStore', () => ({
  useOrgIntelligenceStore: () => ({ isLoading: false }),
}))

describe('ContributePatternDialog', () => {
  it('renders the trigger button', () => {
    render(<ContributePatternDialog />)
    expect(screen.getByRole('button', { name: /Contribute Pattern/i })).toBeInTheDocument()
  })

  it('opens dialog on trigger click', async () => {
    render(<ContributePatternDialog />)
    await userEvent.click(screen.getByRole('button', { name: /Contribute Pattern/i }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Contribute Pattern' })).toBeInTheDocument()
  })

  it('renders language select and textarea when open', async () => {
    render(<ContributePatternDialog />)
    await userEvent.click(screen.getByRole('button', { name: /Contribute Pattern/i }))
    expect(screen.getByLabelText('Language')).toBeInTheDocument()
    expect(screen.getByLabelText('Pattern Code')).toBeInTheDocument()
  })

  it('submit button is disabled when textarea is empty', async () => {
    render(<ContributePatternDialog />)
    await userEvent.click(screen.getByRole('button', { name: /Contribute Pattern/i }))
    expect(screen.getByRole('button', { name: 'Contribute' })).toBeDisabled()
  })

  it('submit button enables when text is entered', async () => {
    render(<ContributePatternDialog />)
    await userEvent.click(screen.getByRole('button', { name: /Contribute Pattern/i }))
    await userEvent.type(screen.getByLabelText('Pattern Code'), 'const x = 1')
    expect(screen.getByRole('button', { name: 'Contribute' })).not.toBeDisabled()
  })
})
