import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { useChatStore, ChatMessage } from '../store/chatStore'
import { useSystemStore } from '../store/systemStore'
import { streamChat } from '../services/ollamaClient'

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-3 text-sm ${
          isUser
            ? 'bg-accent-500 text-text-primary'
            : 'bg-bg-surface-2 border border-border-default text-text-primary'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.streaming && (
          <span className="inline-block w-2 h-4 bg-accent-400 animate-pulse ml-1 align-middle" aria-hidden="true" />
        )}
      </div>
    </div>
  )
}

export function Chat() {
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const { messages, addMessage, appendToLast, setLastStreaming, clear } = useChatStore()
  const activeModel = useSystemStore(s => s.activeModel)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || isStreaming) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    }
    addMessage(userMsg)
    setInput('')

    const assistantMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      streaming: true,
    }
    addMessage(assistantMsg)
    setIsStreaming(true)

    const model = activeModel || 'llama3.1:8b'
    const apiMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))

    try {
      for await (const chunk of streamChat(model, apiMessages)) {
        appendToLast(chunk)
      }
    } finally {
      setLastStreaming(false)
      setIsStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const modelName = activeModel || 'llama3.1:8b'

  return (
    <div data-testid="screen-chat" className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border-default bg-bg-surface-1 shrink-0">
        <h2 className="text-sm font-semibold text-text-primary">{modelName}</h2>
        <button
          className="text-xs text-text-muted hover:text-text-secondary cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500 rounded px-2 py-1"
          onClick={clear}
          aria-label="Clear chat history"
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && (
          <p className="text-center text-text-muted text-sm mt-8">
            Start a conversation with {modelName}
          </p>
        )}
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 px-6 py-4 border-t border-border-default bg-bg-surface-1">
        <div className="flex gap-3 items-end">
          <textarea
            className="flex-1 bg-bg-surface-2 border border-border-default text-text-primary text-sm rounded-lg px-4 py-3 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 placeholder:text-text-muted min-h-[44px] max-h-[160px]"
            placeholder="Message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            aria-label="Chat message input"
            disabled={isStreaming}
          />
          <button
            className="bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-text-primary rounded-lg p-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            aria-label="Send message"
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
