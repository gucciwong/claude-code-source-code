/**
 * Tests for the W3 (UI redesign) 4-phase Onboarding screen.
 *
 * Focused on the phase machinery + stepper visibility — the model-pick
 * sub-machine is covered by onboardingStore.test.ts. We mock the
 * useModelManager hook so the model phase doesn't try to hit
 * model-manager during render.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Onboarding } from './Onboarding'
import { useOnboardingStore, _resetOnboardingStoreForTests } from '../store/onboardingStore'
import { useCodingStore } from '../store/codingStore'
import { useAgentStore } from '../store/agentStore'

// Stub the model-manager hook — the model phase reaches for it on mount.
vi.mock('../hooks/useModelManager', () => ({
  useModelManager: () => ({ downloadModel: vi.fn().mockResolvedValue(true) }),
}))

beforeEach(() => {
  _resetOnboardingStoreForTests()
  useCodingStore.setState({ workspaceRoot: '~/projects' })
  useAgentStore.setState({ agentMode: false, dryRun: true, toolCalls: [] })
  // Stub clipboard for federation phase.
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  })
})

afterEach(() => {
  _resetOnboardingStoreForTests()
  vi.restoreAllMocks()
})

describe('Onboarding stepper', () => {
  it('renders all 4 phase labels', () => {
    render(<Onboarding />)
    expect(screen.getByText('Pick a model')).toBeInTheDocument()
    expect(screen.getByText('Import workspace')).toBeInTheDocument()
    expect(screen.getByText('Enable agent')).toBeInTheDocument()
    expect(screen.getByText('Invite a peer')).toBeInTheDocument()
  })

  it('highlights the active phase via aria-current', () => {
    useOnboardingStore.setState({ phase: 'workspace' })
    render(<Onboarding />)
    const activeStep = screen.getByText('2').closest('[aria-current]')
    expect(activeStep).toHaveAttribute('aria-current', 'step')
  })
})

describe('Workspace phase', () => {
  it('uses the current workspaceRoot as the default input', () => {
    useOnboardingStore.setState({ phase: 'workspace' })
    useCodingStore.setState({ workspaceRoot: '~/code/sov' })
    render(<Onboarding />)
    const input = screen.getByLabelText(/Workspace root path/i) as HTMLInputElement
    expect(input.value).toBe('~/code/sov')
  })

  it('"Use this path" writes the trimmed path to codingStore + advances phase', () => {
    useOnboardingStore.setState({ phase: 'workspace' })
    render(<Onboarding />)
    const input = screen.getByLabelText(/Workspace root path/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '  ~/work/new-repo  ' } })
    fireEvent.click(screen.getByText('Use this path'))
    expect(useCodingStore.getState().workspaceRoot).toBe('~/work/new-repo')
    expect(useOnboardingStore.getState().phase).toBe('agent')
  })

  it('"Skip for now" advances without writing to codingStore', () => {
    useOnboardingStore.setState({ phase: 'workspace' })
    useCodingStore.setState({ workspaceRoot: '~/keep-me' })
    render(<Onboarding />)
    fireEvent.click(screen.getByText('Skip for now'))
    expect(useCodingStore.getState().workspaceRoot).toBe('~/keep-me')
    expect(useOnboardingStore.getState().phase).toBe('agent')
  })
})

describe('Agent phase', () => {
  it('shows both toggles with current store state', () => {
    useOnboardingStore.setState({ phase: 'agent' })
    useAgentStore.setState({ agentMode: true, dryRun: true, toolCalls: [] })
    render(<Onboarding />)
    const agentToggle = screen.getByLabelText('Agent mode') as HTMLInputElement
    const dryRunToggle = screen.getByLabelText('Dry run') as HTMLInputElement
    expect(agentToggle.checked).toBe(true)
    expect(dryRunToggle.checked).toBe(true)
  })

  it('flipping the agent toggle writes through to agentStore', () => {
    useOnboardingStore.setState({ phase: 'agent' })
    render(<Onboarding />)
    fireEvent.click(screen.getByLabelText('Agent mode'))
    expect(useAgentStore.getState().agentMode).toBe(true)
  })

  it('disables Dry run when agent mode is off', () => {
    useOnboardingStore.setState({ phase: 'agent' })
    useAgentStore.setState({ agentMode: false, dryRun: true, toolCalls: [] })
    render(<Onboarding />)
    const dryRunToggle = screen.getByLabelText('Dry run') as HTMLInputElement
    expect(dryRunToggle.disabled).toBe(true)
  })

  it('Continue advances to federation phase', () => {
    useOnboardingStore.setState({ phase: 'agent' })
    render(<Onboarding />)
    fireEvent.click(screen.getByText('Continue'))
    expect(useOnboardingStore.getState().phase).toBe('federation')
  })
})

describe('Federation phase', () => {
  it('shows a NODE-XXXX-XXXX style identifier', () => {
    useOnboardingStore.setState({ phase: 'federation' })
    render(<Onboarding />)
    expect(screen.getByText(/^NODE-[0-9A-F]{1,4}-[0-9A-F]{1,4}$/)).toBeInTheDocument()
  })

  it('Copy button writes the node id to the clipboard', () => {
    useOnboardingStore.setState({ phase: 'federation' })
    render(<Onboarding />)
    fireEvent.click(screen.getByLabelText('Copy node id'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringMatching(/^NODE-[0-9A-F]{1,4}-[0-9A-F]{1,4}$/),
    )
  })

  it('"Finish setup" completes onboarding', () => {
    useOnboardingStore.setState({ phase: 'federation' })
    render(<Onboarding />)
    fireEvent.click(screen.getByText('Finish setup'))
    const s = useOnboardingStore.getState()
    expect(s.phase).toBe('complete')
    expect(s.hasCompleted).toBe(true)
  })

  it('"Skip — I\'m solo" also completes onboarding', () => {
    useOnboardingStore.setState({ phase: 'federation' })
    render(<Onboarding />)
    fireEvent.click(screen.getByText(/Skip — I.m solo/))
    expect(useOnboardingStore.getState().hasCompleted).toBe(true)
  })
})
