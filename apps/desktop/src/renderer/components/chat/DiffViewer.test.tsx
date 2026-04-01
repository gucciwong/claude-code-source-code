import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiffViewer } from './DiffViewer'
import { useAgentStore } from '../../store/agentStore'

describe('DiffViewer', () => {
  beforeEach(() => {
    useAgentStore.setState({ fileChanges: [] })
  })

  it('renders nothing when no file changes', () => {
    const { container } = render(<DiffViewer />)
    expect(container.firstChild).toBeNull()
  })

  it('renders file changes header when changes exist', () => {
    useAgentStore.setState({
      fileChanges: [
        {
          id: 'change-1',
          file: 'src/main.ts',
          type: 'modify',
          diff: 'diff content',
          accepted: null,
        },
      ],
    })

    render(<DiffViewer />)
    expect(screen.getByText('File Changes')).toBeInTheDocument()
  })

  it('categorizes and displays pending changes', () => {
    useAgentStore.setState({
      fileChanges: [
        {
          id: 'change-1',
          file: 'src/app.ts',
          type: 'modify',
          diff: 'code change',
          accepted: null,
        },
      ],
    })

    render(<DiffViewer />)
    expect(screen.getByText(/Pending Review \(1\)/)).toBeInTheDocument()
    expect(screen.getByText('src/app.ts')).toBeInTheDocument()
  })

  it('displays create change type', () => {
    useAgentStore.setState({
      fileChanges: [
        {
          id: 'change-1',
          file: 'src/new.ts',
          type: 'create',
          diff: 'new content',
          accepted: null,
        },
      ],
    })

    render(<DiffViewer />)
    expect(screen.getByText('Create')).toBeInTheDocument()
  })

  it('displays modify change type', () => {
    useAgentStore.setState({
      fileChanges: [
        {
          id: 'change-1',
          file: 'src/main.ts',
          type: 'modify',
          diff: 'modified',
          accepted: null,
        },
      ],
    })

    render(<DiffViewer />)
    expect(screen.getByText('Modify')).toBeInTheDocument()
  })

  it('displays delete change type', () => {
    useAgentStore.setState({
      fileChanges: [
        {
          id: 'change-1',
          file: 'src/old.ts',
          type: 'delete',
          diff: 'deleted',
          accepted: null,
        },
      ],
    })

    render(<DiffViewer />)
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('displays accept and reject buttons for pending changes', () => {
    useAgentStore.setState({
      fileChanges: [
        {
          id: 'change-1',
          file: 'src/file.ts',
          type: 'modify',
          diff: 'code',
          accepted: null,
        },
      ],
    })

    render(<DiffViewer />)
    expect(screen.getByLabelText('Accept change')).toBeInTheDocument()
    expect(screen.getByLabelText('Reject change')).toBeInTheDocument()
  })

  it('accepts a file change', async () => {
    const user = userEvent.setup()
    useAgentStore.setState({
      fileChanges: [
        {
          id: 'change-1',
          file: 'src/test.ts',
          type: 'modify',
          diff: 'code',
          accepted: null,
        },
      ],
    })

    render(<DiffViewer />)

    const acceptButton = screen.getByLabelText('Accept change')
    await user.click(acceptButton)

    const state = useAgentStore.getState()
    expect(state.fileChanges[0].accepted).toBe(true)
    expect(screen.getByText('Accepted')).toBeInTheDocument()
  })

  it('rejects a file change', async () => {
    const user = userEvent.setup()
    useAgentStore.setState({
      fileChanges: [
        {
          id: 'change-1',
          file: 'src/test.ts',
          type: 'modify',
          diff: 'code',
          accepted: null,
        },
      ],
    })

    render(<DiffViewer />)

    const rejectButton = screen.getByLabelText('Reject change')
    await user.click(rejectButton)

    const state = useAgentStore.getState()
    expect(state.fileChanges[0].accepted).toBe(false)
    expect(screen.getByText('Rejected')).toBeInTheDocument()
  })

  it('displays diff content when expanded', async () => {
    const user = userEvent.setup()
    const diffContent = '- old line\n+ new line'
    useAgentStore.setState({
      fileChanges: [
        {
          id: 'change-1',
          file: 'src/file.ts',
          type: 'modify',
          diff: diffContent,
          accepted: null,
        },
      ],
    })

    render(<DiffViewer />)

    // Initially hidden
    expect(screen.queryByText(/old line/)).not.toBeInTheDocument()

    // Expand
    const viewButton = screen.getByLabelText('Show diff for src/file.ts')
    await user.click(viewButton)

    expect(screen.getByText(/old line/)).toBeInTheDocument()
    expect(screen.getByText(/new line/)).toBeInTheDocument()
  })

  it('hides diff content when collapsed', async () => {
    const user = userEvent.setup()
    const diffContent = '- removing\n+ adding'
    useAgentStore.setState({
      fileChanges: [
        {
          id: 'change-1',
          file: 'src/file.ts',
          type: 'modify',
          diff: diffContent,
          accepted: null,
        },
      ],
    })

    render(<DiffViewer />)

    const viewButton = screen.getByLabelText('Show diff for src/file.ts')

    // Expand
    await user.click(viewButton)
    expect(screen.getByText(/removing/)).toBeInTheDocument()

    // Collapse
    await user.click(viewButton)
    expect(screen.queryByText(/removing/)).not.toBeInTheDocument()
  })

  it('separates pending, accepted, and rejected changes', () => {
    useAgentStore.setState({
      fileChanges: [
        {
          id: 'change-1',
          file: 'a.ts',
          type: 'create',
          diff: 'a',
          accepted: null,
        },
        {
          id: 'change-2',
          file: 'b.ts',
          type: 'modify',
          diff: 'b',
          accepted: true,
        },
        {
          id: 'change-3',
          file: 'c.ts',
          type: 'delete',
          diff: 'c',
          accepted: false,
        },
      ],
    })

    render(<DiffViewer />)

    expect(screen.getByText(/Pending Review \(1\)/)).toBeInTheDocument()
    expect(screen.getByText(/Accepted \(1\)/)).toBeInTheDocument()
    expect(screen.getByText(/Rejected \(1\)/)).toBeInTheDocument()
  })

  it('shows only pending changes count when no accepted/rejected', () => {
    useAgentStore.setState({
      fileChanges: [
        {
          id: 'change-1',
          file: 'file.ts',
          type: 'modify',
          diff: 'diff',
          accepted: null,
        },
        {
          id: 'change-2',
          file: 'file2.ts',
          type: 'create',
          diff: 'diff2',
          accepted: null,
        },
      ],
    })

    render(<DiffViewer />)

    expect(screen.getByText(/Pending Review \(2\)/)).toBeInTheDocument()
    expect(screen.queryByText(/Accepted/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Rejected/)).not.toBeInTheDocument()
  })

  it('hides accept/reject buttons for already decided changes', () => {
    useAgentStore.setState({
      fileChanges: [
        {
          id: 'change-1',
          file: 'file.ts',
          type: 'modify',
          diff: 'diff',
          accepted: true,
        },
      ],
    })

    render(<DiffViewer />)

    expect(screen.queryByLabelText('Accept change')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Reject change')).not.toBeInTheDocument()
    expect(screen.getByText('Accepted')).toBeInTheDocument()
  })

  it('handles multiple file changes with mixed states', () => {
    useAgentStore.setState({
      fileChanges: [
        { id: '1', file: 'new.ts', type: 'create', diff: 'd1', accepted: null },
        { id: '2', file: 'existing.ts', type: 'modify', diff: 'd2', accepted: true },
        { id: '3', file: 'old.ts', type: 'delete', diff: 'd3', accepted: false },
        { id: '4', file: 'another.ts', type: 'modify', diff: 'd4', accepted: null },
      ],
    })

    render(<DiffViewer />)

    expect(screen.getByText(/Pending Review \(2\)/)).toBeInTheDocument()
    expect(screen.getByText(/Accepted \(1\)/)).toBeInTheDocument()
    expect(screen.getByText(/Rejected \(1\)/)).toBeInTheDocument()

    expect(screen.getByText('new.ts')).toBeInTheDocument()
    expect(screen.getByText('existing.ts')).toBeInTheDocument()
    expect(screen.getByText('old.ts')).toBeInTheDocument()
    expect(screen.getByText('another.ts')).toBeInTheDocument()
  })
})
