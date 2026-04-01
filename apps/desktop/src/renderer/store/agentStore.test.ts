import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAgentStore } from '../store/agentStore'

describe('agentStore', () => {
  beforeEach(() => {
    useAgentStore.setState({
      agentMode: false,
      toolCalls: [],
      fileChanges: [],
      dryRun: false,
    })
  })

  describe('agentMode', () => {
    it('toggles agent mode', () => {
      const { getState, setState } = useAgentStore
      expect(getState().agentMode).toBe(false)

      setState({ agentMode: true })
      expect(getState().agentMode).toBe(true)

      setState({ agentMode: false })
      expect(getState().agentMode).toBe(false)
    })
  })

  describe('toolCalls', () => {
    it('adds tool calls with auto-generated id and timestamp', () => {
      const { getState } = useAgentStore
      const store = getState()

      store.addToolCall({
        name: 'readFile',
        status: 'executing',
        inputs: { path: '/src/main.ts' },
      })

      const state = getState()
      expect(state.toolCalls).toHaveLength(1)
      expect(state.toolCalls[0]).toMatchObject({
        name: 'readFile',
        status: 'executing',
        inputs: { path: '/src/main.ts' },
      })
      expect(state.toolCalls[0].id).toMatch(/^tool-\d+$/)
      expect(state.toolCalls[0].timestamp).toBeGreaterThan(0)
    })

    it('updates tool call status and output', () => {
      const { getState } = useAgentStore
      const store = getState()

      store.addToolCall({
        name: 'testTool',
        status: 'thinking',
        inputs: {},
      })

      const id = getState().toolCalls[0].id
      store.updateToolCall(id, {
        status: 'executing',
        output: 'result',
      })

      expect(getState().toolCalls[0]).toMatchObject({
        status: 'executing',
        output: 'result',
      })
    })

    it('updates tool call with error', () => {
      const { getState } = useAgentStore
      const store = getState()

      store.addToolCall({
        name: 'failTool',
        status: 'executing',
        inputs: {},
      })

      const id = getState().toolCalls[0].id
      store.updateToolCall(id, {
        status: 'error',
        error: 'File not found',
      })

      expect(getState().toolCalls[0]).toMatchObject({
        status: 'error',
        error: 'File not found',
      })
    })

    it('clears all tool calls', () => {
      const { getState } = useAgentStore
      const store = getState()

      store.addToolCall({ name: 'tool1', status: 'done', inputs: {} })
      store.addToolCall({ name: 'tool2', status: 'done', inputs: {} })

      expect(getState().toolCalls).toHaveLength(2)

      store.clearToolCalls()
      expect(getState().toolCalls).toHaveLength(0)
    })
  })

  describe('fileChanges', () => {
    it('adds file changes with auto-generated id', () => {
      const { getState } = useAgentStore
      const store = getState()

      store.addFileChange({
        file: 'src/main.ts',
        type: 'modify',
        diff: '- old\n+ new',
        accepted: null,
      })

      const state = getState()
      expect(state.fileChanges).toHaveLength(1)
      expect(state.fileChanges[0]).toMatchObject({
        file: 'src/main.ts',
        type: 'modify',
        diff: '- old\n+ new',
        accepted: null,
      })
      expect(state.fileChanges[0].id).toMatch(/^change-\d+$/)
    })

    it('accepts file change', () => {
      const { getState } = useAgentStore
      const store = getState()

      store.addFileChange({
        file: 'src/app.ts',
        type: 'create',
        diff: 'new file',
        accepted: null,
      })

      const id = getState().fileChanges[0].id
      store.updateFileChange(id, true)

      expect(getState().fileChanges[0].accepted).toBe(true)
    })

    it('rejects file change', () => {
      const { getState } = useAgentStore
      const store = getState()

      store.addFileChange({
        file: 'src/app.ts',
        type: 'delete',
        diff: 'delete this',
        accepted: null,
      })

      const id = getState().fileChanges[0].id
      store.updateFileChange(id, false)

      expect(getState().fileChanges[0].accepted).toBe(false)
    })

    it('clears all file changes', () => {
      const { getState } = useAgentStore
      const store = getState()

      store.addFileChange({ file: 'a.ts', type: 'create', diff: 'a', accepted: null })
      store.addFileChange({ file: 'b.ts', type: 'delete', diff: 'b', accepted: null })

      expect(getState().fileChanges).toHaveLength(2)

      store.clearFileChanges()
      expect(getState().fileChanges).toHaveLength(0)
    })
  })

  describe('dryRun', () => {
    it('toggles dry run mode', () => {
      const { getState, setState } = useAgentStore
      expect(getState().dryRun).toBe(false)

      setState({ dryRun: true })
      expect(getState().dryRun).toBe(true)

      setState({ dryRun: false })
      expect(getState().dryRun).toBe(false)
    })
  })
})
