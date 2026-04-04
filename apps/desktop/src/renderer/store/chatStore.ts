import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

type ChatStore = {
  messages: ChatMessage[]
  knowledgeContext: string
  addMessage: (msg: ChatMessage) => void
  appendToLast: (chunk: string) => void
  setLastStreaming: (streaming: boolean) => void
  setKnowledgeContext: (ctx: string) => void
  clear: () => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    set => ({
  messages: [],
  knowledgeContext: '',
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
  setKnowledgeContext: ctx => set({ knowledgeContext: ctx }),
  clear: () => set({ messages: [] }),
    }),
    {
      name: 'sovereign-chat-history',
      partialize: (state) => ({
        messages: state.messages.filter(m => !m.streaming),
      }),
    },
  ),
)
