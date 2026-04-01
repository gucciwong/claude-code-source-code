import { create } from 'zustand'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

type ChatStore = {
  messages: ChatMessage[]
  addMessage: (msg: ChatMessage) => void
  appendToLast: (chunk: string) => void
  setLastStreaming: (streaming: boolean) => void
  clear: () => void
}

export const useChatStore = create<ChatStore>(set => ({
  messages: [],
  addMessage: msg => set(state => ({ messages: [...state.messages, msg] })),
  appendToLast: chunk =>
    set(state => {
      const messages = [...state.messages]
      const last = messages[messages.length - 1]
      if (!last) return state
      messages[messages.length - 1] = { ...last, content: last.content + chunk }
      return { messages }
    }),
  setLastStreaming: streaming =>
    set(state => {
      const messages = [...state.messages]
      const last = messages[messages.length - 1]
      if (!last) return state
      messages[messages.length - 1] = { ...last, streaming }
      return { messages }
    }),
  clear: () => set({ messages: [] }),
}))
