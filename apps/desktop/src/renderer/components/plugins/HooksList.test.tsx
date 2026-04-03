import { render, screen } from '@testing-library/react'
import { HooksList } from './HooksList'
import { BUILTIN_HOOKS } from '../../../shared/pluginSystem'

describe('HooksList', () => {
  it('renders the section heading', () => {
    render(<HooksList />)
    expect(screen.getByText('Available Hooks')).toBeInTheDocument()
  })

  it('renders all built-in hooks', () => {
    render(<HooksList />)
    for (const hook of BUILTIN_HOOKS) {
      expect(screen.getByText(hook)).toBeInTheDocument()
    }
  })

  it('renders each hook in a code element', () => {
    const { container } = render(<HooksList />)
    const codeEls = container.querySelectorAll('code')
    expect(codeEls.length).toBe(BUILTIN_HOOKS.length)
  })
})
