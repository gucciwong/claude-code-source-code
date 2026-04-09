import { useRef, useEffect, useState, KeyboardEvent } from 'react'
import { Bot, X, Send, Sparkles, FileCode2 } from 'lucide-react'
import { ThinkingAnimation } from '../chat/ThinkingAnimation'
import { useCodingStore } from '../../store/codingStore'
import { useSystemStore } from '../../store/systemStore'
import { streamChat } from '../../services/ollamaClient'
import { useModelManagerStore } from '../../store/modelManagerStore'
import { useModelsStore } from '../../store/modelsStore'
import { modelManagerAPI } from '../../services/modelManagerAPI'
import { formatModelSizeFromBytes } from '../../utils/modelSize'

const QUICK_PROMPTS = [
  { label: 'Explain', prompt: 'Explain what this code does in plain English.' },
  { label: 'Find bugs', prompt: 'Find any bugs or issues in this code.' },
  { label: 'Add tests', prompt: 'Write unit tests for this code.' },
  { label: 'Refactor', prompt: 'Suggest how to refactor this code for clarity.' },
]

export function AiCopilot() {
  const {
    isCopilotOpen, setCopilotOpen,
    copilotMessages, addCopilotMessage,
    copilotInput, setCopilotInput,
    openTabs, activeTabId,
  } = useCodingStore()

  const activeModel = useSystemStore(s => s.activeModel)
  const mmModels = useModelManagerStore(s => s.models)
  const ollamaModels = useModelsStore(s => s.installed)
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const activeModelMeta = mmModels.find(m => m.id === activeModel || m.name === activeModel)
    ?? ollamaModels.find(m => m.name === activeModel)
  const activeModelLabel = activeModel ? activeModel.split(':')[0] : 'No model'
  const activeModelSize = activeModelMeta && 'size_bytes' in activeModelMeta
    ? formatModelSizeFromBytes(activeModelMeta.size_bytes)
    : activeModelMeta && 'size' in activeModelMeta
      ? formatModelSizeFromBytes(activeModelMeta.size)
      : null
  const activeModelBadge = activeModelSize ? `${activeModelLabel} · ${activeModelSize}` : activeModelLabel

  useEffect(() => {
    const target = bottomRef.current
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }, [copilotMessages])

  const activeTab = openTabs.find(t => t.id === activeTabId)

  const sendMessage = async (userText: string) => {
    if (!userText.trim() || isStreaming) return

    const fileContext = activeTab
      ? `\nCurrently open file: ${activeTab.path}\n\`\`\`${activeTab.language}\n${activeTab.content}\n\`\`\``
      : ''

    const systemPrompt = `You are an expert AI coding assistant (Sovereign Copilot). Help the user with their code. Be concise, actionable, and accurate.${fileContext}`

    addCopilotMessage({ role: 'user', content: userText })
    setCopilotInput('')
    setIsStreaming(true)

    const assistantId = Date.now().toString()
    addCopilotMessage({ role: 'assistant', content: '', id: assistantId })

    try {
      const model = activeModel || 'llama3.1:8b'
      const mmModel = mmModels.find(m => m.id === model || m.name === model)
      const apiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...copilotMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: userText },
      ]

      let accumulated = ''
      const tokenSource: AsyncIterable<string> = mmModel
        ? modelManagerAPI.streamInference(`${systemPrompt}\n\nUser: ${userText}\nAssistant:`, { model_id: model })
        : streamChat(model, apiMessages)

      for await (const chunk of tokenSource) {
        accumulated += chunk
        // Update the last assistant message live
        useCodingStore.setState(state => ({
          copilotMessages: state.copilotMessages.map(m =>
            m.id === assistantId ? { ...m, content: accumulated } : m
          ),
        }))
      }
    } catch (err) {
      useCodingStore.setState(state => ({
        copilotMessages: state.copilotMessages.map(m =>
          m.id === assistantId
            ? { ...m, content: `Error: ${err instanceof Error ? err.message : 'could not reach the selected model.'}` }
            : m
        ),
      }))
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(copilotInput)
    }
  }

  if (!isCopilotOpen) return null

  return (
    <div className="flex flex-col h-full w-full border-l border-border-subtle bg-bg-surface-1">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-accent-400" aria-hidden="true" />
          <span className="text-[13px] font-semibold text-text-primary">AI Copilot</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-500/20 text-accent-400 font-medium">
            {activeModelBadge}
          </span>
        </div>
        <button
          onClick={() => setCopilotOpen(false)}
          aria-label="Close AI Copilot"
          className="p-1 rounded text-text-muted hover:text-text-secondary cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {/* File context indicator */}
      {activeTab && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-text-muted bg-bg-surface-2 border-b border-border-subtle flex-shrink-0">
          <FileCode2 size={11} aria-hidden="true" />
          <span className="truncate">Context: {activeTab.name}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-3">
        {copilotMessages.length === 0 && (
          <div className="text-center text-text-muted py-6">
            <Sparkles size={24} className="mx-auto mb-2 text-accent-400 opacity-50" aria-hidden="true" />
            <p className="text-[12px]">Ask anything about your code</p>
          </div>
        )}

        {copilotMessages.map((msg, i) => (
          <div key={msg.id ?? i} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={[
              'max-w-[90%] rounded-lg px-3 py-2 text-[13px]',
              msg.role === 'user'
                ? 'bg-accent-500/20 text-text-primary'
                : 'bg-bg-surface-2 text-text-primary border border-border-subtle',
            ].join(' ')}>
              {msg.content || (isStreaming && msg.role === 'assistant' && i === copilotMessages.length - 1 ? (
                <ThinkingAnimation />
              ) : null)}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {copilotMessages.length === 0 && activeTab && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
          {QUICK_PROMPTS.map(p => (
            <button
              key={p.label}
              onClick={() => sendMessage(p.prompt)}
              disabled={isStreaming}
              className="text-[11px] px-2 py-1 rounded-md bg-bg-surface-3 border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-elevated cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500 disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border-subtle p-2">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={copilotInput}
            onChange={e => setCopilotInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your code... (Enter to send)"
            aria-label="Copilot input"
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-bg-surface-2 border border-border-default rounded-md px-3 py-2 text-[13px] text-text-primary placeholder-text-muted outline-none resize-none focus:border-accent-500 transition-colors disabled:opacity-50"
            style={{ minHeight: '36px', maxHeight: '100px' }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 100) + 'px'
            }}
          />
          <button
            onClick={() => sendMessage(copilotInput)}
            disabled={!copilotInput.trim() || isStreaming}
            aria-label="Send message"
            className="flex-shrink-0 p-2 bg-accent-500 hover:bg-accent-400 active:bg-accent-600 rounded-md text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
