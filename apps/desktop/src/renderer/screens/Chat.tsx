import { useState, useRef, useEffect } from 'react'
import { Send, Square, Zap, ChevronDown, Settings2 } from 'lucide-react'
import { useChatStore, ChatMessage } from '../store/chatStore'
import { useSystemStore } from '../store/systemStore'
import { useAgentStore } from '../store/agentStore'
import { streamChat } from '../services/ollamaClient'
import { ToolTrace } from '../components/chat/ToolTrace'
import { ToolTracePill } from '../components/chat/ToolTracePill'
import { DiffViewer } from '../components/chat/DiffViewer'
import { VoicePanel } from '../components/common/VoicePanel'
import { ThinkingAnimation } from '../components/chat/ThinkingAnimation'
import { useVoiceStore } from '../store/voiceStore'
import { useTrainingService } from '../hooks/useTrainingService'
import { buildEnvelope } from '../services/telemetry'
import { ModelParameters } from '../components/chat/ModelParameters'
import { useModelParamsStore } from '../store/modelParamsStore'
import { useModelManagerStore } from '../store/modelManagerStore'
import { modelManagerAPI } from '../services/modelManagerAPI'
import { useModelsStore } from '../store/modelsStore'
import { formatModelSizeFromBytes } from '../utils/modelSize'
import { useRouterStore } from '../store/routerStore'
import { feedback as sendRouterFeedback } from '../services/routerClient'

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const isThinking = message.streaming && !message.content

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-3 text-sm ${
          isUser
            ? 'bg-accent-500 text-text-primary'
            : 'bg-bg-surface-2 border border-border-default text-text-primary'
        }`}
      >
        {isThinking ? (
          <ThinkingAnimation />
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
        {message.streaming && message.content && (
          <span className="inline-block w-2 h-4 bg-accent-400 animate-pulse ml-1 align-middle" aria-hidden="true" />
        )}
        {!message.streaming && message.role === 'assistant' && message.tokensPerSec != null && (
          <p className="text-[10px] text-text-muted/60 mt-1 select-none">{message.tokensPerSec} tok/s</p>
        )}
      </div>
    </div>
  )
}

export function Chat() {
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [voicePanelExpanded, setVoicePanelExpanded] = useState(false)
  const { messages, addMessage, appendToLast, setLastStreaming, setLastTokPerSec, clear } = useChatStore()
  const activeModel = useSystemStore(s => s.activeModel)
  const { agentMode, setAgentMode, dryRun, setDryRun, toolCalls } = useAgentStore()
  const { isProcessing } = useVoiceStore()
  const { logCompletion: logTrainingCompletion, logInference, isServiceAvailable: isTrainingServiceAvailable } = useTrainingService()
  const availableModels = useModelManagerStore(s => s.models)
  const ollamaModels = useModelsStore(s => s.installed)
  // W5-T15: CAMR Auto mode. When `routerMode === 'auto'`, each send first
  // asks the router which model to use for this prompt, then proceeds.
  const routerMode = useRouterStore(s => s.mode)
  const setRouterMode = useRouterStore(s => s.setMode)
  const routerLastChoice = useRouterStore(s => s.lastChoice)
  const decideRouter = useRouterStore(s => s.decide)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastUserPromptRef = useRef<string>('')
  const abortControllerRef = useRef<AbortController | null>(null)
  const isStreamingRef = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || isStreamingRef.current) return
    isStreamingRef.current = true

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }
    addMessage(userMsg)
    lastUserPromptRef.current = text
    setInput('')

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      streaming: true,
    }
    addMessage(assistantMsg)
    setIsStreaming(true)

    const controller = new AbortController()
    abortControllerRef.current = controller

    // W5-T15: in Auto mode, ask CAMR which model to use for this prompt.
    // The list of candidate ids is whatever the user currently has cached
    // (model-manager + Ollama installations). VRAM is the system reported.
    let chosenModel: string | null = activeModel || null
    if (routerMode === 'auto') {
      const candidateIds = [
        ...availableModels.map(m => m.id),
        ...ollamaModels.map(m => m.name),
      ]
      const vramTotal = useSystemStore.getState().vramTotal ?? undefined
      const lastAssistant = [...useChatStore.getState().messages]
        .reverse()
        .find(m => m.role === 'assistant')
      const decided = await decideRouter({
        prompt: text,
        context: lastAssistant?.content ?? '',
        available_models: candidateIds.length > 0 ? candidateIds : undefined,
        available_vram_gb: vramTotal,
      })
      if (decided) chosenModel = decided
    }
    const model = chosenModel || 'llama3.1:8b'
    const mmModel = availableModels.find(m => m.id === model || m.name === model)
    const runtimeBackend = mmModel ? 'model-manager' : 'ollama'
    // Build apiMessages fresh from store state at send time to avoid stale closure
    const currentMessages = useChatStore.getState().messages
    const apiMessages = [...currentMessages, userMsg].map(m => ({ role: m.role, content: m.content }))

    // Route inference: model-manager GGUF models use the standalone llama.cpp endpoint;
    // everything else goes through Ollama's OpenAI-compatible API.
    const tokenSource: AsyncIterable<string> = mmModel
      ? (() => {
          const prompt = [...currentMessages, userMsg]
            .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
            .join('\n') + '\nAssistant:'
          return modelManagerAPI.streamInference(prompt, { model_id: model, signal: controller.signal })
        })()
      : streamChat(model, apiMessages, controller.signal)

    // §3.2 Inference instrumentation — shared correlation_id ties all 4 lifecycle events
    const correlationId = crypto.randomUUID()
    const inferenceStart = performance.now()
    let firstTokenTime: number | null = null
    let chunkCount = 0
    let totalChars = 0

    // ── inference_request_started ──────────────────────────────────
    void logInference({
      ...buildEnvelope('inference_request_started', model, runtimeBackend, 'local', correlationId),
    })

    try {
      for await (const chunk of tokenSource) {
        // ── inference_first_token_emitted (once) ──────────────────
        if (chunkCount === 0) {
          firstTokenTime = performance.now()
          const firstTokenLatencyMs = firstTokenTime - inferenceStart
          void logInference({
            ...buildEnvelope('inference_first_token_emitted', model, runtimeBackend, 'local', correlationId),
            first_token_latency_ms: Math.round(firstTokenLatencyMs),
          })

          // §3.2 completion_suggested: response has started rendering
          const lastMessage = useChatStore.getState().messages.at(-1)
          if (lastMessage && lastUserPromptRef.current && isTrainingServiceAvailable) {
            const p = logTrainingCompletion({
              ...buildEnvelope('completion_suggested', model, 'ollama', 'local', correlationId),
              runtime_backend: runtimeBackend,
              prompt: lastUserPromptRef.current,
              completion: chunk,
              event_type: 'completion_suggested',
              language: 'text',
              completion_type: 'chat',
              accepted_boolean: undefined, // not yet known
            })
            p.catch((err) => { console.warn('Telemetry completion_suggested failed:', err) })
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
      const tpsRounded = Math.round(tokensPerSecond * 10) / 10
      if (tpsRounded > 0) setLastTokPerSec(tpsRounded)
      void logInference({
        ...buildEnvelope('inference_request_completed', model, runtimeBackend, 'local', correlationId),
        completion_tokens: estimatedTokens,
        tokens_per_second: tpsRounded,
        first_token_latency_ms: firstTokenTime != null ? Math.round(firstTokenTime - inferenceStart) : undefined,
      })

      // §3.2 completion_accepted: streaming finished, user received the full response
      const lastMessage = useChatStore.getState().messages.at(-1)
      if (lastMessage && lastUserPromptRef.current && isTrainingServiceAvailable) {
        try {
          await logTrainingCompletion({
            ...buildEnvelope('completion_accepted', model, runtimeBackend, 'local', correlationId),
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

      // W5-T15: feed acceptance + latency back to CAMR so the router learns.
      // Fire-and-forget; never block the chat UX on this.
      if (routerLastChoice && routerLastChoice.model_id === model) {
        void sendRouterFeedback({
          model_id: model,
          task_type: routerLastChoice.task_type,
          accepted: true,
          latency_ms: Math.round(totalMs),
        })
      }
    } catch (err) {
      // User-initiated abort is not a failure — skip telemetry
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        // ── inference_request_failed ──────────────────────────────────
        void logInference({
          ...buildEnvelope('inference_request_failed', model, runtimeBackend, 'local', correlationId),
          error_message: err instanceof Error ? err.message : String(err),
        })
        appendToLast(`\n\n⚠️ ${err instanceof Error ? err.message : 'Stream failed. Please try again.'}`)
      }
    } finally {
      isStreamingRef.current = false
      abortControllerRef.current = null
      setLastStreaming(false)
      setIsStreaming(false)
    }
  }

  function handleStop() {
    abortControllerRef.current?.abort()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const modelName = activeModel || 'llama3.1:8b'
  const toggleParamsSidebar = useModelParamsStore(s => s.toggleParamsSidebar)
  const paramsSidebarOpen = useModelParamsStore(s => s.paramsSidebarOpen)

  return (
    <div data-testid="screen-chat" className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border-default bg-bg-surface-1 shrink-0">
        <div className="flex items-center gap-2">
          {/* W5-T15: Model Picker with CAMR Auto mode.
              The sentinel value `__auto__` toggles the router store; any
              real model id selects that model and reverts to manual mode. */}
          <select
            value={routerMode === 'auto' ? '__auto__' : activeModel || ''}
            onChange={e => {
              const next = e.target.value
              if (next === '__auto__') {
                setRouterMode('auto')
              } else if (next) {
                setRouterMode('manual')
                useSystemStore.setState({ activeModel: next })
              }
            }}
            className="bg-bg-surface-2 border border-border-default rounded px-2 py-1 text-sm font-semibold text-text-primary cursor-pointer max-w-[200px]"
            aria-label="Select model"
          >
            <option value="__auto__">Auto (CAMR — pick best model)</option>
            {!activeModel && ollamaModels.length === 0 && availableModels.length === 0 && (
              <option value="">No model loaded</option>
            )}
            {ollamaModels.map(m => (
              <option key={`ollama:${m.name}`} value={m.name}>{`${m.name} (${formatModelSizeFromBytes(m.size) ?? 'Unknown size'}, Ollama)`}</option>
            ))}
            {availableModels.map(m => (
              <option key={m.id} value={m.id}>{`${m.name}${formatModelSizeFromBytes(m.size_bytes) ? ` (${formatModelSizeFromBytes(m.size_bytes)})` : ''}`}</option>
            ))}
            {activeModel && !ollamaModels.find(m => m.name === activeModel) && !availableModels.find(m => m.id === activeModel) && (
              <option value={activeModel}>{activeModel}</option>
            )}
          </select>
          {routerMode === 'auto' && routerLastChoice && (
            <span
              className="text-[11px] text-text-muted/80 truncate max-w-[260px]"
              title={routerLastChoice.reason}
              data-testid="camr-reason"
            >
              {routerLastChoice.model_id} · {routerLastChoice.reason}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleParamsSidebar}
            className={`p-1.5 rounded transition cursor-pointer ${paramsSidebarOpen ? 'bg-accent-500/20 text-accent-400' : 'hover:bg-bg-surface-2 text-text-muted'}`}
            title="Toggle model parameters"
            aria-label="Toggle model parameters sidebar"
            aria-pressed={paramsSidebarOpen}
          >
            <Settings2 size={16} />
          </button>
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
        {/* Stitch-distilled inline tool-trace pill — surfaces the
         *  current/just-finished tool sequence right where the
         *  assistant's next reply will appear. Only renders when
         *  agent mode is on AND there are toolCalls to summarize.
         *  See ToolTracePill.tsx for visual spec. */}
        {agentMode && <ToolTracePill calls={toolCalls} />}
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
            className="flex-1 bg-bg-surface-2 border border-border-default text-text-primary text-sm rounded-lg px-4 py-3 resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 placeholder:text-text-muted min-h-[44px] max-h-[300px]"
            placeholder="Message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            aria-label="Chat message input"
            disabled={isStreaming || isProcessing}
          />
          {isStreaming ? (
            <button
              className="bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-lg p-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              onClick={handleStop}
              aria-label="Stop generating"
            >
              <Square size={16} aria-hidden="true" />
            </button>
          ) : (
            <button
              className="text-text-primary rounded-[13px] p-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed transition-shadow hover:shadow-[rgba(0,0,0,0.18)_0px_0.5rem_1.5rem]"
              style={{ backgroundColor: '#79628c', border: '1px solid #584674', boxShadow: 'rgba(0,0,0,0.1) 0px 1px 3px 0px inset' }}
              onClick={handleSend}
              disabled={isProcessing || !input.trim()}
              aria-label="Send message"
            >
              <Send size={16} aria-hidden="true" />
            </button>
          )}
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
      {/* Model Parameters Sidebar */}
      <ModelParameters />
    </div>
  )
}
