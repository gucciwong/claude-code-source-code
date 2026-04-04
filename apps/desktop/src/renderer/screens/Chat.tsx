import { useState, useRef, useEffect } from 'react'
import { Send, Zap, ChevronDown } from 'lucide-react'
import { useChatStore, ChatMessage } from '../store/chatStore'
import { useSystemStore } from '../store/systemStore'
import { useAgentStore } from '../store/agentStore'
import { streamChat } from '../services/ollamaClient'
import { ToolTrace } from '../components/chat/ToolTrace'
import { DiffViewer } from '../components/chat/DiffViewer'
import { VoicePanel } from '../components/common/VoicePanel'
import { useVoiceStore } from '../store/voiceStore'
import { useTrainingService } from '../hooks/useTrainingService'
import { buildEnvelope } from '../services/telemetry'

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
  const [voicePanelExpanded, setVoicePanelExpanded] = useState(false)
  const { messages, addMessage, appendToLast, setLastStreaming, clear } = useChatStore()
  const activeModel = useSystemStore(s => s.activeModel)
  const { agentMode, setAgentMode, dryRun, setDryRun } = useAgentStore()
  const { isProcessing } = useVoiceStore()
  const { logCompletion: logTrainingCompletion, logInference, isServiceAvailable: isTrainingServiceAvailable } = useTrainingService()
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastUserPromptRef = useRef<string>('')

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
    lastUserPromptRef.current = text
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

    // §3.2 Inference instrumentation — shared correlation_id ties all 4 lifecycle events
    const correlationId = crypto.randomUUID()
    const inferenceStart = performance.now()
    let firstTokenTime: number | null = null
    let chunkCount = 0
    let totalChars = 0

    // ── inference_request_started ──────────────────────────────────
    void logInference({
      ...buildEnvelope('inference_request_started', model, 'ollama', 'local', correlationId),
    })

    try {
      for await (const chunk of streamChat(model, apiMessages)) {
        // ── inference_first_token_emitted (once) ──────────────────
        if (chunkCount === 0) {
          firstTokenTime = performance.now()
          const firstTokenLatencyMs = firstTokenTime - inferenceStart
          void logInference({
            ...buildEnvelope('inference_first_token_emitted', model, 'ollama', 'local', correlationId),
            first_token_latency_ms: Math.round(firstTokenLatencyMs),
          })

          // §3.2 completion_suggested: response has started rendering
          const lastMessage = useChatStore.getState().messages.at(-1)
          if (lastMessage && lastUserPromptRef.current && isTrainingServiceAvailable) {
            void logTrainingCompletion({
              ...buildEnvelope('completion_suggested', model, 'ollama', 'local', correlationId),
              prompt: lastUserPromptRef.current,
              completion: chunk,
              event_type: 'completion_suggested',
              language: 'text',
              completion_type: 'chat',
              accepted_boolean: undefined, // not yet known
            }).catch(() => { /* telemetry fire-and-forget */ })
          }
        }
        chunkCount++
        totalChars += chunk.length
        appendToLast(chunk)
      }

      // ── inference_request_completed ───────────────────────────────
      const totalMs = performance.now() - inferenceStart
      const estimatedTokens = Math.round(totalChars / 4) // ~4 chars/token
      const tokensPerSecond = totalMs > 0 ? (estimatedTokens / totalMs) * 1000 : 0
      void logInference({
        ...buildEnvelope('inference_request_completed', model, 'ollama', 'local', correlationId),
        completion_tokens: estimatedTokens,
        tokens_per_second: Math.round(tokensPerSecond * 10) / 10,
        first_token_latency_ms: firstTokenTime != null ? Math.round(firstTokenTime - inferenceStart) : undefined,
      })

      // §3.2 completion_accepted: streaming finished, user received the full response
      const lastMessage = useChatStore.getState().messages.at(-1)
      if (lastMessage && lastUserPromptRef.current && isTrainingServiceAvailable) {
        try {
          await logTrainingCompletion({
            ...buildEnvelope('completion_accepted', model, 'ollama', 'local', correlationId),
            prompt: lastUserPromptRef.current,
            completion: lastMessage.content,
            event_type: 'completion_accepted',
            language: 'text',
            completion_type: 'chat',
            suggestion_length_tokens: estimatedTokens,
            accepted_boolean: true,
          })
        } catch (err) {
          console.error('Failed to log training completion:', err)
        }
      }
    } catch (err) {
      // ── inference_request_failed ──────────────────────────────────
      void logInference({
        ...buildEnvelope('inference_request_failed', model, 'ollama', 'local', correlationId),
        error_message: err instanceof Error ? err.message : String(err),
      })
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
        <div className="flex items-center gap-3">
          {agentMode && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={e => setDryRun(e.target.checked)}
                aria-label="Dry run mode"
                className="cursor-pointer"
              />
              <span className="text-xs text-text-secondary">Dry run</span>
            </label>
          )}
          <button
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500 ${
              agentMode
                ? 'bg-accent-500 text-text-primary'
                : 'bg-bg-surface-2 text-text-secondary border border-border-default hover:bg-bg-surface-3'
            }`}
            onClick={() => setAgentMode(!agentMode)}
            aria-pressed={agentMode}
            aria-label="Toggle agent mode"
          >
            <Zap size={14} aria-hidden="true" />
            Agent
          </button>
          <button
            className="text-xs text-text-muted hover:text-text-secondary cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500 rounded px-2 py-1"
            onClick={clear}
            aria-label="Clear chat history"
          >
            Clear
          </button>
        </div>
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

      {/* Agent Mode UI */}
      {agentMode && (
        <>
          <ToolTrace />
          <DiffViewer />
        </>
      )}

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
            disabled={isStreaming || isProcessing}
          />
          <button
            className="bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-text-primary rounded-lg p-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSend}
            disabled={isStreaming || isProcessing || !input.trim()}
            aria-label="Send message"
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Voice Panel - Collapsible */}
      <div className="shrink-0 border-t border-border-default bg-bg-surface-1">
        <button
          className="w-full flex items-center justify-between px-6 py-3 hover:bg-bg-surface-2 transition-colors text-sm font-medium text-text-secondary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          onClick={() => setVoicePanelExpanded(!voicePanelExpanded)}
          aria-expanded={voicePanelExpanded}
          aria-label="Toggle voice panel"
        >
          <span>🎤 Voice Commands</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${voicePanelExpanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
        {voicePanelExpanded && (
          <div className="px-6 py-4 border-t border-border-subtle bg-bg-surface-2 max-h-96 overflow-y-auto">
            <VoicePanel />
          </div>
        )}
      </div>
    </div>
  )
}
