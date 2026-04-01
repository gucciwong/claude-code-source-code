import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToolTrace } from './ToolTrace'
import { useAgentStore } from '../../store/agentStore'

describe('ToolTrace', () => {
  beforeEach(() => {
    useAgentStore.setState({ toolCalls: [] })
  })

  it('renders nothing when no tool calls', () => {
    const { container } = render(<ToolTrace />)
    expect(container.firstChild).toBeNull()
  })

  it('renders tool calls header when calls exist', () => {
    useAgentStore.setState({
      toolCalls: [
        {
          id: 'tool-1',
          name: 'readFile',
          status: 'done',
          inputs: { path: '/src/main.ts' },
          output: 'file content',
          timestamp: Date.now(),
        },
      ],
    })

    render(<ToolTrace />)
    expect(screen.getByText('Tool Calls')).toBeInTheDocument()
  })

  it('displays thinking status with icon', () => {
    useAgentStore.setState({
      toolCalls: [
        {
          id: 'tool-1',
          name: 'analyzeCode',
          status: 'thinking',
          inputs: {},
          timestamp: Date.now(),
        },
      ],
    })

    render(<ToolTrace />)
    expect(screen.getByText('analyzeCode')).toBeInTheDocument()
    expect(screen.getByText('Thinking')).toBeInTheDocument()
  })

  it('displays executing status with spinner', () => {
    useAgentStore.setState({
      toolCalls: [
        {
          id: 'tool-1',
          name: 'executeCommand',
          status: 'executing',
          inputs: { cmd: 'npm test' },
          timestamp: Date.now(),
        },
      ],
    })

    render(<ToolTrace />)
    expect(screen.getByText('executeCommand')).toBeInTheDocument()
    expect(screen.getByText('Running')).toBeInTheDocument()
  })

  it('displays done status with checkmark', () => {
    useAgentStore.setState({
      toolCalls: [
        {
          id: 'tool-1',
          name: 'writeFile',
          status: 'done',
          inputs: { path: '/src/app.ts', content: 'code' },
          output: 'ok',
          timestamp: Date.now(),
        },
      ],
    })

    render(<ToolTrace />)
    expect(screen.getByText('writeFile')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('displays error status with alert icon', () => {
    useAgentStore.setState({
      toolCalls: [
        {
          id: 'tool-1',
          name: 'compileTSX',
          status: 'error',
          inputs: { file: 'Component.tsx' },
          error: 'Syntax error on line 15',
          timestamp: Date.now(),
        },
      ],
    })

    render(<ToolTrace />)
    expect(screen.getByText('compileTSX')).toBeInTheDocument()
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('expands tool call details on click', async () => {
    const user = userEvent.setup()
    useAgentStore.setState({
      toolCalls: [
        {
          id: 'tool-1',
          name: 'testTool',
          status: 'done',
          inputs: { param: 'value' },
          output: 'result data',
          timestamp: Date.now(),
        },
      ],
    })

    render(<ToolTrace />)

    // Initially, details should not be visible
    expect(screen.queryByText('Inputs:')).not.toBeInTheDocument()

    // Click to expand
    const button = screen.getByRole('button', { name: /Tool call: testTool/i })
    await user.click(button)

    // Details should now be visible
    expect(screen.getByText('Inputs:')).toBeInTheDocument()
    expect(screen.getByText('Output:')).toBeInTheDocument()
  })

  it('collapses tool call details when clicking again', async () => {
    const user = userEvent.setup()
    useAgentStore.setState({
      toolCalls: [
        {
          id: 'tool-1',
          name: 'tool',
          status: 'done',
          inputs: { x: 1 },
          output: 'ok',
          timestamp: Date.now(),
        },
      ],
    })

    render(<ToolTrace />)

    const button = screen.getByRole('button', { name: /Tool call: tool/i })

    // Expand
    await user.click(button)
    expect(screen.getByText('Inputs:')).toBeInTheDocument()

    // Collapse
    await user.click(button)
    expect(screen.queryByText('Inputs:')).not.toBeInTheDocument()
  })

  it('displays tool inputs as JSON', async () => {
    const user = userEvent.setup()
    useAgentStore.setState({
      toolCalls: [
        {
          id: 'tool-1',
          name: 'tool',
          status: 'done',
          inputs: { path: '/file.ts', lines: [1, 2, 3] },
          output: 'ok',
          timestamp: Date.now(),
        },
      ],
    })

    render(<ToolTrace />)

    const button = screen.getByRole('button', { name: /Tool call: tool/i })
    await user.click(button)

    expect(screen.getByText(/path/)).toBeInTheDocument()
    expect(screen.getByText(/file\.ts/)).toBeInTheDocument()
  })

  it('displays tool output when available', async () => {
    const user = userEvent.setup()
    useAgentStore.setState({
      toolCalls: [
        {
          id: 'tool-1',
          name: 'tool',
          status: 'done',
          inputs: {},
          output: 'Important result from tool',
          timestamp: Date.now(),
        },
      ],
    })

    render(<ToolTrace />)

    const button = screen.getByRole('button', { name: /Tool call: tool/i })
    await user.click(button)

    expect(screen.getByText('Output:')).toBeInTheDocument()
    expect(screen.getByText('Important result from tool')).toBeInTheDocument()
  })

  it('displays error message when tool fails', async () => {
    const user = userEvent.setup()
    useAgentStore.setState({
      toolCalls: [
        {
          id: 'tool-1',
          name: 'failTool',
          status: 'error',
          inputs: {},
          error: 'Connection timeout after 30s',
          timestamp: Date.now(),
        },
      ],
    })

    render(<ToolTrace />)

    const button = screen.getByRole('button', { name: /Tool call: failTool/i })
    await user.click(button)

    expect(screen.getByText('Error:')).toBeInTheDocument()
    expect(screen.getByText('Connection timeout after 30s')).toBeInTheDocument()
  })

  it('renders multiple tool calls', () => {
    useAgentStore.setState({
      toolCalls: [
        {
          id: 'tool-1',
          name: 'first',
          status: 'done',
          inputs: {},
          timestamp: Date.now(),
        },
        {
          id: 'tool-2',
          name: 'second',
          status: 'done',
          inputs: {},
          timestamp: Date.now(),
        },
        {
          id: 'tool-3',
          name: 'third',
          status: 'executing',
          inputs: {},
          timestamp: Date.now(),
        },
      ],
    })

    render(<ToolTrace />)
    expect(screen.getByText('first')).toBeInTheDocument()
    expect(screen.getByText('second')).toBeInTheDocument()
    expect(screen.getByText('third')).toBeInTheDocument()
  })
})
