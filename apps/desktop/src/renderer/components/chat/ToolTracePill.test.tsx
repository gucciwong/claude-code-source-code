import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ToolTracePill } from './ToolTracePill'
import type { ToolCall } from '../../store/agentStore'

function mkCall(over: Partial<ToolCall> = {}): ToolCall {
  return {
    id: 'tc-1',
    name: 'read_file',
    status: 'done',
    inputs: { path: '/src/main.ts' },
    output: '',
    timestamp: 0,
    ...over,
  }
}

describe('ToolTracePill', () => {
  it('renders nothing when calls is empty', () => {
    const { container } = render(<ToolTracePill calls={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders collapsed summary "Used N tools" with names joined by · separator', () => {
    render(
      <ToolTracePill
        calls={[
          mkCall({ id: 'a', name: 'grep' }),
          mkCall({ id: 'b', name: 'read_file' }),
          mkCall({ id: 'c', name: 'write_file' }),
        ]}
      />
    )
    expect(screen.getByText(/Used 3 tools:/)).toBeInTheDocument()
    expect(screen.getByText(/grep · read_file · write_file/)).toBeInTheDocument()
  })

  it('renders singular "tool" when count is 1', () => {
    render(<ToolTracePill calls={[mkCall()]} />)
    expect(screen.getByText(/Used 1 tool:/)).toBeInTheDocument()
  })

  it('shows elapsed duration suffix when elapsedMs is provided', () => {
    render(<ToolTracePill calls={[mkCall()]} elapsedMs={1234} />)
    expect(screen.getByText(/\(1\.2s\)/)).toBeInTheDocument()
  })

  it('formats sub-second elapsed as ms', () => {
    render(<ToolTracePill calls={[mkCall()]} elapsedMs={420} />)
    expect(screen.getByText(/\(420ms\)/)).toBeInTheDocument()
  })

  it('omits elapsed suffix when not provided', () => {
    render(<ToolTracePill calls={[mkCall()]} />)
    expect(screen.queryByText(/\(\d/)).toBeNull()
  })

  it('expands on click and shows per-tool rows with args preview', async () => {
    render(
      <ToolTracePill
        calls={[
          mkCall({ id: 'a', name: 'grep', inputs: { pattern: 'foo', glob: '*.ts' } }),
          mkCall({ id: 'b', name: 'read_file', inputs: { path: '/x.ts' } }),
        ]}
      />
    )
    const trigger = screen.getByRole('button')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    // Both tool rows visible
    expect(screen.getByText('grep')).toBeInTheDocument()
    expect(screen.getByText('read_file')).toBeInTheDocument()

    // Args preview shows first arg + "+N" indicator
    expect(screen.getByText(/pattern: "foo", \+1/)).toBeInTheDocument()
    // Single-arg call shows just the arg, no +N
    expect(screen.getByText(/path: "\/x\.ts"/)).toBeInTheDocument()
  })

  it('caps "+N" summary when more than 4 tool names', () => {
    const calls = Array.from({ length: 6 }, (_, i) =>
      mkCall({ id: `t${i}`, name: `tool${i}` })
    )
    render(<ToolTracePill calls={calls} />)
    // 4 names shown, +2 indicator for the remaining
    expect(screen.getByText(/tool0 · tool1 · tool2 · tool3 \+2/)).toBeInTheDocument()
  })

  it('uses red tone when any call has error status', () => {
    const { container } = render(
      <ToolTracePill
        calls={[mkCall({ id: 'a', name: 'grep', status: 'error' })]}
      />
    )
    const btn = container.querySelector('button')!
    expect(btn.className).toMatch(/text-red-400/)
  })

  it('uses accent tone when any call is still running', () => {
    const { container } = render(
      <ToolTracePill
        calls={[mkCall({ id: 'a', name: 'grep', status: 'executing' })]}
      />
    )
    const btn = container.querySelector('button')!
    expect(btn.className).toMatch(/text-accent-400/)
  })

  it('uses muted secondary tone when all calls are done', () => {
    const { container } = render(
      <ToolTracePill
        calls={[mkCall({ id: 'a', name: 'grep', status: 'done' })]}
      />
    )
    const btn = container.querySelector('button')!
    expect(btn.className).toMatch(/text-text-secondary/)
  })

  it('truncates long string arg previews to 32 chars + ellipsis', () => {
    const longVal = 'a'.repeat(50)
    render(
      <ToolTracePill
        calls={[mkCall({ inputs: { pattern: longVal } })]}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    // 32 chars + "…" suffix appears inside the preview line
    expect(screen.getByText(/pattern: "a{32}…"/)).toBeInTheDocument()
  })
})
