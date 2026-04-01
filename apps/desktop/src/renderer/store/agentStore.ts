import { create } from 'zustand'

export interface ToolCall {
  id: string
  name: string
  status: 'thinking' | 'executing' | 'done' | 'error'
  inputs: Record<string, unknown>
  output?: string
  error?: string
  timestamp: number
}

export interface FileChange {
  id: string
  file: string
  type: 'create' | 'modify' | 'delete'
  diff: string
  accepted: boolean | null // null = pending, true = accepted, false = rejected
}

interface AgentStore {
  agentMode: boolean
  setAgentMode: (enabled: boolean) => void
  
  toolCalls: ToolCall[]
  addToolCall: (call: Omit<ToolCall, 'id' | 'timestamp'>) => void
  updateToolCall: (id: string, updates: Partial<ToolCall>) => void
  clearToolCalls: () => void
  
  fileChanges: FileChange[]
  addFileChange: (change: Omit<FileChange, 'id'>) => void
  updateFileChange: (id: string, accepted: boolean) => void
  clearFileChanges: () => void
  
  dryRun: boolean
  setDryRun: (enabled: boolean) => void
}

export const useAgentStore = create<AgentStore>((set) => ({
  agentMode: false,
  setAgentMode: (enabled) => set({ agentMode: enabled }),
  
  toolCalls: [],
  addToolCall: (call) => set((state) => ({
    toolCalls: [...state.toolCalls, {
      ...call,
      id: `tool-${Date.now()}`,
      timestamp: Date.now(),
    }],
  })),
  updateToolCall: (id, updates) => set((state) => ({
    toolCalls: state.toolCalls.map(tc => tc.id === id ? { ...tc, ...updates } : tc),
  })),
  clearToolCalls: () => set({ toolCalls: [] }),
  
  fileChanges: [],
  addFileChange: (change) => set((state) => ({
    fileChanges: [...state.fileChanges, {
      ...change,
      id: `change-${Date.now()}`,
    }],
  })),
  updateFileChange: (id, accepted) => set((state) => ({
    fileChanges: state.fileChanges.map(fc => fc.id === id ? { ...fc, accepted } : fc),
  })),
  clearFileChanges: () => set({ fileChanges: [] }),
  
  dryRun: false,
  setDryRun: (enabled) => set({ dryRun: enabled }),
}))
