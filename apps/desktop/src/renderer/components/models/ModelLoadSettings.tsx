import { useState } from 'react'
import { ArrowLeft, Loader2, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { ModelMetadata } from '../../services/modelManagerAPI'
import {
  useModelParamsStore,
  DEFAULT_LOAD_CONFIG,
  ModelLoadConfig,
} from '../../store/modelParamsStore'

/* ------------------------------------------------------------------ */
/*  Reusable building blocks                                          */
/* ------------------------------------------------------------------ */

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix = '',
  tooltip,
  disabled,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  suffix?: string
  tooltip?: string
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-sm text-text-primary">{label}</span>
        {tooltip && (
          <span title={tooltip} className="text-text-muted cursor-help">
            <HelpCircle size={13} />
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 flex-1 justify-end">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          disabled={disabled}
          className="flex-1 max-w-[200px] accent-accent-500 cursor-pointer disabled:opacity-40"
          aria-label={label}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => {
            const n = Number(e.target.value)
            if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)))
          }}
          disabled={disabled}
          className="w-[80px] text-right bg-bg-surface-2 border border-border-default rounded px-2 py-1 text-sm text-text-primary disabled:opacity-40"
          aria-label={`${label} value`}
        />
        {suffix && <span className="text-xs text-text-muted w-6">{suffix}</span>}
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
  tooltip,
  badge,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  tooltip?: string
  badge?: string
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-text-primary">{label}</span>
        {tooltip && (
          <span title={tooltip} className="text-text-muted cursor-help">
            <HelpCircle size={13} />
          </span>
        )}
        {badge && (
          <span className="text-[10px] px-1.5 py-0.5 bg-bg-surface-2 border border-border-default rounded text-text-muted">
            {badge}
          </span>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer disabled:opacity-40 ${
          checked ? 'bg-accent-500' : 'bg-bg-surface-3 border border-border-default'
        }`}
        aria-label={label}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

function SelectRow({
  label,
  value,
  options,
  onChange,
  tooltip,
  badge,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
  tooltip?: string
  badge?: string
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-text-primary">{label}</span>
        {tooltip && (
          <span title={tooltip} className="text-text-muted cursor-help">
            <HelpCircle size={13} />
          </span>
        )}
        {badge && (
          <span className="text-[10px] px-1.5 py-0.5 bg-bg-surface-2 border border-border-default rounded text-text-muted">
            {badge}
          </span>
        )}
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-bg-surface-2 border border-border-default rounded px-2 py-1 text-sm text-text-primary cursor-pointer"
        aria-label={label}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">{label}</span>
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

interface ModelLoadSettingsProps {
  model: ModelMetadata
  onBack: () => void
  onLoad: (config: ModelLoadConfig) => void
  isLoading: boolean
}

export function ModelLoadSettings({ model, onBack, onLoad, isLoading }: ModelLoadSettingsProps) {
  const { getLoadConfig, setLoadConfig, showAdvancedLoad, setShowAdvancedLoad } = useModelParamsStore()
  const config = getLoadConfig(model.id)
  const [rememberSettings, setRememberSettings] = useState(true)

  const sizeGb = model.size_bytes ? (model.size_bytes / 1e9).toFixed(2) : '?'

  // Estimate memory usage (rough)
  const estimatedVramGb = config.gpuOffloadLayers > 0
    ? ((model.size_bytes || 0) / 1e9) * (config.gpuOffloadLayers / 32)
    : 0
  const estimatedTotalGb = (model.size_bytes || 0) / 1e9

  function update(partial: Partial<ModelLoadConfig>) {
    if (rememberSettings) {
      setLoadConfig(model.id, partial)
    }
    // Force re-render with new values
    setLoadConfig(model.id, partial)
  }

  function handleLoad() {
    if (rememberSettings) {
      setLoadConfig(model.id, config)
    }
    onLoad(config)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border-default bg-bg-surface-1">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-bg-surface-2 rounded transition cursor-pointer"
          aria-label="Back to model list"
        >
          <ArrowLeft size={18} className="text-text-secondary" />
        </button>
        <h2 className="text-lg font-semibold text-text-primary">{model.name}</h2>
      </div>

      {/* Scrollable settings */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
        {/* Memory Estimate Bar */}
        <div className="bg-bg-surface-2 rounded-lg border border-border-default p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-primary">
              Estimated Memory Usage
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-accent-500/20 text-accent-400 rounded font-medium">
              Beta
            </span>
          </div>
          <div className="flex gap-6">
            <div>
              <span className="text-xs text-text-muted font-semibold">GPU</span>
              <span className="ml-2 text-sm text-text-primary font-medium">
                {estimatedVramGb.toFixed(2)} GB
              </span>
            </div>
            <div>
              <span className="text-xs text-text-muted font-semibold">Total</span>
              <span className="ml-2 text-sm text-text-primary font-medium">
                {estimatedTotalGb.toFixed(2)} GB
              </span>
            </div>
          </div>
        </div>

        {/* Core settings */}
        <SliderRow
          label="Context Length"
          tooltip="Maximum number of tokens the model can process. Higher values use more memory."
          value={config.contextLength}
          min={256}
          max={262144}
          step={256}
          onChange={v => update({ contextLength: v })}
        />
        <div className="text-[11px] text-text-muted pl-1 -mt-1 mb-1">
          Model supports up to <span className="bg-bg-surface-2 px-1 rounded">{262144}</span> tokens
        </div>

        <SliderRow
          label="GPU Offload"
          tooltip="Number of layers to offload to GPU. More layers = faster but more VRAM."
          value={config.gpuOffloadLayers}
          min={0}
          max={64}
          onChange={v => update({ gpuOffloadLayers: v })}
        />
        <div className="text-[11px] text-text-muted pl-1 -mt-1 mb-1">
          Offloading is limited to dedicated GPU memory. Actual layers may vary.
        </div>

        <SliderRow
          label="CPU Thread Pool Size"
          tooltip="Number of CPU threads for computation."
          value={config.cpuThreads}
          min={1}
          max={32}
          onChange={v => update({ cpuThreads: v })}
        />

        <SliderRow
          label="Eval Batch Size"
          tooltip="Number of tokens to evaluate in parallel."
          value={config.evalBatchSize}
          min={32}
          max={2048}
          step={32}
          onChange={v => update({ evalBatchSize: v })}
        />

        <SliderRow
          label="Max Concurrent Predictions"
          tooltip="Maximum number of parallel prediction streams."
          value={config.maxConcurrentPredictions}
          min={1}
          max={16}
          onChange={v => update({ maxConcurrentPredictions: v })}
        />

        <ToggleRow
          label="Unified KV Cache"
          checked={config.unifiedKvCache}
          onChange={v => update({ unifiedKvCache: v })}
          tooltip="Use a single unified key-value cache for all layers."
          badge="Experimental"
        />

        {/* RoPE settings */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-text-primary">RoPE Frequency Base</span>
            <span title="Rotary position embedding base frequency. 0 = auto." className="text-text-muted cursor-help">
              <HelpCircle size={13} />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={config.ropeFrequencyBase}
              onChange={e => update({ ropeFrequencyBase: Number(e.target.value) || 0 })}
              className="w-[80px] text-right bg-bg-surface-2 border border-border-default rounded px-2 py-1 text-sm text-text-primary"
              aria-label="RoPE Frequency Base"
            />
            <span className="text-xs text-text-muted w-10 text-right">
              {config.ropeFrequencyBase === 0 ? 'Auto' : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-text-primary">RoPE Frequency Scale</span>
            <span title="Rotary position embedding scale factor. 0 = auto." className="text-text-muted cursor-help">
              <HelpCircle size={13} />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={config.ropeFrequencyScale}
              onChange={e => update({ ropeFrequencyScale: Number(e.target.value) || 0 })}
              className="w-[80px] text-right bg-bg-surface-2 border border-border-default rounded px-2 py-1 text-sm text-text-primary"
              aria-label="RoPE Frequency Scale"
            />
            <span className="text-xs text-text-muted w-10 text-right">
              {config.ropeFrequencyScale === 0 ? 'Auto' : ''}
            </span>
          </div>
        </div>

        <ToggleRow
          label="Offload KV Cache to GPU Memory"
          checked={config.kvOffloadToGpu}
          onChange={v => update({ kvOffloadToGpu: v })}
          tooltip="Keep the KV cache in GPU VRAM for faster access."
        />

        <ToggleRow
          label="Keep Model in Memory"
          checked={config.keepInMemory}
          onChange={v => update({ keepInMemory: v })}
          tooltip="Keep the model loaded in memory between inference calls."
        />

        <ToggleRow
          label="Try mmap()"
          checked={config.useMmap}
          onChange={v => update({ useMmap: v })}
          tooltip="Use memory-mapped files for faster model loading."
        />

        {/* Seed */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-text-primary">Seed</span>
            <span title="Random seed for reproducibility. -1 = random." className="text-text-muted cursor-help">
              <HelpCircle size={13} />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={config.seed}
              onChange={e => update({ seed: Number(e.target.value) })}
              className="w-[100px] text-right bg-bg-surface-2 border border-border-default rounded px-2 py-1 text-sm text-text-primary"
              aria-label="Seed"
            />
            <span className="text-xs text-text-muted w-16 text-right">
              {config.seed === -1 ? 'Random' : ''}
            </span>
          </div>
        </div>

        <ToggleRow
          label="Flash Attention"
          checked={config.flashAttention}
          onChange={v => update({ flashAttention: v })}
          tooltip="Enable flash attention for faster inference with less memory."
        />

        {/* Advanced section */}
        <button
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary pt-4 pb-2 transition cursor-pointer w-full"
          onClick={() => setShowAdvancedLoad(!showAdvancedLoad)}
          aria-expanded={showAdvancedLoad}
        >
          {showAdvancedLoad ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span className="font-medium">Advanced Settings</span>
        </button>

        {showAdvancedLoad && (
          <div className="space-y-0 pl-2 border-l-2 border-border-default ml-1">
            <SelectRow
              label="K Cache Quantization Type"
              value={config.kCacheQuantType}
              options={[
                { value: 'f16', label: 'F16' },
                { value: 'q8_0', label: 'Q8_0' },
                { value: 'q4_0', label: 'Q4_0' },
              ]}
              onChange={v => update({ kCacheQuantType: v })}
              tooltip="Quantization type for the key cache. Lower precision saves memory."
              badge="Experimental"
            />
            <SelectRow
              label="V Cache Quantization Type"
              value={config.vCacheQuantType}
              options={[
                { value: 'f16', label: 'F16' },
                { value: 'q8_0', label: 'Q8_0' },
                { value: 'q4_0', label: 'Q4_0' },
              ]}
              onChange={v => update({ vCacheQuantType: v })}
              tooltip="Quantization type for the value cache. Lower precision saves memory."
              badge="Experimental"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border-default bg-bg-surface-1 px-6 py-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberSettings}
              onChange={e => setRememberSettings(e.target.checked)}
              className="cursor-pointer accent-accent-500"
            />
            <span className="text-xs text-text-secondary">
              Remember settings for <span className="font-medium text-text-primary">{model.name}</span>
            </span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary border border-border-default rounded transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleLoad}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 bg-accent-500 hover:bg-accent-600 disabled:bg-text-muted text-white text-sm font-medium rounded transition disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              Load Model
              <span className="text-[10px] opacity-70 ml-1">Ctrl + Enter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
