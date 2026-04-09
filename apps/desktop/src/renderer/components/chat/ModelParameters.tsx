import { useState } from 'react'
import {
  Settings2,
  X,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  HelpCircle,
} from 'lucide-react'
import {
  useModelParamsStore,
  INFERENCE_PRESETS,
  InferenceParams,
} from '../../store/modelParamsStore'
import { useModelManagerStore } from '../../store/modelManagerStore'

/* ------------------------------------------------------------------ */
/*  Compact building blocks for the sidebar                           */
/* ------------------------------------------------------------------ */

function ParamSlider({
  label,
  paramKey,
  min,
  max,
  step = 0.01,
  tooltip,
}: {
  label: string
  paramKey: keyof InferenceParams
  min: number
  max: number
  step?: number
  tooltip?: string
}) {
  const value = useModelParamsStore(s => s.inferenceParams[paramKey]) as number
  const setParam = useModelParamsStore(s => s.setInferenceParam)
  return (
    <div className="space-y-1 py-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xs text-text-secondary font-medium">{label}</span>
          {tooltip && (
            <span title={tooltip} className="text-text-muted cursor-help">
              <HelpCircle size={11} />
            </span>
          )}
        </div>
        <input
          type="number"
          value={typeof value === 'number' ? value : 0}
          min={min}
          max={max}
          step={step}
          onChange={e => {
            const n = Number(e.target.value)
            if (!isNaN(n)) setParam(paramKey, Math.min(max, Math.max(min, n)) as never)
          }}
          className="w-16 text-right bg-bg-surface-2 border border-border-default rounded px-1.5 py-0.5 text-xs text-text-primary"
          aria-label={`${label} value`}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={typeof value === 'number' ? value : 0}
        onChange={e => setParam(paramKey, Number(e.target.value) as never)}
        className="w-full accent-accent-500 cursor-pointer h-1"
        aria-label={label}
      />
    </div>
  )
}

function ParamToggle({
  label,
  paramKey,
  tooltip,
}: {
  label: string
  paramKey: keyof InferenceParams
  tooltip?: string
}) {
  const value = useModelParamsStore(s => s.inferenceParams[paramKey]) as boolean
  const setParam = useModelParamsStore(s => s.setInferenceParam)
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-1">
        <span className="text-xs text-text-secondary font-medium">{label}</span>
        {tooltip && (
          <span title={tooltip} className="text-text-muted cursor-help">
            <HelpCircle size={11} />
          </span>
        )}
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => setParam(paramKey, !value as never)}
        className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${
          value ? 'bg-accent-500' : 'bg-bg-surface-3 border border-border-default'
        }`}
        aria-label={label}
      >
        <span
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
            value ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Collapsible Section                                               */
/* ------------------------------------------------------------------ */

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border-default">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider hover:text-text-primary transition cursor-pointer"
        aria-expanded={open}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {title}
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main sidebar                                                      */
/* ------------------------------------------------------------------ */

export function ModelParameters() {
  const {
    inferenceParams,
    activePreset,
    paramsSidebarOpen,
    setActivePreset,
    setInferenceParam,
    toggleParamsSidebar,
    resetInferenceParams,
  } = useModelParamsStore()
  const models = useModelManagerStore(s => s.models)

  if (!paramsSidebarOpen) return null

  return (
    <div className="w-80 shrink-0 border-l border-border-default bg-bg-surface-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default shrink-0">
        <div className="flex items-center gap-2">
          <Settings2 size={16} className="text-text-secondary" />
          <span className="text-sm font-semibold text-text-primary">Model Parameters</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={resetInferenceParams}
            title="Reset to defaults"
            className="p-1 hover:bg-bg-surface-2 rounded transition cursor-pointer"
            aria-label="Reset parameters"
          >
            <RotateCcw size={14} className="text-text-muted" />
          </button>
          <button
            onClick={toggleParamsSidebar}
            className="p-1 hover:bg-bg-surface-2 rounded transition cursor-pointer"
            aria-label="Close parameters sidebar"
          >
            <X size={14} className="text-text-muted" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {/* Presets */}
        <div className="py-2 border-b border-border-default">
          <label className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-1.5 block">
            Preset
          </label>
          <select
            value={activePreset || ''}
            onChange={e => setActivePreset(e.target.value || null)}
            className="w-full bg-bg-surface-2 border border-border-default rounded px-2 py-1.5 text-sm text-text-primary cursor-pointer"
            aria-label="Parameter preset"
          >
            <option value="">Custom</option>
            {Object.keys(INFERENCE_PRESETS).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* System Prompt */}
        <div className="py-2 border-b border-border-default">
          <label className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-1.5 block">
            System Prompt
          </label>
          <textarea
            value={inferenceParams.systemPrompt}
            onChange={e => setInferenceParam('systemPrompt', e.target.value)}
            placeholder="Enter system prompt…"
            rows={3}
            className="w-full bg-bg-surface-2 border border-border-default rounded px-2 py-1.5 text-xs text-text-primary resize-y placeholder:text-text-muted/50"
            aria-label="System prompt"
          />
        </div>

        {/* Core params */}
        <div className="py-1 border-b border-border-default">
          <ParamSlider
            label="Temperature"
            paramKey="temperature"
            min={0}
            max={2}
            step={0.05}
            tooltip="Higher = more creative. Lower = more focused."
          />

          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-1">
              <span className="text-xs text-text-secondary font-medium">Limit Response Length</span>
              <span title="Maximum tokens in response. 0 = unlimited." className="text-text-muted cursor-help">
                <HelpCircle size={11} />
              </span>
            </div>
            <input
              type="number"
              value={inferenceParams.maxTokens}
              min={0}
              max={65536}
              step={64}
              onChange={e => setInferenceParam('maxTokens', Math.max(0, Number(e.target.value) || 0))}
              className="w-20 text-right bg-bg-surface-2 border border-border-default rounded px-1.5 py-0.5 text-xs text-text-primary"
              aria-label="Max tokens"
            />
          </div>
          <div className="text-[10px] text-text-muted mb-1">
            {inferenceParams.maxTokens === 0 ? 'Unlimited' : `${inferenceParams.maxTokens} tokens`}
          </div>

          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-text-secondary font-medium">Context Overflow</span>
            <select
              value={inferenceParams.contextOverflow}
              onChange={e => setInferenceParam('contextOverflow', e.target.value as InferenceParams['contextOverflow'])}
              className="bg-bg-surface-2 border border-border-default rounded px-1.5 py-0.5 text-xs text-text-primary cursor-pointer"
              aria-label="Context overflow strategy"
            >
              <option value="truncate_middle">Truncate middle</option>
              <option value="truncate_start">Truncate start</option>
              <option value="stop">Stop generation</option>
            </select>
          </div>

          {/* Stop strings */}
          <div className="py-1.5">
            <span className="text-xs text-text-secondary font-medium">Stop Strings</span>
            <input
              type="text"
              value={inferenceParams.stopStrings.join(', ')}
              onChange={e =>
                setInferenceParam(
                  'stopStrings',
                  e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                )
              }
              placeholder="Comma-separated…"
              className="w-full mt-1 bg-bg-surface-2 border border-border-default rounded px-2 py-1 text-xs text-text-primary placeholder:text-text-muted/50"
              aria-label="Stop strings"
            />
          </div>

          <ParamSlider
            label="CPU Threads"
            paramKey="cpuThreads"
            min={1}
            max={32}
            step={1}
            tooltip="Number of CPU threads for inference."
          />
        </div>

        {/* Sampling */}
        <Section title="Sampling">
          <ParamSlider label="Top P" paramKey="topP" min={0} max={1} step={0.01} tooltip="Nucleus sampling probability mass." />
          <ParamSlider label="Top K" paramKey="topK" min={0} max={200} step={1} tooltip="Number of top tokens to consider." />
          <ParamSlider label="Min P" paramKey="minP" min={0} max={1} step={0.01} tooltip="Minimum probability threshold." />
          <ParamSlider label="Repeat Penalty" paramKey="repeatPenalty" min={0.5} max={2} step={0.05} tooltip="Penalize repeated tokens." />
          <ParamSlider label="Frequency Penalty" paramKey="frequencyPenalty" min={-2} max={2} step={0.05} tooltip="Decrease probability of frequent tokens." />
          <ParamSlider label="Presence Penalty" paramKey="presencePenalty" min={-2} max={2} step={0.05} tooltip="Increase topic diversity." />
        </Section>

        {/* Speculative Decoding */}
        <Section title="Speculative Decoding">
          <div className="py-1.5">
            <label className="text-xs text-text-secondary font-medium block mb-1">Draft Model</label>
            <select
              value={inferenceParams.draftModelId}
              onChange={e => setInferenceParam('draftModelId', e.target.value)}
              className="w-full bg-bg-surface-2 border border-border-default rounded px-2 py-1.5 text-xs text-text-primary cursor-pointer"
              aria-label="Draft model"
            >
              <option value="">None</option>
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <ParamSlider
            label="Probability Threshold"
            paramKey="draftProbabilityThreshold"
            min={0}
            max={1}
            step={0.05}
            tooltip="Minimum probability for accepting draft tokens."
          />
          <ParamSlider
            label="Min Draft Length"
            paramKey="minDraftLength"
            min={0}
            max={64}
            step={1}
          />
          <ParamSlider
            label="Max Draft Length"
            paramKey="maxDraftLength"
            min={1}
            max={64}
            step={1}
          />
          <ParamToggle
            label="Visualize Draft Tokens"
            paramKey="visualizeDraftTokens"
            tooltip="Show which tokens came from the draft model."
          />
        </Section>
      </div>
    </div>
  )
}
